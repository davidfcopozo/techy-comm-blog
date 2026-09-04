import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT ||
  "http://localhost:8000/api/v1";

export async function PATCH(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || process.env.NEXT_PUBLIC_NEXTAUTH_SECRET,
  });

  if (!token) {
    return NextResponse.json({ error: "No token found" }, { status: 401 });
  }

  try {
    const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.accessToken}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to mark all notifications as read" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
