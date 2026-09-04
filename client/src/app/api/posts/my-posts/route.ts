import axios from "axios";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const token = await getToken({
    req: req,
    secret: process.env.NEXTAUTH_SECRET || process.env.NEXT_PUBLIC_NEXTAUTH_SECRET,
  });

  if (!token) {
    return new Response(
      JSON.stringify({ message: "Authentication required" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/posts/my-posts`;
    if (status) {
      backendUrl += `?status=${status}`;
    }

    const res = await axios.get(backendUrl, {
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
      },
    });

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
