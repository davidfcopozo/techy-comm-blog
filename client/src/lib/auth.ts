import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import axios from "axios";
import { ApiError } from "./errors/ApiError";
const backendUrl =
  process.env.BACKEND_API_ENDPOINT ||
  process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT ||
  "http://localhost:8000/api/v1";

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.NEXT_PUBLIC_GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET || process.env.NEXT_PUBLIC_GITHUB_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email",
        },
      },
    }),
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw ApiError.BadRequest("Email and password are required");
          }
          const res = await axios.post(`${backendUrl}/auth/login`, {
            email: credentials.email,
            password: credentials.password,
          });

          const user = res.data;

          if (res.status === 200 && user) {
            return {
              id: user.id,
              email: credentials.email,
              role: user.role,
              accessToken: user.accessToken,
            };
          } else {
            return null;
          }
        } catch (error) {
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
    verifyRequest: "/auth/verify-request",
    newUser: "/profile",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (account && account.provider !== "credentials") {
          if (!user.email && account.provider === "github" && account.access_token) {
            try {
              const emailsRes = await axios.get("https://api.github.com/user/emails", {
                headers: {
                  Authorization: `Bearer ${account.access_token}`,
                  "User-Agent": "NextAuth",
                },
              });
              const emails = emailsRes.data;
              if (Array.isArray(emails) && emails.length > 0) {
                const primaryEmailObj =
                  emails.find((e: any) => e.primary && e.verified) ||
                  emails.find((e: any) => e.primary) ||
                  emails[0];
                if (primaryEmailObj?.email) {
                  user.email = primaryEmailObj.email;
                }
              }
            } catch (err) {
              console.error("Failed to fetch GitHub private email:", err);
            }
          }

          // Fallback if email is still missing (e.g. GitHub App without email permission or private email)
          if (!user.email && account.provider === "github") {
            const username = (profile as any)?.login || account.providerAccountId;
            user.email = `${username}@users.noreply.github.com`;
          }

          if (!user.email) {
            return false;
          }

          const res = await axios.post(`${backendUrl}/auth/oauth`, {
            provider: account.provider,
            email: user.email,
            name: user.name,
            avatar: user.image,
          });

          if (res.status === 200) {
            user.id = res.data.id;
            user.role = res.data.role;
            user.accessToken = res.data.accessToken;
            return true;
          }
        }
        return true;
      } catch (error: any) {
        return `/login?error=${encodeURIComponent(
          error.response?.data?.msg || "Sign-in failed"
        )}`;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).accessToken = token.accessToken;
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.NEXT_PUBLIC_NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
