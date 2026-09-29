// Session token signing. Edge-safe (used by proxy.ts), no DB access here.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "sop_session";
export const SESSION_DAYS = 7;

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET is required in production.");
    return new TextEncoder().encode("dev-only-secret-change-me-dev-only-secret");
  }
  return new TextEncoder().encode(s);
}

export type SessionClaims = { uid: number; sv: number };

export async function signSession(claims: SessionClaims): Promise<string> {
  return new SignJWT({ sv: claims.sv })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(claims.uid))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    const uid = Number(payload.sub);
    const sv = Number(payload.sv);
    if (!Number.isInteger(uid) || !Number.isInteger(sv)) return null;
    return { uid, sv };
  } catch {
    return null;
  }
}
