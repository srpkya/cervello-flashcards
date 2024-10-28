import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Flashcard } from '@/lib/types';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ThumbsUp, ThumbsDown } from 'lucide-react';
import ReviewCompletion from './ReviewCompletion';

interface ReviewSessionProps {
  flashcards: Flashcard[];
  onComplete: () => void;
  userId: string;
}

export default function ReviewSession({ 
  flashcards, 
  onComplete,
  userId 
}: ReviewSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [sessionStartTime] = useState<Date>(new Date());
  const [isCompleted, setIsCompleted] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const currentCard = flashcards[currentIndex];
  const progress = (reviewedCount / flashcards.length) * 100;

  const completeSession = async () => {
    try {
      const sessionEnd = new Date();
      console.log('Completing review session:', {
        startTime: sessionStartTime,
        endTime: sessionEnd,
        cardsStudied: reviewedCount + 1,
        userId
      });

      const response = await fetch('/api/study-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          cardsStudied: reviewedCount + 1,
          startTime: sessionStartTime,
          endTime: sessionEnd
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save study session');
      }

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

  const handleCardUpdate = async (quality: number) => {
    try {
      const now = new Date();
      let newInterval = currentCard.interval === 0 ? 1 : Math.round(currentCard.interval * currentCard.easeFactor / 100);
      let newEaseFactor = Math.min(currentCard.easeFactor + (quality >= 3 ? 15 : -20), 250);
      
      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + newInterval);

      const reviewData = {
        lastReviewed: now.toISOString(),
        nextReview: nextReview.toISOString(),
        easeFactor: newEaseFactor,
        interval: newInterval
      };

      const response = await fetch(`/api/flashcards/${currentCard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          front: currentCard.front,
          back: currentCard.back,
          reviewData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update flashcard');
      }

      setReviewedCount(prev => prev + 1);
      
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setIsFlipped(false);
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
    hours: Math.floor((Date.now() - sessionStartTime.getTime()) / (1000 * 60 * 60)),
    minutes: Math.floor(((Date.now() - sessionStartTime.getTime()) / (1000 * 60)) % 60)
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
            onClick={() => handleCardUpdate(1)}
            variant="outline"
            className="border-red-200 dark:border-red-500/20 hover:border-red-300 dark:hover:border-red-500/30 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
          >
            <ThumbsDown className="mr-2 h-4 w-4" />
            Again
          </Button>
          <Button 
            onClick={() => handleCardUpdate(5)}
            className="bg-green-600 hover:bg-green-700 dark:bg-green-500/20 dark:hover:bg-green-500/30 text-white dark:text-green-400"
          >
            <ThumbsUp className="mr-2 h-4 w-4" />
            Good
          </Button>
        </div>
      </motion.div>
    </div>
  );
}