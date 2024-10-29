import { getDeck, getFlashcards } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import DeckPageClient from './DeckPageClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Deck } from '@/lib/types';

export default async function DeckPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/signin');
  }

  const deckData = await getDeck(params.id);

  if (!deckData) {
    notFound();
  }

  if (deckData.userId !== session.user.id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to view this deck.</p>
          <Link href="/decks">
            <Button>
              Return to My Decks
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const deck: Deck = {
    ...deckData,
    createdAt: new Date(deckData.createdAt),
    updatedAt: new Date(deckData.updatedAt)
  };

  const flashcards = await getFlashcards(params.id);

  return <DeckPageClient initialDeck={deck} initialFlashcards={flashcards} />;
}