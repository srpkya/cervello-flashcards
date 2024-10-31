'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Sparkles, ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Deck, ExtendedSession } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional()
});

type FormData = z.infer<typeof formSchema>;

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(date));
};

export default function DecksClient({ initialDecks }: { initialDecks: Deck[] }) {
  const { data: session } = useSession();
  const [decks, setDecks] = useState<Deck[]>(initialDecks);
  const [isCreating, setIsCreating] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: ""
    }
  });

  const onSubmit = async (data: FormData) => {
    if (!session?.user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to create a deck",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingDeck) {
        const response = await fetch(`/api/decks/${editingDeck.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: data.title,
            description: data.description || ''
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update deck');
        }

        const updatedDeck = await response.json();
        setDecks(prevDecks => prevDecks.map(deck =>
          deck.id === editingDeck.id ? updatedDeck : deck
        ));

        toast({
          title: "Success",
          description: "Deck updated successfully",
        });
      } else {
        const response = await fetch('/api/decks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: session.user.id,
            title: data.title,
            description: data.description || ''
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create deck');
        }

        const newDeck = await response.json();
        if (newDeck && newDeck.id) {
          setDecks(prevDecks => [...prevDecks, newDeck]);
          toast({
            title: "Success",
            description: "Deck created successfully",
          });
        }
      }

      form.reset();
      setIsCreating(false);
      setEditingDeck(null);
    } catch (error) {
      console.error("Failed to save deck:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (deckId: string) => {
    if (!confirm('Are you sure you want to delete this deck?')) {
      return;
    }

    try {
      const response = await fetch(`/api/decks/${deckId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete deck');
      }

      setDecks(prevDecks => prevDecks.filter(deck => deck.id !== deckId));
      toast({
        title: "Success",
        description: "Deck deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete deck:", error);
      toast({
        title: "Error",
        description: "Failed to delete deck. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-light text-neutral-800 dark:text-white">Collections</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-2">Create and manage your flashcard collections</p>
          </div>
          <Button
            onClick={() => setIsCreating(true)}
            className="dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            New Collection
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {decks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="col-span-full flex flex-col items-center justify-center p-12 text-center"
              >
                <div className="w-16 h-16 bg-neutral-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                  <Sparkles className="w-8 h-8 text-neutral-500 dark:text-neutral-400" />
                </div>
                <h3 className="text-xl font-light text-neutral-800 dark:text-white mb-2">
                  No collections yet
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                  Create your first collection to get started
                </p>
                <Button
                  onClick={() => setIsCreating(true)}
                  className="dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Collection
                </Button>
              </motion.div>
            ) : (
              decks.map((deck, index) => (
                <motion.div
                  key={deck.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="h-full"
                >
                  <Card className="dark:glass-card dark:border-white/5 group hover:shadow-lg transition-all duration-200 h-full flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-xl font-light dark:text-white">
                        {deck.title}
                      </CardTitle>
                      <CardDescription className="dark:text-neutral-400">
                        {deck.description || 'No description'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <div className="flex items-center text-sm dark:text-neutral-400">
                        <span>Created {formatDate(deck.createdAt)}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2 mt-auto pt-4">
                      <Button
                        variant="outline"
                        onClick={() => handleDelete(deck.id)}
                        className="dark:border-white/10 dark:hover:border-white/20 dark:text-white"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingDeck(deck);
                          form.reset({
                            title: deck.title,
                            description: deck.description || undefined
                          });
                          setIsCreating(true);
                        }}
                        className="dark:border-white/10 dark:hover:border-white/20 dark:text-white"
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => router.push(`/decks/${deck.id}`)}
                        className="dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                      >
                        View Cards
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="dark:glass-card sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-light dark:text-white">
              {editingDeck ? 'Edit Collection' : 'Create New Collection'}
            </DialogTitle>
            <DialogDescription className="dark:text-neutral-400">
              {editingDeck
                ? 'Update your collection details.'
                : 'Add a new collection to organize your flashcards.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-neutral-300">Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Collection title"
                        className="dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder-neutral-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-neutral-300">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your collection"
                        className="dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder-neutral-500 resize-none"
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
                {editingDeck ? 'Save Changes' : 'Create Collection'}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}