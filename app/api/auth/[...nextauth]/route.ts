import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const handler = async (req: Request, context: { params: { nextauth: string[] } }) => {
  return NextAuth(authOptions)(req, context);
}

export { handler as GET, handler as POST }