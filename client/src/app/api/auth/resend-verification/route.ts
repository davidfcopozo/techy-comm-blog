import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT;

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET || process.env.NEXT_PUBLIC_NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const response = await axios.post(
      `${BASE_URL}/auth/send-verification-token`,
      { email },
      {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(
      "Resend verification error:",
      error.response?.data || error.message
    );
    return NextResponse.json(
      {
        error:
          error.response?.data?.msg || "Failed to resend verification email",
      },
      { status: error.response?.status || 500 }
    );
  }
}
