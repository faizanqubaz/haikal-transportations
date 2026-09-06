
import { jwtVerify, JWTPayload } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

const secret = new TextEncoder().encode(JWT_SECRET);

export type AdminTokenPayload = JWTPayload & {
  userId: string;
  username: string;
  role: string;
};

export async function verifyAdminToken(
  token: string
): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);

    if (
      typeof payload.userId !== "string" ||
      typeof payload.username !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null;
    }

    if (payload.role !== "admin") {
      return null;
    }

    return payload as AdminTokenPayload;
  } catch (error) {
    console.error("Admin token verification failed:", error);
    return null;
  }
}

