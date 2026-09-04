import axios from "axios";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string; commentId: string }> }
) {
  const params = await props.params;
  const { id: postId, commentId } = params;
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
    const res = await axios.delete(
      `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/comments/${postId}/${commentId}`,
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

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string; commentId: string }> }
) {
  const params = await props.params;
  const { id: postId, commentId } = params;
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
    const { content } = body;

    const res = await axios.patch(
      `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/comments/${postId}/${commentId}`,
      { content },
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
