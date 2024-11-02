import { getDeck, getFlashcards } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import DeckPageClient from './DeckPageClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Deck, Flashcard } from '@/lib/types';

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
          <p className="text-gray-600 mb-4">You don&apos;t have permission to view this deck.</p>
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
    createdAt: new Date(Number(deckData.createdAt)),
    updatedAt: new Date(Number(deckData.updatedAt))
  };

  const rawFlashcards = await getFlashcards(params.id);
  const flashcards: Flashcard[] = rawFlashcards.map(card => ({
    ...card,
    createdAt: Number(card.createdAt),
    updatedAt: Number(card.updatedAt),
    lastReviewed: card.lastReviewed ? Number(card.lastReviewed) : null,
    nextReview: card.nextReview ? Number(card.nextReview) : null,
    stability: Number(card.stability),
    difficulty: Number(card.difficulty),
    elapsedDays: Number(card.elapsedDays),
    scheduledDays: Number(card.scheduledDays),
    reps: Number(card.reps),
    lapses: Number(card.lapses),
    interval: Number(card.interval),
    easeFactor: Number(card.easeFactor)
  }));

  return <DeckPageClient initialDeck={deck} initialFlashcards={flashcards} />;
}