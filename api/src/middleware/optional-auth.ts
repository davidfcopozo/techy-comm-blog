import { NextFunction, Response } from "express";
import { isTokenValid } from "../utils/jwt";
import { JwtPayload } from "jsonwebtoken";

/**
 * Optional authentication middleware
 * Sets userId if valid token is present, but doesn't throw error if not authenticated
 */
export const optionalAuth = (
  req: Request | any,
  _res: Response,
  next: NextFunction
) => {
  let token: string | undefined;

  const authCookie = req.signedCookies;
  if (authCookie && authCookie.token) {
    token = authCookie.token;
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (token) {
    try {
      const payload = isTokenValid(token) as JwtPayload;
      if (payload && payload.userId) {
        req.userId = payload.userId;
        req.user = payload;
      }
    } catch (error) {
      // Invalid token, continue without user ID
    }
  }

  next();
};
