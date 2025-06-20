import type { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service";

type ExpressHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

export const register: ExpressHandler = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    await authService.register({ username, email, password, role });
    res
      .status(201)
      .json({ message: "Registration successful. Please verify your email." });
  } catch (error: any) {
    console.error("Error in register:", error);
    if (error.message === "User already exists") {
      res.status(409).json({ message: "User with this email already exists" });
    } else {
      res
        .status(500)
        .json({ message: error.message || "Internal server error" });
    }
  }
};

export const verifyEmail: ExpressHandler = async (req, res) => {
  try {
    const { token } = req.params;
    await authService.verifyEmail(token);
    res.json({ message: "Email verified successfully" });
  } catch (error: any) {
    console.error("Error in verifyEmail:", error);
    if (
      error.message === "Invalid token format" ||
      error.message === "Invalid or expired token"
    ) {
      res.status(400).json({ message: error.message });
    } else if (error.message === "Email already verified") {
      res.json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

export const login: ExpressHandler = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { accessToken, refreshToken } = await authService.login({
      email,
      password,
    });
    res.json({ accessToken, refreshToken });
  } catch (error: any) {
    console.error("Error in login:", error);
    if (error.message === "User not found") {
      res.status(404).json({ message: "User with this email does not exist" });
    } else if (error.message === "Incorrect password") {
      res.status(401).json({ message: "Incorrect password" });
    } else if (error.message === "Please verify your email") {
      res.status(403).json({ message: "Please verify your email" });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

export const refreshToken: ExpressHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const { accessToken, refreshToken: newRefreshToken } =
      await authService.refreshToken({
        refreshToken,
      });

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error: any) {
    console.error("Error in refreshToken:", error);
    if (error.message === "Invalid or expired refresh token") {
      res.status(401).json({ message: error.message });
    } else if (error.message === "User not found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

export const googleAuth: ExpressHandler = async (req, res) => {
  try {
    const { code, role } = req.body;

    if (!code) {
      res.status(400).json({ message: "Authorization code is required" });
      return;
    }
    const { accessToken, refreshToken, isNewUser } =
      await authService.googleAuth(code, role);

    res.json({
      accessToken,
      refreshToken,
      isNewUser,
      message: isNewUser
        ? "User created and logged in via Google"
        : "Logged in via Google",
    });
  } catch (error: any) {
    console.error("Error in googleAuth:", error);
    if (
      error.message === "Role is required for new user registration" ||
      error.message.includes("Account already exists with a different role") ||
      error.message === "This Google account is already linked to another user"
    ) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Google authentication failed" });
    }
  }
};

export const facebookAuth: ExpressHandler = async (req, res) => {
  try {
    const { code, role } = req.body;
    if (!code) {
      res.status(400).json({ message: "Authorization code is required" });
      return;
    }

    const result = await authService.facebookAuth(code, role);

    res.json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      isNewUser: result.isNewUser,
      message: result.isNewUser
        ? "User created and logged in via Facebook"
        : "Logged in via Facebook",
    });
  } catch (error: any) {
    console.error("Error in facebookAuth:", error);
    if (
      error.message === "Role is required for new user registration" ||
      error.message.includes("Account already exists with a different role") ||
      error.message ===
        "This Facebook account is already linked to another user"
    ) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Facebook authentication failed" });
    }
  }
};
