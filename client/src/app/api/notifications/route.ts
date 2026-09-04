import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT ||
  "http://localhost:8000/api/v1";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "20";
  const unreadOnly = searchParams.get("unreadOnly") || "false";

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || process.env.NEXT_PUBLIC_NEXTAUTH_SECRET,
  });

  if (!token) {
    return NextResponse.json({ error: "No token found" }, { status: 401 });
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/notifications?page=${page}&limit=${limit}&unreadOnly=${unreadOnly}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
