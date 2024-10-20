import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { getDb } from "./db"
import { Adapter, AdapterUser, AdapterAccount, AdapterSession, VerificationToken } from "@auth/core/adapters"
import { Awaitable } from "next-auth"

async function getAdapter(): Promise<Adapter> {
  const db = await getDb();
  return DrizzleAdapter(db) as Adapter;
}

export const authOptions: NextAuthOptions = {
  adapter: {
    createUser: async (user: Omit<AdapterUser, "id">) => {
      const adapter = await getAdapter();
      try {
        const newUser = { ...user, id: crypto.randomUUID() };
        return (await adapter.createUser?.(newUser)) as Awaitable<AdapterUser>;
      } catch (error: any) {
        if (error.message.includes('UNIQUE constraint failed: user.email')) {
          // User already exists, fetch and return the existing user
          const existingUser = await adapter.getUserByEmail?.(user.email!);
          if (existingUser) {
            return existingUser as Awaitable<AdapterUser>;
          }
        }
        // If it's a different error, or we couldn't find the existing user, rethrow
        throw error;
      }
    },
    getUser: async (id: string) => {
      const adapter = await getAdapter();
      return (adapter.getUser?.(id) ?? Promise.resolve(null)) as Awaitable<AdapterUser | null>;
    },
    getUserByEmail: async (email: string) => {
      const adapter = await getAdapter();
      return (adapter.getUserByEmail?.(email) ?? Promise.resolve(null)) as Awaitable<AdapterUser | null>;
    },
    getUserByAccount: async (providerAccountId: Pick<AdapterAccount, "provider" | "providerAccountId">) => {
      const adapter = await getAdapter();
      return (adapter.getUserByAccount?.(providerAccountId) ?? Promise.resolve(null)) as Awaitable<AdapterUser | null>;
    },
    updateUser: async (user: Partial<AdapterUser> & Pick<AdapterUser, "id">) => {
      const adapter = await getAdapter();
      return (adapter.updateUser?.(user) ?? Promise.resolve(null)) as Awaitable<AdapterUser>;
    },
    deleteUser: async (userId: string) => {
      const adapter = await getAdapter();
      return (adapter.deleteUser?.(userId) ?? Promise.resolve()) as Awaitable<void>;
    },
    linkAccount: async (account: AdapterAccount) => {
      const adapter = await getAdapter();
      const normalizedAccount: AdapterAccount = {
        ...account,
        token_type: account.token_type?.toLowerCase() as Lowercase<string> | undefined,
        // Ensure all required properties are included
        userId: account.userId,
        type: account.type,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
      };
      return (adapter.linkAccount?.(normalizedAccount) ?? Promise.resolve(normalizedAccount)) as Awaitable<AdapterAccount | null>;
    },
    unlinkAccount: async (providerAccountId: Pick<AdapterAccount, "provider" | "providerAccountId">) => {
      const adapter = await getAdapter();
      return (adapter.unlinkAccount?.(providerAccountId) ?? Promise.resolve()) as Awaitable<void>;
    },
    createSession: async (session: { sessionToken: string; userId: string; expires: Date }) => {
      const adapter = await getAdapter();
      return (adapter.createSession?.(session) ?? Promise.resolve(null)) as Awaitable<AdapterSession>;
    },
    getSessionAndUser: async (sessionToken: string) => {
      const adapter = await getAdapter();
      return (adapter.getSessionAndUser?.(sessionToken) ?? Promise.resolve(null)) as Awaitable<{ session: AdapterSession; user: AdapterUser } | null>;
    },
    updateSession: async (session: Partial<AdapterSession> & Pick<AdapterSession, "sessionToken">) => {
      const adapter = await getAdapter();
      return (adapter.updateSession?.(session) ?? Promise.resolve(null)) as Awaitable<AdapterSession | null>;
    },
    deleteSession: async (sessionToken: string) => {
      const adapter = await getAdapter();
      return (adapter.deleteSession?.(sessionToken) ?? Promise.resolve()) as Awaitable<void>;
    },
    createVerificationToken: async (token: VerificationToken) => {
      const adapter = await getAdapter();
      return (adapter.createVerificationToken?.(token) ?? Promise.resolve(null)) as Awaitable<VerificationToken | null>;
    },
    useVerificationToken: async (params: { identifier: string; token: string }) => {
      const adapter = await getAdapter();
      return (adapter.useVerificationToken?.(params) ?? Promise.resolve(null)) as Awaitable<VerificationToken | null>;
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub,
      },
    }),
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
}