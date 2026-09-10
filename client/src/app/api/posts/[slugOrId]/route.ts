import axios from "axios";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ slugOrId: string }> }
) {
  const params = await props.params;
  const { slugOrId } = params;

  if (!slugOrId) {
    return new Response(JSON.stringify({ message: "No slug found" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const token = await getToken({
      req: req,
      secret: process.env.NEXTAUTH_SECRET || process.env.NEXT_PUBLIC_NEXTAUTH_SECRET,
    });

    const forwardedFor =
      req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
    const userAgent = req.headers.get("user-agent");
    const referer = req.headers.get("referer");
    const viewMode = req.headers.get("x-view-mode");
    const skipCount = req.headers.get("x-skip-view-count");
    const purpose = req.headers.get("x-purpose");
    const sessionId = req.headers.get("x-session-id");

    const headers: any = {
      "Content-Type": "application/json",
    };

    if (forwardedFor) headers["x-forwarded-for"] = forwardedFor;
    if (userAgent) headers["user-agent"] = userAgent;
    if (referer) headers["referer"] = referer;
    if (viewMode) headers["x-view-mode"] = viewMode;
    if (skipCount) headers["x-skip-view-count"] = skipCount;
    if (purpose) headers["x-purpose"] = purpose;
    if (sessionId) headers["x-session-id"] = sessionId;

    if (token?.accessToken) {
      headers.Authorization = `Bearer ${token.accessToken}`;
    }

    if (token?.id || token?.sub) {
      headers["X-User-ID"] = (token.id || token.sub) as string;
    }

    const search = req.nextUrl.search || "";
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/posts/${slugOrId}${search}`,
      { headers }
    );

    return new Response(JSON.stringify(res.data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: Error | any) {
    return new Response(
      JSON.stringify({
        message: error.response?.data?.msg || "Internal server error",
      }),
      {
        status: error.response?.status || 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ slugOrId: string }> }
) {
  const params = await props.params;
  const { slugOrId } = params;

  const token = await getToken({
    req: req,
    secret: process.env.NEXTAUTH_SECRET || process.env.NEXT_PUBLIC_NEXTAUTH_SECRET,
  });

  if (!slugOrId) {
    return new Response(JSON.stringify({ message: "No slug found" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!token) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();

    const headers: any = {
      Authorization: `Bearer ${token?.accessToken}`,
      "Content-Type": "application/json",
    };

    if (token?.id || token?.sub) {
      headers["X-User-ID"] = (token.id || token.sub) as string;
    }

    const res = await axios.patch(
      `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/posts/${slugOrId}`,
      body,
      { headers }
    );

    return new Response(JSON.stringify(res.data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: Error | any) {
    console.error("Update post error:", error);

    return new Response(
      JSON.stringify({
        message: error.message || "Internal server error",
        details: error.response?.data || {},
      }),
      {
        status: error.response?.status || 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ slugOrId: string }> }
) {
  const params = await props.params;
  const { slugOrId } = params;

  const token = await getToken({
    req: req,
    secret: process.env.NEXTAUTH_SECRET || process.env.NEXT_PUBLIC_NEXTAUTH_SECRET,
  });

  if (!slugOrId) {
    return new Response(JSON.stringify({ message: "No slug found" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!token) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const headers: any = {};

    if (token?.accessToken) {
      headers.Authorization = `Bearer ${token?.accessToken}`;
    }

    if (token?.id || token?.sub) {
      headers["X-User-ID"] = (token.id || token.sub) as string;
    }

    const res = await axios.delete(
      `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/posts/${slugOrId}`,
      { headers }
    );

    return new Response(JSON.stringify(res.data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: Error | any) {
    console.error("Delete post error:", error);

    return new Response(
      JSON.stringify({
        message: error.message || "Internal server error",
        details: error.response?.data || {},
      }),
      {
        status: error.response?.status || 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
