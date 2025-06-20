import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import {
  comparePassword,
  generateJwt,
  generateRefreshToken,
  hashPassword,
} from "../utils/auth.utils";
import { db } from "../db";
import { roleEnum, users } from "../db/schema/users.schema";
import { eq, gt, and } from "drizzle-orm";
import { emailVerificationTokens } from "../db/schema/email_verification_tokens.schema";
import { sendVerificationEmail } from "../services/email.service";
import { refreshTokens } from "../db/schema/refresh_tokens.schema";
import { googleOAuthCredentials } from "../db/schema/google_oauth_credentials.schema";
import { facebookOAuthCredentials } from "../db/schema/facebook_oauth_credentials.schema";

import {
  User,
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  RegisterResult,
  LoginResult,
  RefreshTokenResult,
  GoogleAuthResult,
  FacebookAuthResult,
  Role,
} from "../types/auth.types";

export const register = async ({
  username,
  email,
  password,
  role,
}: RegisterInput): Promise<RegisterResult> => {
  if (!roleEnum.enumValues.includes(role)) {
    throw new Error(
      `Invalid role. Must be one of: ${roleEnum.enumValues.join(", ")}`,
    );
  }

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (existingUser.length > 0) {
    throw new Error("User already exists");
  }

  const passwordHash = await hashPassword(password);
  const verificationToken = uuidv4();

  let userResult;
  if (role === "renter_buyer") {
    userResult = await db
      .insert(users)
      .values({ username, email, passwordHash, role, listingLimit: 5 })
      .returning();
  } else if (role === "agency") {
    userResult = await db
      .insert(users)
      .values({ username, email, passwordHash, role, listingLimit: 1000 })
      .returning();
  } else {
    userResult = await db
      .insert(users)
      .values({ username, email, passwordHash, role, listingLimit: -1 })
      .returning();
  }

  const user: User = userResult[0];
  const userId = user.id;

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  if (isNaN(expiresAt.getTime())) {
    throw new Error("Invalid email verification token expiration date");
  }

  await db.insert(emailVerificationTokens).values({
    userId,
    token: verificationToken,
    expiresAt,
  });

  await sendVerificationEmail(email, verificationToken);
  console.log(`Stored token for user ${userId}: ${verificationToken}`);

  return { userId };
};

export const verifyEmail = async (token: string): Promise<void> => {
  if (!token || typeof token !== "string") {
    throw new Error("Invalid token format");
  }

  console.log(`Verifying token: ${token}`);

  const tokenResult = await db
    .select({ userId: emailVerificationTokens.userId })
    .from(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.token, token),
        gt(emailVerificationTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (tokenResult.length === 0) {
    const userResult = await db
      .select({ isEmailVerified: users.isEmailVerified })
      .from(users)
      .where(
        eq(
          users.id,
          db
            .select({ userId: emailVerificationTokens.userId })
            .from(emailVerificationTokens)
            .where(eq(emailVerificationTokens.token, token)),
        ),
      );

    if (userResult.length > 0 && userResult[0].isEmailVerified) {
      console.log(`User already verified for token: ${token}`);
      return;
    }

    console.log(`Token not found or expired: ${token}`);
    throw new Error("Invalid or expired token");
  }

  const userId = tokenResult[0].userId;

  await db
    .update(users)
    .set({ isEmailVerified: true })
    .where(eq(users.id, userId));

  await db
    .delete(emailVerificationTokens)
    .where(eq(emailVerificationTokens.token, token));

  console.log(`Email verified for user ${userId}`);
};

export const login = async ({
  email,
  password,
}: LoginInput): Promise<LoginResult> => {
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.email, email));
  const user = userResult[0];

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.isEmailVerified) {
    throw new Error("Please verify your email");
  }

  if (!(await comparePassword(password, user.passwordHash || ""))) {
    throw new Error("Incorrect password");
  }

  const accessToken = generateJwt(user.id, email);
  const refreshToken = await generateRefreshToken(user.id);

  return { accessToken, refreshToken };
};

export const refreshToken = async ({
  refreshToken,
}: RefreshTokenInput): Promise<RefreshTokenResult> => {
  const tokenResults = await db
    .select({ userId: refreshTokens.userId })
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.token, refreshToken),
        gt(refreshTokens.expiresAt, new Date()),
        eq(refreshTokens.revoked, false),
      ),
    );

  if (!tokenResults.length) {
    throw new Error("Invalid or expired refresh token");
  }

  const userId = tokenResults[0].userId;

  const user = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId));

  if (!user.length) {
    throw new Error("User not found");
  }

  await db
    .update(refreshTokens)
    .set({ revoked: true })
    .where(
      and(
        eq(refreshTokens.token, refreshToken),
        eq(refreshTokens.userId, userId),
      ),
    );

  const accessToken = generateJwt(userId, user[0].email);
  const newRefreshToken = await generateRefreshToken(userId);

  return { accessToken, refreshToken: newRefreshToken };
};

export const googleAuth = async (
  code: string,
  role?: Role,
): Promise<GoogleAuthResult> => {
  try {
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      },
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    const userInfoResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      },
    );

    const { id: google_id, email } = userInfoResponse.data;

    let userResult = await db
      .select({
        id: users.id,
        isEmailVerified: users.isEmailVerified,
        role: users.role,
      })
      .from(users)
      .where(eq(users.email, email));

    let userId: string;
    let isNewUser = false;

    let existingGoogleCredential = await db
      .select({
        userId: googleOAuthCredentials.userId,
      })
      .from(googleOAuthCredentials)
      .where(eq(googleOAuthCredentials.googleId, google_id));

    if (userResult.length === 0) {
      if (!role) {
        throw new Error("Role is required for new user registration");
      }

      const userResult = await db
        .insert(users)
        .values({
          email,
          isEmailVerified: true,
          username: email.split("@")[0],
          role,
        })
        .returning();
      userId = userResult[0].id;
      isNewUser = true;
    } else {
      userId = userResult[0].id;

      if (
        existingGoogleCredential.length > 0 &&
        existingGoogleCredential[0].userId !== userId
      ) {
        throw new Error(
          "This Google account is already linked to another user",
        );
      }

      if (role && userResult[0].role !== role) {
        throw new Error(
          `Account already exists with a different role: ${userResult[0].role}`,
        );
      }
      await db
        .update(users)
        .set({ isEmailVerified: true })
        .where(eq(users.id, userId));
    }

    await db
      .insert(googleOAuthCredentials)
      .values({
        userId,
        googleId: google_id,
        accessToken: access_token,
        refreshToken: refresh_token || null,
        tokenExpiry: new Date(Date.now() + expires_in * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: googleOAuthCredentials.userId,
        set: {
          googleId: google_id,
          accessToken: access_token,
          refreshToken: refresh_token || null,
          tokenExpiry: new Date(Date.now() + expires_in * 1000),
          updatedAt: new Date(),
        },
      });

    const accessToken = generateJwt(userId, email);
    const refreshToken = await generateRefreshToken(userId);

    return {
      accessToken,
      refreshToken,
      isNewUser,
    };
  } catch (error) {
    console.error("Error in googleAuth:", error);
    throw error;
  }
};

export const facebookAuth = async (
  code: string,
  role?: Role,
): Promise<FacebookAuthResult> => {
  try {
    if (!code) {
      throw new Error("Authorization code is missing");
    }

    const tokenResponse = await axios.post(
      "https://graph.facebook.com/v20.0/oauth/access_token",
      {
        code,
        client_id: process.env.FACEBOOK_CLIENT_ID,
        client_secret: process.env.FACEBOOK_CLIENT_SECRET,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI || "postmessage",
        grant_type: "authorization_code",
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    const { access_token, expires_in } = tokenResponse.data;

    const userInfoResponse = await axios.get("https://graph.facebook.com/me", {
      params: {
        fields: "id,email",
        access_token,
      },
    });

    const { id: facebook_id, email } = userInfoResponse.data;

    let userResult = await db
      .select({
        id: users.id,
        isEmailVerified: users.isEmailVerified,
        role: users.role,
      })
      .from(users)
      .where(eq(users.email, email));

    let userId: string;
    let isNewUser = false;

    let existingFacebookCredential = await db
      .select({
        userId: facebookOAuthCredentials.userId,
      })
      .from(facebookOAuthCredentials)
      .where(eq(facebookOAuthCredentials.facebookId, facebook_id));

    if (userResult.length === 0) {
      if (!role) {
        throw new Error("Role is required for new user registration");
      }

      const userResult = await db
        .insert(users)
        .values({
          email,
          isEmailVerified: true,
          username: email.split("@")[0],
          role: role,
        })
        .returning();
      userId = userResult[0].id;
      isNewUser = true;
    } else {
      userId = userResult[0].id;

      if (
        existingFacebookCredential.length > 0 &&
        existingFacebookCredential[0].userId !== userId
      ) {
        throw new Error(
          "This Facebook account is already linked to another user",
        );
      }

      if (role && userResult[0].role !== role) {
        throw new Error(
          `Account already exists with a different role: ${userResult[0].role}`,
        );
      }

      await db
        .update(users)
        .set({ isEmailVerified: true })
        .where(eq(users.id, userId));
    }

    await db
      .insert(facebookOAuthCredentials)
      .values({
        userId,
        facebookId: facebook_id,
        accessToken: access_token,
        tokenExpiry: expires_in
          ? new Date(Date.now() + expires_in * 1000)
          : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: facebookOAuthCredentials.userId,
        set: {
          facebookId: facebook_id,
          accessToken: access_token,
          tokenExpiry: expires_in
            ? new Date(Date.now() + expires_in * 1000)
            : null,
          updatedAt: new Date(),
        },
      });

    const accessToken = generateJwt(userId, email);
    const refreshToken = await generateRefreshToken(userId);

    return {
      accessToken,
      refreshToken,
      isNewUser,
    };
  } catch (error: any) {
    console.error("Error in facebookAuth:", error);
    throw error;
  }
};
