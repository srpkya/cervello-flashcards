'use client'

import React, { useState, useEffect } from 'react'
import { Flashcard } from '@/lib/types'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ThumbsUp, ThumbsDown, RotateCcw, CheckCircle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'

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
  const [isFlipped, setIsFlipped] = useState(false)
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    const fetchFlashcards = async () => {
      try {
        const response = await fetch(`/api/flashcards?deckId=${deckId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch flashcards');
        }
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setFlashcards(data);
          setProgress(0);
        } else {
          setFlashcards(initialFlashcards);
          setProgress(0);
        }
      } catch (error) {
        console.error("Error fetching flashcards:", error);
        setFlashcards(initialFlashcards);
        toast({
          title: "Error",
          description: "Failed to load flashcards. Using initial data.",
          variant: "destructive",
        });
      }
    };

    if (deckId) {
      fetchFlashcards();
    }
  }, [deckId, initialFlashcards, toast]);

  const handleTryAgain = () => {
    if (flashcards.length === 0) return;
    
    const currentCard = flashcards[currentCardIndex];
    setFlashcards(cards => [...cards.slice(0, currentCardIndex), ...cards.slice(currentCardIndex + 1), currentCard]);
    if (currentCardIndex >= flashcards.length - 1) {
      setCurrentCardIndex(0);
    }
    setIsFlipped(false);
    updateProgress();
  };

  const handleKnown = async () => {
    if (flashcards.length === 0) return;

    const currentCard = flashcards[currentCardIndex];
    const now = new Date();

    let newInterval = currentCard.interval === 0 ? 1 : Math.round(currentCard.interval * currentCard.easeFactor / 100);
    let newEaseFactor = Math.min(currentCard.easeFactor + 15, 250);

    try {
      const response = await fetch(`/api/flashcards/${currentCard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          front: currentCard.front,
          back: currentCard.back,
          lastReviewed: now.toISOString(),
          nextReview: new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000).toISOString(),
          easeFactor: newEaseFactor,
          interval: newInterval,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update flashcard');
      }

      const newFlashcards = flashcards.filter((_, index) => index !== currentCardIndex);
      setFlashcards(newFlashcards);

      if (newFlashcards.length === 0) {
        setIsReviewComplete(true);
      } else if (currentCardIndex >= newFlashcards.length) {
        setCurrentCardIndex(0);
      }

      setIsFlipped(false);
      updateProgress();

    } catch (error) {
      console.error("Failed to update flashcard:", error);
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive",
      });
    }
  };

  const updateProgress = () => {
    const totalCards = initialFlashcards.length;
    const remainingCards = flashcards.length;
    const completedCards = totalCards - remainingCards;
    setProgress((completedCards / totalCards) * 100);
  };

  if (flashcards.length === 0 && !isReviewComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <h2 className="text-2xl font-light text-neutral-800 dark:text-white mb-4">
          No flashcards available for review
        </h2>
        <Button 
          asChild 
          variant="outline"
          className="dark:border-white/10 dark:hover:border-white/20 dark:text-white"
        >
          <Link href={`/decks/${deckId}`} className="flex items-center">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Return to deck
          </Link>
        </Button>
      </div>
    );
  }

  if (isReviewComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </motion.div>
        <h2 className="text-3xl font-light text-neutral-800 dark:text-white mb-3">Review Complete!</h2>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">Great job! You've reviewed all the cards.</p>
        <div className="flex space-x-4">
          <Button 
            asChild 
            variant="outline"
            className="dark:border-white/10 dark:hover:border-white/20 dark:text-white"
          >
            <Link href={`/decks/${deckId}`}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Deck
            </Link>
          </Button>
          <Button 
            onClick={() => {
              setFlashcards(initialFlashcards);
              setCurrentCardIndex(0);
              setIsReviewComplete(false);
              setProgress(0);
            }}
            className="dark:bg-white dark:text-black dark:hover:bg-neutral-200 bg-neutral-900 text-white hover:bg-neutral-800"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Start Over
          </Button>
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentCardIndex];

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Button 
            asChild 
            variant="ghost" 
            className="text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5"
          >
            <Link href={`/decks/${deckId}`}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to deck
            </Link>
          </Button>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            Card {currentCardIndex + 1} of {flashcards.length}
          </div>
        </div>
        <Progress 
          value={progress} 
          className="h-2 dark:bg-white/5" 
        />
      </div>

      <motion.div
        key={currentCard.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card 
          className="relative dark:glass-card bg-white dark:border-white/5 overflow-hidden cursor-pointer min-h-[400px] mb-6"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className="absolute inset-0 p-8 flex items-center justify-center">
            <motion.div
              className="w-full text-center"
              initial={false}
              animate={{ rotateX: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: "spring" }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className={`${isFlipped ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
                <h3 className="text-xl text-neutral-600 dark:text-neutral-400 mb-4">Front</h3>
                <p className="text-2xl font-light dark:text-white">{currentCard.front}</p>
              </div>
              <div 
                className={`${isFlipped ? 'opacity-100' : 'opacity-0'} absolute inset-0 flex items-center justify-center transition-opacity duration-300`}
                style={{ transform: "rotateX(180deg)" }}
              >
                <div>
                  <h3 className="text-xl text-neutral-600 dark:text-neutral-400 mb-4">Back</h3>
                  <p className="text-2xl font-light dark:text-white">{currentCard.back}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Button 
            onClick={handleTryAgain}
            variant="outline"
            className="border-red-200 dark:border-red-500/20 hover:border-red-300 dark:hover:border-red-500/30 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
          >
            <ThumbsDown className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button 
            onClick={handleKnown}
            className="bg-green-600 hover:bg-green-700 dark:bg-green-500/20 dark:hover:bg-green-500/30 text-white dark:text-green-400"
          >
            <ThumbsUp className="mr-2 h-4 w-4" />
            Got It
          </Button>
        </div>
      </motion.div>
    </div>
  );
}