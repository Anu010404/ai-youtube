import { NextAuthOptions } from "next-auth";
import { prisma } from "./db";
import { DefaultSession } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import Google from "next-auth/providers/google";
import { getServerSession } from "next-auth/next";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      credits: number;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    credits: number;
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      // On every request, re-validate against the database.
      const db_user = await prisma.user.findUnique({
        where: {
          email: token.email as string,
        },
      });

      if (!db_user) {
        // User not found in DB (e.g., deleted or DB was reset).
        // Throwing an error will invalidate the session and prevent further processing.
        throw new Error("User not found in database.");
      }

      // Enrich the token with the user's ID and current credits from the database.
      token.id = db_user.id;
      token.credits = db_user.credits;
      return token;
    },
    session: ({ session, token }) => {
      // The token is enriched in the `jwt` callback.
      // If we reach this point, the token is valid because the jwt callback did not throw.
      if (token) {
        session.user.id = token.id;
        session.user.credits = token.credits;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
};

export const getAuthSession = () => {
  return getServerSession(authOptions);
};
