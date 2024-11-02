// app/review/ReviewSession.tsx
import React, { useState, useEffect, useCallback } from 'react';
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
  flashcards: initialFlashcards,
  onComplete,
  userId
}: ReviewSessionProps) {
  const [originalCards] = useState(initialFlashcards);
  const [reviewQueue, setReviewQueue] = useState<FlashcardType[]>([...initialFlashcards]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sessionStartTime] = useState(() => Date.now());
  const [responseStartTime, setResponseStartTime] = useState<number>(Date.now());
  const [totalResponseTime, setTotalResponseTime] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const { toast } = useToast();
  const router = useRouter();

  const handleSessionComplete = async () => {
    setIsCompleted(true);
    if (reviewedCount > 0) {
      await createStudySession();
    }
  };

  useEffect(() => {
    if (reviewQueue.length === 0) {
      handleSessionComplete();
    }
  }, [reviewQueue, handleSessionComplete]);
  

  // Get current card safely
  const currentCard = reviewQueue[currentIndex];
  const progress = originalCards.length > 0 ? (reviewedCount / originalCards.length) * 100 : 0;

  const createStudySession = async () => {
    try {
      const sessionData = {
        userId,
        cardsStudied: reviewedCount,
        startTime: sessionStartTime,
        endTime: Date.now(),
        correctCount,
        incorrectCount,
        averageTime: reviewedCount > 0 ? Math.round(totalResponseTime / reviewedCount) : 0
      };

      const response = await fetch('/api/study-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        throw new Error('Failed to save study session');
      }

      // Don't show success toast to avoid UI clutter
      console.log('Study session saved successfully');
    } catch (error) {
      console.error('Error saving study session:', error);
      toast({
        title: "Error",
        description: "Failed to save study progress",
        variant: "destructive",
      });
    }
  };

  

  const handleCardUpdate = async (rating: Rating) => {
    if (!currentCard) return;
  
    const responseTime = Date.now() - responseStartTime;
    setTotalResponseTime(prev => prev + responseTime);
  
    try {
      // Calculate new state using FSRS
      const currentState: CardState = {
        state: currentCard.state || 'new',
        stability: Number(currentCard.stability || 1),
        difficulty: Number(currentCard.difficulty || 5),
        elapsedDays: Number(currentCard.elapsedDays || 0),
        scheduledDays: Number(currentCard.scheduledDays || 0),
        reps: Number(currentCard.reps || 0),
        lapses: Number(currentCard.lapses || 0),
      };
  
      const newState = fsrs.updateState(currentState, rating);
      const nextReviewDate = fsrs.getNextReviewDate(newState);
  
      // Prepare update data
      const updateData = {
        front: currentCard.front,
        back: currentCard.back,
        reviewData: {
          lastReviewed: Date.now(),
          nextReview: nextReviewDate.getTime(),
          state: newState.state,
          stability: Number(newState.stability),
          difficulty: Number(newState.difficulty),
          elapsedDays: Number(newState.elapsedDays),
          scheduledDays: Number(newState.scheduledDays),
          reps: Number(currentCard.reps || 0) + 1,
          lapses: Number(newState.lapses)
        }
      };
  
      console.log('Sending update data:', updateData);
  
      // Update the flashcard
      const response = await fetch(`/api/flashcards/${currentCard.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Update error response:', errorData);
        throw new Error(errorData.error || 'Failed to update flashcard');
      }
  
      const result = await response.json();
      console.log('Update success:', result);
  
      // Handle successful update
      if (rating.rating === 'again') {
        setIncorrectCount(prev => prev + 1);
        
        // Remove current card and add it back later in the queue
        const newQueue = [...reviewQueue];
        newQueue.splice(currentIndex, 1);
        
        const reinsertPosition = Math.min(
          currentIndex + 3 + Math.floor(Math.random() * 5),
          newQueue.length
        );
        newQueue.splice(reinsertPosition, 0, currentCard);
        
        setReviewQueue(newQueue);
      } else {
        setCorrectCount(prev => prev + 1);
        setReviewedCount(prev => prev + 1);
        
        // Remove the current card from the queue
        const newQueue = [...reviewQueue];
        newQueue.splice(currentIndex, 1);
        setReviewQueue(newQueue);
        
        if (currentIndex >= newQueue.length) {
          setCurrentIndex(Math.max(0, newQueue.length - 1));
        }
      }
  
      setResponseStartTime(Date.now());
  
    } catch (error) {
      console.error('Error updating flashcard:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update flashcard",
        variant: "destructive",
      });
    }
  };

  const updateFlashcardInDb = async (
    id: string,
    newState: CardState,
    nextReviewDate: Date | null,
    ratingValue: number,
    responseTimeMs: number
  ) => {
    try {
      // Clamp extremely large numbers to safe values
      const stability = Math.min(Number(newState.stability), Number.MAX_SAFE_INTEGER);
      const scheduledDays = Math.min(Number(newState.scheduledDays), Number.MAX_SAFE_INTEGER);
  
      const updateData = {
        front: currentCard.front,
        back: currentCard.back,
        reviewData: {
          lastReviewed: Date.now(),
          nextReview: nextReviewDate ? nextReviewDate.getTime() : null,
          state: newState.state,
          stability,
          difficulty: Number(newState.difficulty),
          elapsedDays: Number(newState.elapsedDays),
          scheduledDays,
          reps: Number(currentCard.reps || 0) + 1,
          lapses: Number(newState.lapses)
        }
      };
  
      console.log('Sending update data:', JSON.stringify(updateData, null, 2));
  
      const response = await fetch(`/api/flashcards/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
  
      const responseData = await response.json();
  
      if (!response.ok) {
        console.error('Update error response:', responseData);
        throw new Error(responseData.error || 'Failed to update flashcard');
      }
  
      return responseData;
      
    } catch (error) {
      console.error('Error updating flashcard:', error);
      throw error;
    }
  };
  

  // Show empty state if there were no cards to begin with
  if (originalCards.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-light mb-4">No cards available for review</h2>
          <Button onClick={onComplete}>Return to Collections</Button>
        </div>
      </div>
    );
  }

  const studyTime = {
    hours: Math.floor((Date.now() - sessionStartTime) / (1000 * 60 * 60)),
    minutes: Math.floor(((Date.now() - sessionStartTime) / (1000 * 60)) % 60)
  };

  if (isCompleted || reviewQueue.length === 0) {
    return (
      <ReviewCompletion
        cardsReviewed={reviewedCount}
        studyTime={studyTime}
        onStartNewSession={onComplete}
        onBackToDecks={() => router.push('/decks')}
      />
    );
  }

  // Safely render the review interface only if we have a current card
  if (!currentCard) {
    return null;
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
            {reviewedCount} of {originalCards.length} cards
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
            className="bg-red-600 hover:bg-red-700 dark:bg-red-500/20 dark:hover:bg-red-500/30 text-white dark:text-red-400"
          >
            <AlertCircle className="mr-2 h-4 w-4" />
            Again
          </Button>
          <Button
            onClick={() => handleCardUpdate({ rating: 'hard', value: 2 })}
            className="bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500/20 dark:hover:bg-yellow-500/30 text-white dark:text-yellow-400"
          >
            <ThumbsDown className="mr-2 h-4 w-4" />
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