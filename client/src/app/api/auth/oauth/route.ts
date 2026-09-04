import axios from "axios";
import { NextRequest } from "next/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/auth/oauth`,
      body,
      { timeout: 20000 }
    );

    return new Response(JSON.stringify(res.data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: Error | any) {
    /* console.error(
      "OAuth Next.JS ERROR:",
      error.response?.data || error.message || error
    ); */
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
