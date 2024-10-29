import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flashcard as FlashcardType } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from 'framer-motion';
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ThumbsUp, ThumbsDown, AlertCircle, Trophy } from 'lucide-react';
import ReviewCompletion from './ReviewCompletion';
import Flashcard from '@/components/Flashcard';
import { fsrs, type Rating, type CardState } from '@/lib/fsrs';

interface ReviewSessionProps {
  flashcards: FlashcardType[];
  onComplete: () => void;
  userId: string;
}

export default function ReviewSession({
  flashcards,
  onComplete,
  userId
}: ReviewSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [sessionStartTime] = useState(() => Date.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [responseStartTime, setResponseStartTime] = useState<number>(Date.now());
  const [totalResponseTime, setTotalResponseTime] = useState(0);
  const { toast } = useToast();
  const router = useRouter();

  const currentCard = flashcards?.[currentIndex];
  const progress = flashcards.length > 0 ? (reviewedCount / flashcards.length) * 100 : 0;

  if (!flashcards.length || !currentCard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-light mb-4">No cards available for review</h2>
          <Button onClick={onComplete}>Return to Collections</Button>
        </div>
      </div>
    );
  }

  const completeSession = async () => {
    try {
      const endTime = Date.now();
      const averageResponseTime = totalResponseTime / (reviewedCount || 1);

      const sessionData = {
        userId,
        cardsStudied: reviewedCount + 1,
        startTime: new Date(sessionStartTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        correctCount,
        incorrectCount,
        averageTime: Math.round(averageResponseTime)
      };

      const response = await fetch('/api/study-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save study session');
      }

      router.refresh();
      setIsCompleted(true);
    } catch (error) {
      console.error('Error saving study session:', error);
      toast({
        title: "Error",
        description: "Failed to save your study progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCardUpdate = async (rating: Rating) => {
    if (!currentCard) return;
  
    const responseTime = Date.now() - responseStartTime;
    setTotalResponseTime(prev => prev + responseTime);
  
    try {
      // Get or create initial state
      const currentState: CardState = {
        state: currentCard.state as 'new' | 'learning' | 'review' | 'relearning' || 'new',
        stability: currentCard.stability || 1,
        difficulty: currentCard.difficulty || 5,
        elapsedDays: currentCard.elapsedDays || 0,
        scheduledDays: currentCard.scheduledDays || 0,
        reps: currentCard.reps || 0,
        lapses: currentCard.lapses || 0,
      };
  
      // Update correct/incorrect counts based on rating
      if (rating.rating === 'again') {
        setIncorrectCount(prev => prev + 1);
      } else {
        setCorrectCount(prev => prev + 1);
      }
  
      // Calculate new state using FSRS
      const newState = fsrs.updateState(currentState, rating);
      const nextReviewDate = fsrs.getNextReviewDate(newState);
  
      // Record the review in the log
      await fetch('/api/review-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          flashcardId: currentCard.id,
          rating: rating.value,
          reviewData: {
            stability: newState.stability,
            difficulty: newState.difficulty,
            elapsedDays: newState.elapsedDays,
            scheduledDays: newState.scheduledDays,
            responseTime
          }
        }),
      });
  
      // Update the flashcard
      const response = await fetch(`/api/flashcards/${currentCard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          front: currentCard.front,
          back: currentCard.back,
          reviewData: {
            lastReviewed: new Date().toISOString(),
            nextReview: nextReviewDate.toISOString(),
            state: newState.state,
            stability: newState.stability,
            difficulty: newState.difficulty,
            elapsedDays: newState.elapsedDays,
            scheduledDays: newState.scheduledDays,
            reps: newState.reps,
            lapses: newState.lapses
          }
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update flashcard');
      }
  
      // Reset response timer for next card
      setResponseStartTime(Date.now());
      setReviewedCount(prev => prev + 1);
      
      // Update progress
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        await completeSession();
      }
  
    } catch (error) {
      console.error('Error updating flashcard:', error);
      toast({
        title: "Error",
        description: "Failed to update progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  const studyTime = {
    hours: Math.floor((Date.now() - sessionStartTime) / (1000 * 60 * 60)),
    minutes: Math.floor(((Date.now() - sessionStartTime) / (1000 * 60)) % 60)
  };

  if (isCompleted) {
    return (
      <ReviewCompletion
        cardsReviewed={reviewedCount}
        studyTime={studyTime}
        onStartNewSession={onComplete}
        onBackToDecks={() => router.push('/decks')}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={onComplete}
            className="text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            End Session
          </Button>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            {reviewedCount} of {flashcards.length} cards
          </div>
        </div>
        <Progress value={progress} className="h-2 dark:bg-white/5" />
      </div>

      <motion.div
        key={currentCard.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-6">
          <Flashcard
            front={currentCard.front}
            back={currentCard.back}
          />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Button
            onClick={() => handleCardUpdate({ rating: 'again', value: 1 })}
            variant="outline"
            className="border-red-200 dark:border-red-500/20 hover:border-red-300 dark:hover:border-red-500/30 text-red-600 dark:text-red-400"
          >
            <AlertCircle className="mr-2 h-4 w-4" />
            Again
          </Button>
          <Button
            onClick={() => handleCardUpdate({ rating: 'hard', value: 2 })}
            variant="outline"
            className="border-yellow-200 dark:border-yellow-500/20 hover:border-yellow-300 dark:hover:border-yellow-500/30 text-yellow-600 dark:text-yellow-400"
          >
            Hard
          </Button>
          <Button
            onClick={() => handleCardUpdate({ rating: 'good', value: 3 })}
            className="bg-green-600 hover:bg-green-700 dark:bg-green-500/20 dark:hover:bg-green-500/30 text-white dark:text-green-400"
          >
            <ThumbsUp className="mr-2 h-4 w-4" />
            Good
          </Button>
          <Button
            onClick={() => handleCardUpdate({ rating: 'easy', value: 4 })}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500/20 dark:hover:bg-blue-500/30 text-white dark:text-blue-400"
          >
            <Trophy className="mr-2 h-4 w-4" />
            Easy
          </Button>
        </div>
      </motion.div>
    </div>
  );
}