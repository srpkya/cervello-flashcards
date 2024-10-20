import { getFlashcards } from '@/lib/db'
import ReviewPageClient from './ReviewPageClient'

export default async function ReviewPage({ 
  searchParams 
}: { 
  searchParams: { deckId: string } 
}) {
  const deckId = searchParams.deckId

  if (!deckId) {
    return <div>No deck selected for review. Please go back and select a deck.</div>
  }

  const flashcards = await getFlashcards(deckId)

  if (flashcards.length === 0) {
    return <div>No flashcards found in this deck.</div>
  }

  return <ReviewPageClient initialFlashcards={flashcards} deckId={deckId} />
}