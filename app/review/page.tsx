import { getDeck, getFlashcards } from "@/lib/db";
import Link from "next/link";
import ReviewPageClient from "./ReviewPageClient";
import { Flashcard } from "@/lib/types";

// Add cache busting for this route
export const revalidate = 0;

export default async function ReviewPage({ 
  searchParams 
}: { 
  searchParams: { deckId: string } 
}) {
  const deckId = searchParams.deckId;
  
  console.log('Review page - deckId:', deckId);

  if (!deckId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">No deck selected for review</h2>
        <Link href="/decks" className="text-blue-500 hover:underline">
          Go back to decks
        </Link>
      </div>
    );
  }

  let deck;
  let flashcards: Flashcard[] = [];
  let error = null;

  try {
    // Fetch flashcards first to ensure we have fresh data
    flashcards = await getFlashcards(deckId);
    console.log('Fetched flashcards count:', flashcards.length);
    
    // Then fetch the deck
    deck = await getDeck(deckId);
    console.log('Fetched deck:', deck);
    
    if (!flashcards.length) {
      console.log('No flashcards found in database for deckId:', deckId);
    }
  } catch (e) {
    console.error('Error in review page:', e);
    error = e;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">Error loading review session</h2>
        <p className="text-gray-600 mb-4">There was a problem loading the deck or flashcards.</p>
        <Link href="/decks" className="text-blue-500 hover:underline">
          Go back to decks
        </Link>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">Deck not found</h2>
        <Link href="/decks" className="text-blue-500 hover:underline">
          Go back to decks
        </Link>
      </div>
    );
  }

  if (!flashcards.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">No flashcards in this deck yet</h2>
        <p className="text-gray-600 mb-4">Add some flashcards to start reviewing!</p>
        <Link 
          href={`/decks/${deckId}`} 
          className="text-blue-500 hover:underline"
        >
          Add flashcards
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <Link 
          href={`/decks/${deckId}`}
          className="text-blue-500 hover:underline"
        >
          ← Back to deck
        </Link>
      </div>
      <ReviewPageClient initialFlashcards={flashcards} deckId={deckId} />
    </>
  );
}