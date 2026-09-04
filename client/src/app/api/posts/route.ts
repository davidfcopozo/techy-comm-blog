import axios from "axios";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({
      req: req,
      secret: process.env.NEXTAUTH_SECRET || process.env.NEXT_PUBLIC_NEXTAUTH_SECRET,
    });

    const headers: any = {
      "Content-Type": "application/json",
    };

    if (token?.accessToken) {
      headers.Authorization = `Bearer ${token.accessToken}`;
    }

    if (token?.sub) {
      headers["X-User-ID"] = token.sub;
    } else {
      console.log("❌ No token or token.sub found for posts request");
    }

    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/posts`,
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

export async function POST(req: NextRequest) {
  const token = await getToken({
    req: req,
    secret: process.env.NEXTAUTH_SECRET || process.env.NEXT_PUBLIC_NEXTAUTH_SECRET,
  });

  if (!token) {
    return new Response(JSON.stringify({ message: "No token found" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/posts`,
      body,
      {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
        },
      }
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
