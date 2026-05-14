import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { apiError } from "@/lib/api-helpers";

const GENERIC_AUTH_ERROR = "Invalid email or password";

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body");
  }

  const { email, password } = body;

  if (!email || !password) {
    return apiError(GENERIC_AUTH_ERROR, 401);
  }

  const db = getDb();
  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.toLowerCase()) as
    | { id: string; email: string; password_hash: string }
    | undefined;

  // Always run bcrypt to prevent timing-based user enumeration
  const passwordOk = user
    ? await verifyPassword(password, user.password_hash)
    : await verifyPassword(password, "$2b$12$invalidhashpadding00000000000000000000000000000000000000");

  if (!user || !passwordOk) {
    return apiError(GENERIC_AUTH_ERROR, 401);
  }

  const deviceLabel =
    req.headers.get("x-device-label") || "Unknown Device";
  const { tokens } = await createSession(user.id, deviceLabel);

  return NextResponse.json({ tokens });
}
