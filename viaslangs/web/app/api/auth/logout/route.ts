import { NextResponse } from "next/server";
import { isRequestSecure, SESSION_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const isSecure = isRequestSecure(req);
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isSecure,
    maxAge: 0,
  });
  return response;
}