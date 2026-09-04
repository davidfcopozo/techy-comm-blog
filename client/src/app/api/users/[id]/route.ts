import axios from "axios";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Request deduplication cache
const pendingRequests = new Map<string, Promise<any>>();

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { id } = params;

  if (!id) {
    return new Response(
      JSON.stringify({
        message: "User does't exist, has been deleted or id is incorrect",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    if (pendingRequests.has(id)) {
      const existingRequest = pendingRequests.get(id);
      const result = await existingRequest;
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create new request and cache the promise
    const requestPromise = axios
      .get(`${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/users/${id}`)
      .then((res) => {
        // Remove from cache after completion
        pendingRequests.delete(id);
        return res.data;
      })
      .catch((error) => {
        // Remove from cache on error too
        pendingRequests.delete(id);
        throw error;
      });

    pendingRequests.set(id, requestPromise);
    const result = await requestPromise;

    return new Response(JSON.stringify(result), {
      status: 200,
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

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { id } = params;
  const token = await getToken({
    req: req,
    secret: process.env.NEXTAUTH_SECRET || process.env.NEXT_PUBLIC_NEXTAUTH_SECRET,
  });

  if (!id) {
    return new Response(
      JSON.stringify({
        message: "User does't exist or has been removed",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const body = await req.json();
    const res = await axios.patch(
      `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/users/${id}`,
      body,
      {
        headers: {
          Authorization: `Bearer ${token?.accessToken}`,
        },
      }
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
