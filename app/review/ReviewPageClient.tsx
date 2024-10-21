'use client'

import React, { useState, useEffect } from 'react'
import { Flashcard } from '@/lib/types'
import Link from 'next/link'
import FlipCard from '@/components/FlipCard'
import { Button } from '@/components/ui/button'

export default function ReviewPageClient({ 
  initialFlashcards,
  deckId
}: { 
  initialFlashcards: Flashcard[]
  deckId: string
}) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isReviewComplete, setIsReviewComplete] = useState(false)

  useEffect(() => {
    setFlashcards(initialFlashcards)
  }, [initialFlashcards])

  const handleTryAgain = () => {
    const currentCard = flashcards[currentCardIndex]
    setFlashcards(cards => [...cards.slice(0, currentCardIndex), ...cards.slice(currentCardIndex + 1), currentCard])
    if (currentCardIndex >= flashcards.length - 1) {
      setCurrentCardIndex(0)
    }
  }

  const handleKnown = async () => {
    const currentCard = flashcards[currentCardIndex]
    const now = new Date()

    let newInterval = currentCard.interval === 0 ? 1 : Math.round(currentCard.interval * currentCard.easeFactor / 100)
    let newEaseFactor = Math.min(currentCard.easeFactor + 15, 250)

    try {
      await fetch(`/api/flashcards/${currentCard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          front: currentCard.front,
          back: currentCard.back,
          lastReviewed: now,
          nextReview: new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000),
          easeFactor: newEaseFactor,
          interval: newInterval,
        })
      });

      const newFlashcards = flashcards.filter(card => card.id !== currentCard.id)
      setFlashcards(newFlashcards)

      if (newFlashcards.length === 0) {
        setIsReviewComplete(true)
      } else if (currentCardIndex >= newFlashcards.length) {
        setCurrentCardIndex(0)
      }
    } catch (error) {
      console.error("Failed to update flashcard:", error)
    }
  }

  if (isReviewComplete) {
    return (
      <div className="text-center p-4">
        <h2 className="text-2xl font-bold mb-4">Congratulations! You have finished your review.</h2>
        <Link href="/decks" className="bg-primary text-black px-4 py-2 rounded hover:bg-primary-dark">
          Return to Decks
        </Link>
      </div>
    )
  }

  const currentCard = flashcards[currentCardIndex]

  if (!currentCard) {
    return <div className="text-center p-4">No flashcards available for review.</div>
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Review Session</h1>
      <div className="mb-4">
        <FlipCard front={currentCard.front} back={currentCard.back} />
      </div>
      <div className="flex justify-between mt-4">
        <Button 
          onClick={handleTryAgain} 
          variant="secondary"
        >
          Try Again
        </Button>
        <Button 
          onClick={handleKnown} 
          variant="default"
        >
          Known
        </Button>
      </div>
      <p className="mt-4 text-center">
        Card {currentCardIndex + 1} of {flashcards.length}
      </p>
    </div>
  )
}