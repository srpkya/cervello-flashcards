'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession } from "next-auth/react";
import { Search } from "lucide-react";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DeckLabelInput } from '@/components/DeckLabelInput';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  labels: z.array(z.string()).default([])
});

type FormData = z.infer<typeof formSchema>;

interface DeckLabelsProps {
  labels?: string[] | null;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search collections...",
  className = ""
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500 dark:text-neutral-400" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 dark:bg-white/5 dark:border-white/10"
      />
    </div>
  );
}

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
  const [decks, setDecks] = useState<Deck[]>(
    initialDecks.map(deck => ({
      ...deck,
      labels: deck.labels || []
    }))
  );
  const [isCreating, setIsCreating] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  initialDecks.map(deck => ({
    ...deck,
    labels: deck.labels || [] // Ensure labels is always an array
  }))

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
      const response = await fetch(editingDeck ? `/api/decks/${editingDeck.id}` : '/api/decks', {
        method: editingDeck ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          title: data.title,
          description: data.description || '',
          labels: data.labels || []
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save deck');
      }

      const savedDeck = await response.json();

      if (editingDeck) {
        setDecks(prevDecks => prevDecks.map(deck =>
          deck.id === editingDeck.id ? savedDeck : deck
        ));
      } else {
        setDecks(prevDecks => [...prevDecks, savedDeck]);
      }

      form.reset();
      setIsCreating(false);
      setEditingDeck(null);

      toast({
        title: "Success",
        description: `Deck ${editingDeck ? 'updated' : 'created'} successfully`,
      });
    } catch (error) {
      console.error("Failed to save deck:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const filteredDecks = React.useMemo(() => {
    const searchLower = searchQuery.toLowerCase();
    return decks.filter(deck => {
      // Search in title and description
      const titleMatch = deck.title?.toLowerCase().includes(searchLower) ?? false;
      const descriptionMatch = deck.description?.toLowerCase().includes(searchLower) ?? false;

      // Safely handle labels search with proper null checking
      const labelMatch = Array.isArray(deck.labels) && deck.labels.length > 0
        ? deck.labels.some(label =>
          label && typeof label === 'string' && label.toLowerCase().includes(searchLower)
        )
        : false;

      return titleMatch || descriptionMatch || labelMatch;
    });
  }, [decks, searchQuery]);

  const DeckLabels: React.FC<DeckLabelsProps> = ({ labels }) => {
    if (!labels?.length) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {labels.map(label => (
          label ?
            (<Badge
              key={label}
              variant="secondary"
              className="px-2 py-1 bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300"
            >
              {label}
            </Badge>)
            : ""
        ))}
      </div>
    );
  };

  const handleDelete = async (deck: Deck) => {
    try {
      const response = await fetch(`/api/decks/${deck.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete deck');
      }

      setDecks(prevDecks => prevDecks.filter(d => d.id !== deck.id));

      toast({
        title: "Success",
        description: "Collection deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete deck:", error);
      toast({
        title: "Error",
        description: "Failed to delete deck. Please try again.",
        variant: "destructive",
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
          <div className="flex gap-5">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search collections..."
            />
            <Button
              onClick={() => setIsCreating(true)}
              className="dark:bg-white dark:text-black dark:hover:bg-neutral-200"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              New Collection
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredDecks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="col-span-full flex flex-col items-center justify-center p-12 text-center"
              >
                {searchQuery ? (
                  <>
                    <div className="w-16 h-16 bg-neutral-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                      <Search className="w-8 h-8 text-neutral-500 dark:text-neutral-400" />
                    </div>
                    <h3 className="text-xl font-light text-neutral-800 dark:text-white mb-2">
                      No matching collections found
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      Try adjusting your search terms
                    </p>
                  </>
                ) : (
                  // Your existing empty state
                  <>
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
                  </>
                )}
              </motion.div>
            ) : (
              filteredDecks.map((deck, index) => (
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
                      <div className="space-y-4">
                        <DeckLabels labels={deck.labels} />
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2 mt-auto pt-4">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            onClick={(e) => e.stopPropagation()}
                            className="dark:border-white/10 dark:hover:border-white/20 dark:text-white"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Collection</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete &quot;{deck.title}&quot;? This action cannot be undone
                              and all flashcards in this collection will be permanently deleted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(deck)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
              <FormField
                control={form.control}
                name="labels"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-neutral-300">Labels</FormLabel>
                    <FormControl>
                      <DeckLabelInput
                        labels={field.value || []}
                        onLabelsChange={(newLabels) => field.onChange(newLabels)}
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