'use client'

import React, { useState, useEffect } from 'react'
import { Flashcard } from '@/lib/types'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from 'next/link'

export default function ReviewPageClient({ 
  initialFlashcards,
  deckId
}: { 
  initialFlashcards: Flashcard[]
  deckId: string
}) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isReviewComplete, setIsReviewComplete] = useState(false)

  useEffect(() => {
    setFlashcards(initialFlashcards)
  }, [initialFlashcards])

  const handleFlip = () => setIsFlipped(!isFlipped)

  const handleTryAgain = async () => {
    const currentCard = flashcards[currentCardIndex]
    setFlashcards(cards => [...cards.slice(0, currentCardIndex), ...cards.slice(currentCardIndex + 1), currentCard])
    setIsFlipped(false)
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

      setFlashcards(cards => cards.filter(card => card.id !== currentCard.id))
      setIsFlipped(false)

      if (flashcards.length === 1) {
        setIsReviewComplete(true)
      } else if (currentCardIndex >= flashcards.length - 1) {
        setCurrentCardIndex(0)
      }
    } catch (error) {
      console.error("Failed to update flashcard:", error)
    }
  }

  if (isReviewComplete) {
    return (
      <div className="container mx-auto p-4 flex flex-col items-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Review Complete</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">Congratulations! You have finished your review.</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link href="/">Go to Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const currentCard = flashcards[currentCardIndex]

  if (!currentCard) {
    return <div>No flashcards available for review.</div>
  }

  return (
    <div className="container mx-auto p-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">Review Session</h1>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Card {currentCardIndex + 1} of {flashcards.length}</CardTitle>
        </CardHeader>
        <CardContent className="h-48 flex items-center justify-center cursor-pointer" onClick={handleFlip}>
          <p className="text-xl text-center">
            {isFlipped ? currentCard.back : currentCard.front}
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={handleTryAgain} variant="outline">Try Again</Button>
          <Button onClick={handleKnown}>Known</Button>
        </CardFooter>
      </Card>
    </div>
  )
}