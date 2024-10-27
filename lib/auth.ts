import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb } from "./db";
import { user, account } from "./schema";
import { AdapterUser } from "next-auth/adapters";
import { eq } from "drizzle-orm";

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
    async createUser(data) {
      const db = await getDb();
      try {
        // First check if user exists
        if (data.email) {
          const existingUser = await db.select().from(user).where(eq(user.email, data.email)).get();
          if (existingUser) {
            // If user exists, return the existing user without trying to create a new one
            return {
              id: existingUser.id,
              name: existingUser.name,
              email: existingUser.email,
              emailVerified: existingUser.emailVerified,
              image: existingUser.image
            } as AdapterUser;
          }
        }

        // Only create a new user if one doesn't exist
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

    async linkAccount(data) {
      const db = await getDb();
      try {
        // Check if account already exists
        const existingAccount = await db.select()
          .from(account)
          .where(eq(account.providerAccountId, data.providerAccountId))
          .get();

        if (existingAccount) {
          // If account exists, return without trying to create a new one
          return;
        }

        const newAccount = {
          ...data,
          id: crypto.randomUUID(),
        };
        
        await db.insert(account).values(newAccount);
      } catch (error) {
        console.error("Error in linkAccount:", error);
        throw error;
      }
    },

    async getUser(id) {
      const db = await getDb();
      try {
        const result = await db.select().from(user).where(eq(user.id, id)).get();
        return result as AdapterUser | null;
      } catch (error) {
        console.error("Error in getUser:", error);
        return null;
      }
    },

    async getUserByEmail(email) {
      const db = await getDb();
      try {
        const result = await db.select().from(user).where(eq(user.email, email)).get();
        return result as AdapterUser | null;
      } catch (error) {
        console.error("Error in getUserByEmail:", error);
        return null;
      }
    },

    async updateUser(data) {
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