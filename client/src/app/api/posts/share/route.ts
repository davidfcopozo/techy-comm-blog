import axios from "axios";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { postId, shareType } = body;

    const token = await getToken({
      req: req,
      secret: process.env.NEXTAUTH_SECRET || process.env.NEXT_PUBLIC_NEXTAUTH_SECRET,
    });

    const headers: any = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token.accessToken}`;
    }

    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/posts/share`,
      { postId, shareType },
      { headers }
    );

    return new Response(JSON.stringify(res.data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: Error | any) {
    return new Response(
      JSON.stringify({
        message: error.response?.data?.message || "Internal server error",
      }),
      {
        status: error.response?.status || 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
