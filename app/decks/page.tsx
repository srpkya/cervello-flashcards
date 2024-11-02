import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getDecks } from '@/lib/db'
import { ExtendedSession, Deck } from '@/lib/types'
import { SignInButton } from '@/components/SignInButton'
import DecksClient from './DecksClient'

export default async function DecksPage() {
  const session = await getServerSession(authOptions) as ExtendedSession | null;

  if (!session || !session.user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl mb-4">Please sign in to view your decks</h1>
        <SignInButton />
      </div>
    );
  }

  const rawDecks = await getDecks(session.user.id) || [];

  const decks: Deck[] = rawDecks.map(deck => ({
    ...deck,
    createdAt: new Date(deck.createdAt),
    updatedAt: new Date(deck.updatedAt),
    labels: Array.isArray(deck.labels) 
      ? deck.labels.filter((label): label is string => 
          typeof label === 'string' && label.length > 0
        )
      : []
  }));

  return <DecksClient initialDecks={decks} />;
}