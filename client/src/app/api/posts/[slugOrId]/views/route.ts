import axios from "axios";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ slugOrId: string }> }
) {
  const params = await props.params;
  const { slugOrId } = params;

  if (!slugOrId) {
    return new Response(JSON.stringify({ message: "No post ID found" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const token = await getToken({
      req: req,
      secret:
        process.env.NEXTAUTH_SECRET || process.env.NEXT_PUBLIC_NEXTAUTH_SECRET,
    });

    const body = await req.json().catch(() => ({}));

    const forwardedFor =
      req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
    const userAgent = req.headers.get("user-agent");
    const referer = req.headers.get("referer");
    const sessionId = req.headers.get("x-session-id") || body.sessionId;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (forwardedFor) headers["x-forwarded-for"] = forwardedFor;
    if (userAgent) headers["user-agent"] = userAgent;
    if (referer) headers["referer"] = referer;
    if (sessionId) headers["x-session-id"] = sessionId;

    if (token?.accessToken) {
      headers.Authorization = `Bearer ${token.accessToken}`;
    }

    const userId =
      (token?.id as string) ||
      (token?.sub as string) ||
      req.headers.get("x-user-id");
    if (userId) {
      headers["X-User-ID"] = userId;
    }

    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT ||
      "http://localhost:8000/api/v1";

    const res = await axios.post(
      `${backendUrl}/analytics/posts/${slugOrId}/views`,
      {
        ...body,
        sessionId,
      },
      { headers }
    );

    return new Response(JSON.stringify(res.data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to record view",
      }),
      {
        status: error.response?.status || 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
