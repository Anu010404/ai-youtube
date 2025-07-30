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
        jwt: async ({ token }) => {
            // Add custom logic here if needed
            const db_user = await prisma.user.findFirst({
                where: {
                    email: token.email,
                }
            })
            if (db_user) {
                token.id = db_user.id;
                token.credits = db_user.credits;
            }
            return token;
        },
        session: ({ session, token }) => {
            if (token) {
                session.user.id = token.id;
                session.user.email = token.email;
                session.user.name = token.name;
                session.user.image = token.picture;
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
        })
    ]
};

export const getAuthSession = () => {
    return getServerSession(authOptions);
};
