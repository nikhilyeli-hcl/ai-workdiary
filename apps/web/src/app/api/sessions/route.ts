import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError } from "@/lib/api-helpers";
import {
  getActiveSessions,
  revokeSessionForUser,
  revokeAllUserSessions,
} from "@/lib/auth";
import type { JWTPayload } from "@/types";

// GET /api/sessions – list active sessions for the current user
export const GET = withAuth(
  async (_req: NextRequest, payload: JWTPayload): Promise<NextResponse> => {
    const sessions = getActiveSessions(payload.sub);
    // Never expose refresh token hashes to the client
    const safe = sessions.map(({ refresh_token_hash: _, ...s }) => ({
      ...s,
      is_current: s.id === payload.session_id,
    }));
    return NextResponse.json({ sessions: safe });
  }
);

// DELETE /api/sessions?id=<sessionId>  – revoke one session
// DELETE /api/sessions?all=1           – revoke all sessions for this user
export const DELETE = withAuth(
  async (req: NextRequest, payload: JWTPayload): Promise<NextResponse> => {
    const url = new URL(req.url);
    const all = url.searchParams.get("all");
    const targetId = url.searchParams.get("id");

    if (all === "1") {
      revokeAllUserSessions(payload.sub);
      return NextResponse.json({ message: "All sessions revoked" });
    }

    if (!targetId) {
      return apiError("Provide ?id=<sessionId> or ?all=1");
    }

    if (!revokeSessionForUser(targetId, payload.sub)) {
      return apiError("Session not found", 404);
    }
    return NextResponse.json({ message: "Session revoked" });
  }
);
