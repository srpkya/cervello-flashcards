import { getDeck, getFlashcards } from '@/lib/db'
import DeckPageClient from './DeckPageClient'

export default async function DeckPage({ params }: { params: { id: string } }) {
  const deck = await getDeck(params.id)
  const flashcards = await getFlashcards(params.id)

  if (!deck) {
    return <div>Deck not found</div>
  }

  return <DeckPageClient initialDeck={deck} initialFlashcards={flashcards} />
}