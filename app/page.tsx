import { SignInButton } from '@/components/SignInButton'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from 'next/navigation'

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/decks')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl mb-8">Welcome to Flashcard App</h1>
      <p className="text-xl mb-8">Sign in to start learning!</p>
      <SignInButton />
    </div>
  )
}