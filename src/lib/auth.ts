import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/giris",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "E-posta", type: "email" },
        password: { label: "Şifre", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user) {
          return null;
        }

        const valid = await compare(credentials.password, user.passwordHash);
        if (!valid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          rank: user.rank,
          postCount: user.postCount,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.rank = (user as { rank?: string }).rank;
        token.postCount = (user as { postCount?: number }).postCount;
        token.role = (user as { role?: string }).role ?? "USER";
      }

      if (token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { rank: true, postCount: true, name: true, role: true },
        });
        if (fresh) {
          token.role = fresh.role;
          if (trigger === "update" || user) {
            token.rank = fresh.rank;
            token.postCount = fresh.postCount;
            token.name = fresh.name;
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.rank = (token.rank as string) ?? "Acemi Pin";
        session.user.postCount = (token.postCount as number) ?? 0;
        session.user.role = (token.role as string) ?? "USER";
      }
      return session;
    },
  },
};
