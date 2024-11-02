'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRouter } from 'next/navigation';
import { Deck, Flashcard } from '@/lib/types';
import {
  Card, CardContent, CardDescription,
  CardFooter, CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Form, FormField, FormItem,
  FormLabel, FormControl, FormMessage
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit2, Trash2, PlayCircle,
  Book, Clock, ChevronRight, Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import TranslationFlashcardDialog from '@/components/TranslationFlashcardDialog';
import { formatTimestamp } from '@/lib/utils';
import { useSession } from "next-auth/react";

const flashcardSchema = z.object({
  front: z.string().min(1, "Front side is required"),
  back: z.string().min(1, "Back side is required")
});

interface DeckPageClientProps {
  initialDeck: Deck;
  initialFlashcards: Flashcard[];
}

type FlashcardFormData = z.infer<typeof flashcardSchema>;

interface DeckPageClientProps {
  initialDeck: Deck;
  initialFlashcards: Flashcard[];
}

export default function DeckPageClient({
  initialDeck,
  initialFlashcards
}: DeckPageClientProps) {
  const { data: session } = useSession();
  const [deck, setDeck] = useState<Deck>(initialDeck);
  const [flashcards, setFlashcards] = useState<Flashcard[]>(initialFlashcards);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [isTranslationDialogOpen, setIsTranslationDialogOpen] = useState(false);
  const { toast } = useToast();
  const [isShared, setIsShared] = useState(false);
  const router = useRouter();

  const form = useForm<FlashcardFormData>({
    resolver: zodResolver(flashcardSchema),
    defaultValues: {
      front: "",
      back: ""
    }
  });

  const fetchFlashcards = async () => {
    try {
      // First ensure we have a valid deck ID
      if (!deck?.id) {
        console.error("Missing deck ID");
        return;
      }
  
      const response = await fetch(`/api/flashcards?deckId=${deck.id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch flashcards');
      }
  
      const fetchedFlashcards = await response.json();
      
      // Validate the response data
      if (!Array.isArray(fetchedFlashcards)) {
        throw new Error('Invalid flashcards data received');
      }
  
      // Convert timestamps to proper format
      const processedFlashcards = fetchedFlashcards.map(card => ({
        ...card,
        createdAt: Number(card.createdAt),
        updatedAt: Number(card.updatedAt),
        lastReviewed: card.lastReviewed ? Number(card.lastReviewed) : null,
        nextReview: card.nextReview ? Number(card.nextReview) : null,
        stability: Number(card.stability),
        difficulty: Number(card.difficulty),
        elapsedDays: Number(card.elapsedDays),
        scheduledDays: Number(card.scheduledDays),
        reps: Number(card.reps),
        lapses: Number(card.lapses),
        interval: Number(card.interval),
        easeFactor: Number(card.easeFactor)
      }));
  
      setFlashcards(processedFlashcards);
    } catch (error) {
      console.error("Failed to fetch flashcards:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load flashcards",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!deck?.id) return;
    const fetchData = async () => {
      await fetchFlashcards();
    };
    fetchData();
  }, [deck?.id, fetchFlashcards]);
  

  useEffect(() => {
    const checkSharedStatus = async () => {
      try {
        const response = await fetch(`/api/marketplace/check/${deck.id}`);
        if (!response.ok) throw new Error('Failed to check shared status');
        const data = await response.json();
        setIsShared(data.isShared);
      } catch (error) {
        console.error('Error checking shared status:', error);
      }
    };

    if (deck?.id) {
      checkSharedStatus();
    }
  }, [deck?.id]);

  const handleShareDeck = async () => {
    if (!session?.user?.id) {
      toast({
        title: "Error",
        description: "You must be signed in to share a deck",
        variant: "destructive"
      });
      return;
    }
  
    try {
      const response = await fetch('/api/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deckId: deck.id
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || 'Failed to share deck');
      }
  
      setIsShared(true);
      toast({
        title: "Success",
        description: "Deck shared to marketplace successfully",
      });
  
    } catch (error) {
      console.error('Error sharing deck:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to share deck",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: FlashcardFormData) => {
    if (!deck?.id) {
      toast({
        title: "Error",
        description: "Deck not found",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingCard) {
        const response = await fetch(`/api/flashcards/${editingCard.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            front: data.front,
            back: data.back
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update flashcard');
        }

        const updatedCard = await response.json();
        setFlashcards(prevCards => prevCards.map(card =>
          card.id === editingCard.id ? updatedCard : card
        ));

        toast({
          title: "Success",
          description: "Flashcard updated successfully",
        });
      } else {
        const response = await fetch('/api/flashcards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deckId: deck.id,
            front: data.front,
            back: data.back
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create flashcard');
        }

        const newCard = await response.json();
        setFlashcards(prevCards => [...prevCards, newCard]);

        toast({
          title: "Success",
          description: "New flashcard created successfully",
        });
      }

      form.reset();
      setIsCreating(false);
      setEditingCard(null);

    } catch (error) {
      console.error("Failed to save flashcard:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this flashcard?")) return;

    try {
      const response = await fetch(`/api/flashcards/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete flashcard');

      setFlashcards(prevCards => prevCards.filter(card => card.id !== id));
      toast({
        title: "Success",
        description: "Flashcard deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete flashcard:", error);
      toast({
        title: "Error",
        description: "Failed to delete flashcard. Please try again.",
        variant: "destructive",
      });
    }
  };

  const dueCards = flashcards.filter(card =>
    !card.nextReview || new Date(card.nextReview) <= new Date()
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="dark:glass-card dark:border-white/5 bg-white border-neutral-200 mb-8 overflow-hidden">
            <CardHeader className="border-b border-neutral-100 dark:border-white/5 bg-neutral-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl font-light text-neutral-800 dark:text-white">
                    {deck.title}
                  </CardTitle>
                  <CardDescription className="text-neutral-600 dark:text-neutral-400 mt-1">
                    {deck.description}
                  </CardDescription>
                </div>
                <Button
                  onClick={() => router.push(`/review?deckId=${deck.id}`)}
                  className="dark:bg-white dark:text-black dark:hover:bg-neutral-200 bg-neutral-900 text-white hover:bg-neutral-800"
                >
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Start Review
                </Button>
              </div>
            </CardHeader>
            <CardContent className="py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-neutral-100 dark:bg-white/5 rounded-lg">
                    <Book className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Total Cards
                    </p>
                    <p className="text-2xl font-light dark:text-white">
                      {flashcards.length}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-neutral-100 dark:bg-white/5 rounded-lg">
                    <Clock className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Due Today
                    </p>
                    <p className="text-2xl font-light dark:text-white">
                      {dueCards.length}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-neutral-100 dark:border-white/5 bg-neutral-50/50 dark:bg-white/[0.02]">
              <div className="flex pt-4 items-center gap-4 w-full">
                <Dialog open={isCreating} onOpenChange={setIsCreating}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-neutral-300 hover:border-neutral-400 dark:border-white/10 dark:hover:border-white/20 dark:text-white"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Basic Card
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="dark:glass-card bg-[#F5F2EA] border-neutral-200 dark:border-white/10 sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-light dark:text-white">
                        {editingCard ? "Edit Card" : "Add New Card"}
                      </DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="front"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="dark:text-neutral-200">Front</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Enter the front side content"
                                  className="resize-none bg-white dark:bg-white/5 dark:text-white dark:border-white/10"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="back"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="dark:text-neutral-200">Back</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Enter the back side content"
                                  className="resize-none bg-white dark:bg-white/5 dark:text-white dark:border-white/10"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          className="w-full dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                        >
                          {editingCard ? "Save Changes" : "Add Card"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  onClick={() => setIsTranslationDialogOpen(true)}
                  className="border-neutral-300 hover:border-neutral-400 dark:border-white/10 dark:hover:border-white/20 dark:text-white"
                >
                  <Globe className="mr-2 h-4 w-4" />
                  Add Translation Card
                </Button>
                {!deck.originalSharedDeckId && (
                  <Button
                    variant="outline"
                    onClick={handleShareDeck}
                    disabled={isShared}
                    className="border-neutral-300 hover:border-neutral-400 dark:border-white/10 dark:hover:border-white/20 dark:text-white"
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    {isShared ? 'Shared on Marketplace' : 'Share to Marketplace'}
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {flashcards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className={cn(
                  "dark:glass-card dark:border-white/5 bg-white border-neutral-200",
                  "group hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-normal text-neutral-600 dark:text-neutral-300">
                        Card {index + 1}
                      </CardTitle>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Front</p>
                      <p className="text-sm text-neutral-800 dark:text-white">{card.front}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Back</p>
                      <p className="text-sm text-neutral-800 dark:text-white">{card.back}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t border-neutral-100 dark:border-white/5 pt-4">
                    <div className="flex justify-between items-center w-full">
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        {formatTimestamp(card.lastReviewed)}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-neutral-100 dark:hover:bg-white/5 dark:text-neutral-200"
                          onClick={() => {
                            setEditingCard(card);
                            form.reset({
                              front: card.front,
                              back: card.back
                            });
                            setIsCreating(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                          onClick={() => handleDelete(card.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {flashcards.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-neutral-100 dark:bg-white/5 rounded-full mx-auto flex items-center justify-center mb-6">
              <Book className="w-8 h-8 text-neutral-500 dark:text-neutral-400" />
            </div>
            <h3 className="text-xl font-light text-neutral-800 dark:text-white mb-2">
              No flashcards yet
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Create your first flashcard to get started
            </p>
            <Button
              onClick={() => setIsCreating(true)}
              className="dark:bg-white dark:text-black dark:hover:bg-neutral-200"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Flashcard
            </Button>
          </motion.div>
        )}
      </div>

      <TranslationFlashcardDialog
        open={isTranslationDialogOpen}
        onOpenChange={setIsTranslationDialogOpen}
        deckId={deck.id}
        onFlashcardCreated={() => {
          fetchFlashcards();
        }}
      />
    </div>
  );
}