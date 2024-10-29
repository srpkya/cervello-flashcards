'use client'
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Deck, Flashcard } from '@/lib/types';
import { Button } from '@/components/ui/button';
import ReviewDeckSelector from './ReviewDeckSelector';
import ReviewSession from './ReviewSession';
import { useToast } from "@/hooks/use-toast";

export default function ReviewPageClient() {
  const { data: session } = useSession();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDecks, setSelectedDecks] = useState<Deck[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewStarted, setIsReviewStarted] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  if (!session?.user?.id) {
    router.push('/auth/signin');
    return null;
  }

  useEffect(() => {
    const fetchDecks = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch(`/api/decks?userId=${session.user.id}`);
        if (!response.ok) throw new Error('Failed to fetch decks');
        const data = await response.json();
        setDecks(data);
      } catch (error) {
        console.error('Error fetching decks:', error);
        toast({
          title: "Error",
          description: "Failed to load decks. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDecks();
  }, [session?.user?.id, toast]);

  const startReview = async () => {
    if (selectedDecks.length === 0) return;

    setIsLoading(true);
    const allFlashcards: Flashcard[] = [];

    try {
      for (const deck of selectedDecks) {
        const response = await fetch(`/api/flashcards?deckId=${deck.id}`);
        if (!response.ok) throw new Error(`Failed to fetch flashcards for deck ${deck.id}`);
        const deckFlashcards = await response.json();
        allFlashcards.push(...deckFlashcards);
      }

      const shuffled = [...allFlashcards].sort(() => Math.random() - 0.5);
      setFlashcards(shuffled);
      setIsReviewStarted(true);
    } catch (error) {
      console.error('Error fetching flashcards:', error);
      toast({
        title: "Error",
        description: "Failed to load flashcards. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-neutral-600 dark:text-neutral-400">
          Loading...
        </div>
      </div>
    );
  }

  if (decks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h2 className="text-2xl font-light text-neutral-800 dark:text-white">
          No collections available
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          Create a collection first to start reviewing
        </p>
        <Button 
          onClick={() => router.push('/decks')}
          className="dark:bg-white dark:text-black dark:hover:bg-neutral-200"
        >
          Create A Collection
        </Button>
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