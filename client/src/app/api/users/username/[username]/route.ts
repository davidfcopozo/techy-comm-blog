import axios from "axios";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ username: string }> }
) {
  const params = await props.params;
  const { username } = params;

  if (!username) {
    return new Response(
      JSON.stringify({
        message: "User does't exist, has been deleted or username is incorrect",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET || process.env.NEXT_PUBLIC_NEXTAUTH_SECRET,
    });

    const headers: any = {
      "Content-Type": "application/json",
    };

    // If user is authenticated, pass the user ID in headers
    if (token?.sub) {
      headers["X-User-ID"] = token.sub;
    } else {
      console.log("❌ No token or token.sub found");
    }

    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/users/username/${username}`,
      { headers }
    );

    return new Response(JSON.stringify(res.data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
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
