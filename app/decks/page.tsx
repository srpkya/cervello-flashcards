import DecksClient from './DecksClient'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getDecks } from '@/lib/db'
import { ExtendedSession } from '@/lib/types'
import { SignInButton } from '@/components/SignInButton'

export default async function DecksPage() {
  const session = await getServerSession(authOptions) as ExtendedSession | null

  if (!session || !session.user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl mb-4">Please sign in to view your decks</h1>
        <SignInButton />
      </div>
    )
  }

  const decks = await getDecks(session.user.id) || []
  
  return <DecksClient initialDecks={decks} />
}