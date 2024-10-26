// app/review/page.tsx
import { getDeck, getFlashcards } from "@/lib/db";
import Link from "next/link";
import ReviewPageClient from "./ReviewPageClient";
import { Flashcard } from "@/lib/types";

export const revalidate = 0;

export default async function ReviewPage({ 
  searchParams 
}: { 
  searchParams: { deckId: string } 
}) {
  const deckId = searchParams.deckId;
  
  if (!deckId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-light mb-4">No deck selected for review</h2>
        <Link 
          href="/decks" 
          className="text-neutral-900 hover:text-neutral-600 transition-colors"
        >
          Go back to decks
        </Link>
      </div>
    );
  }

  let deck;
  let flashcards: Flashcard[] = [];
  let error = null;

  try {
    flashcards = await getFlashcards(deckId);
    deck = await getDeck(deckId);
    
    if (!flashcards.length) {
      console.log('No flashcards found for deckId:', deckId);
    }
  } catch (e) {
    console.error('Error in review page:', e);
    error = e;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-light mb-4">Error loading review session</h2>
        <p className="text-neutral-600 mb-4">There was a problem loading the deck or flashcards.</p>
        <Link 
          href="/decks" 
          className="text-neutral-900 hover:text-neutral-600 transition-colors"
        >
          Go back to decks
        </Link>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-light mb-4">Deck not found</h2>
        <Link 
          href="/decks" 
          className="text-neutral-900 hover:text-neutral-600 transition-colors"
        >
          Go back to decks
        </Link>
      </div>
    );
  }

  if (!flashcards.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-light mb-4">No flashcards in this deck yet</h2>
        <p className="text-neutral-600 mb-4">Add some flashcards to start reviewing!</p>
        <Link 
          href={`/decks/${deckId}`}
          className="text-neutral-900 hover:text-neutral-600 transition-colors"
        >
          Add flashcards
        </Link>
      </div>
    );
  }

  return <ReviewPageClient initialFlashcards={flashcards} deckId={deckId} />;
}