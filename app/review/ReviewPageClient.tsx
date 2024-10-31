// app/review/ReviewPageClient.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Deck, Flashcard } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import ReviewDeckSelector from './ReviewDeckSelector';
import ReviewSession from './ReviewSession';
import { Button } from '@/components/ui/button';

export default function ReviewPageClient() {
  const { data: session } = useSession();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDecks, setSelectedDecks] = useState<Deck[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewStarted, setIsReviewStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!session?.user?.id) {
      router.push('/auth/signin');
      return;
    }
    fetchDecks();
  }, [session?.user?.id]);

  const fetchDecks = async () => {
    try {
      const response = await fetch(`/api/decks?userId=${session?.user?.id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch decks');
      }
      const data = await response.json();
      setDecks(data);
    } catch (error) {
      console.error('Error fetching decks:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load decks",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startReview = async () => {
    if (selectedDecks.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one deck to review",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    const allFlashcards: Flashcard[] = [];

    try {
      for (const deck of selectedDecks) {
        const response = await fetch(`/api/flashcards?deckId=${deck.id}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch flashcards for deck ${deck.id}`);
        }
        
        const deckFlashcards = await response.json();
        
        if (!Array.isArray(deckFlashcards)) {
          throw new Error(`Invalid response format for deck ${deck.id}`);
        }
        
        allFlashcards.push(...deckFlashcards);
      }

      if (allFlashcards.length === 0) {
        toast({
          title: "No Cards",
          description: "Selected decks contain no flashcards",
          variant: "default",
        });
        return;
      }

      const shuffled = [...allFlashcards].sort(() => Math.random() - 0.5);
      setFlashcards(shuffled);
      setIsReviewStarted(true);
    } catch (error) {
      console.error('Error starting review:', error);
      setError(error instanceof Error ? error.message : 'Failed to start review');
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start review",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!session?.user?.id) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-lg text-neutral-600 dark:text-neutral-400">
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-red-500 dark:text-red-400">{error}</div>
        <Button onClick={() => setError(null)}>Try Again</Button>
      </div>
    );
  }

  if (!isReviewStarted) {
    return (
      <ReviewDeckSelector
        decks={decks}
        selectedDecks={selectedDecks}
        onSelectDecks={setSelectedDecks}
        onStartReview={startReview}
      />
    );
  }

  return (
    <ReviewSession 
      flashcards={flashcards}
      onComplete={() => {
        setIsReviewStarted(false);
        setSelectedDecks([]);
      }}
      userId={session.user.id}
    />
  );
}