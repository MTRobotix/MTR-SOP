import { NextResponse } from "next/server";
import { endSession, getCurrentUser } from "@/lib/auth/session";
import { client, recordLogin } from "@/lib/auth/logins";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (user) await recordLogin(user.email, "sign_out", await client(), user.id);
  await endSession();
  return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
}
