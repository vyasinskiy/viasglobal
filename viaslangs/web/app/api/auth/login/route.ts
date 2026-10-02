import { NextResponse } from "next/server";
import { passwordValid, sessionCookieOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { password?: string };
    const password = body.password || "";

    if (!passwordValid(password)) {
      return NextResponse.json(
        { success: false, error: "Invalid password" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(sessionCookieOptions());
    return response;
  } catch (error) {
    console.error("Error during login:", error);
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}