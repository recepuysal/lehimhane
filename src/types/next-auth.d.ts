import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      rank?: string;
      postCount?: number;
      role?: string;
    };
  }

  interface User {
    rank?: string;
    postCount?: number;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    rank?: string;
    postCount?: number;
    role?: string;
  }
}
