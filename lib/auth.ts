import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb } from "./db";
import { user, account } from "./schema";
import { AdapterUser } from "next-auth/adapters";
import { eq } from "drizzle-orm";

interface UserData {
  name?: string | null;
  email?: string | null;
  emailVerified?: Date | null;
  image?: string | null;
}

interface AccountData {
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token?: string | null;
  access_token?: string | null;
  expires_at?: number | null;
  token_type?: string | null;
  scope?: string | null;
  id_token?: string | null;
  session_state?: string | null;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    }
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      },
    }),
  ],
  adapter: {
    ...DrizzleAdapter(await getDb()),
    async createUser(data: UserData) {
      const db = await getDb();
      try {
        if (data.email) {
          const existingUser = await db.select().from(user).where(eq(user.email, data.email)).get();
          if (existingUser) {
            return {
              id: existingUser.id,
              name: existingUser.name,
              email: existingUser.email,
              emailVerified: existingUser.emailVerified,
              image: existingUser.image
            } as AdapterUser;
          }
        }

        const newUser = {
          id: crypto.randomUUID(),
          name: data.name,
          email: data.email,
          emailVerified: data.emailVerified,
          image: data.image
        };

        await db.insert(user).values(newUser);
        return newUser as AdapterUser;
      } catch (error) {
        console.error("Error in createUser:", error);
        throw error;
      }
    },

    async linkAccount(data: AccountData) {
      const db = await getDb();
      try {
        const existingAccount = await db.select()
          .from(account)
          .where(eq(account.providerAccountId, data.providerAccountId))
          .get();

        if (existingAccount) {
          return;
        }

        const accountData = {
          id: crypto.randomUUID(),
          userId: data.userId,
          type: data.type,
          provider: data.provider,
          providerAccountId: data.providerAccountId,
          refresh_token: data.refresh_token,
          access_token: data.access_token,
          expires_at: data.expires_at,
          token_type: data.token_type,
          scope: data.scope,
          id_token: data.id_token,
          session_state: data.session_state
        };

        await db.insert(account).values(accountData);
      } catch (error) {
        console.error("Error in linkAccount:", error);
        throw error;
      }
    },

    async getUser(id: string) {
      const db = await getDb();
      try {
        const result = await db.select().from(user).where(eq(user.id, id)).get();
        return result as AdapterUser | null;
      } catch (error) {
        console.error("Error in getUser:", error);
        return null;
      }
    },

    async getUserByEmail(email: string) {
      const db = await getDb();
      try {
        const result = await db.select().from(user).where(eq(user.email, email)).get();
        return result as AdapterUser | null;
      } catch (error) {
        console.error("Error in getUserByEmail:", error);
        return null;
      }
    },

    async updateUser(data: Partial<AdapterUser> & { id: string }) {
      const db = await getDb();
      try {
        if (!data.id) throw new Error("User ID is required");
        await db.update(user)
          .set({
            name: data.name,
            email: data.email,
            image: data.image,
            emailVerified: data.emailVerified
          })
          .where(eq(user.id, data.id));
        
        const updatedUser = await db.select().from(user).where(eq(user.id, data.id)).get();
        if (!updatedUser) throw new Error("Failed to update user");
        return updatedUser as AdapterUser;
      } catch (error) {
        console.error("Error in updateUser:", error);
        throw error;
      }
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
};