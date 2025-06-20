import { db } from "../db";
import { subscriptionPlans } from "../db/schema/subscription_plans.schema";
import { subscriptions } from "../db/schema/subscriptions.schema";
import { users } from "../db/schema/users.schema";
import { sendSubscriptionSuccessEmail } from "./email.service";
import { getAccessToken, PAYPAL_API, paypalClient } from "./paypal.service";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export const getSubscriptions = async () => {
  const subscriptinons = await db.select().from(subscriptionPlans);
  return subscriptinons;
};

export async function createSubscriptionOrder(
  amount: string,
  item: {
    name: string;
    description?: string;
    category?: "DIGITAL_GOODS" | "PHYSICAL_GOODS" | "DONATION";
  },
  currency = "USD",
) {
  const accessToken = await getAccessToken();

  const res = await paypalClient.post(
    `${PAYPAL_API}/v2/checkout/orders`,
    {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount,
            breakdown: {
              item_total: {
                currency_code: currency,
                value: amount,
              },
            },
          },
          items: [
            {
              name: item.name,
              unit_amount: {
                currency_code: currency,
                value: amount,
              },
              quantity: "1",
              description: item.description,
              category: item.category || "DIGITAL_GOODS",
            },
          ],
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
            brand_name: "EstateFlow",
            locale: "en-US",
            landing_page: "LOGIN",
            user_action: "PAY_NOW",
            return_url: `${process.env.FRONTEND_URL}/complete-subscription`,
            cancel_url: `${process.env.FRONTEND_URL}/cancel-subscription`,
          },
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  return res.data;
}

export async function captureSubscriptionOrder(
  orderId: string,
  userId: string,
  subscriptionPlanId: string,
  email?: string,
) {
  const accessToken = await getAccessToken();

  try {
    const res = await paypalClient.post(
      `${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    const orderDetails = {
      id: res.data.id,
      status: res.data.status,
      createTime: res.data.create_time,
      updateTime: res.data.update_time,
    };

    const customerEmail = email || res.data.payer?.email_address;

    if (orderDetails.status === "COMPLETED" && customerEmail) {
      await createSubscription(userId, subscriptionPlanId, orderDetails.id);
      await sendSubscriptionSuccessEmail(
        customerEmail,
        orderDetails,
        subscriptionPlanId,
      );
    }

    return orderDetails;
  } catch (error: any) {
    console.error(
      "Failed to capture subscription order:",
      error.response?.data || error.message,
    );
    throw new Error(
      error.response?.data?.message ||
        "Failed to capture PayPal subscription order",
    );
  }
}

async function createSubscription(
  userId: string,
  subscriptionPlanId: string,
  paypalSubscriptionId: string,
) {
  const plan = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.id, subscriptionPlanId))
    .then((rows) => rows[0]);

  if (!plan) {
    throw new Error("Subscription plan not found");
  }

  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(now.getDate() + Number(plan.durationDays));

  await db.insert(subscriptions).values({
    id: uuidv4(),
    userId,
    subscriptionPlanId,
    paypalSubscriptionId,
    status: "active",
    startDate: now,
    endDate,
    createdAt: now,
    updatedAt: now,
  });

  await db
    .update(users)
    .set({
      role: "agency",
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}
