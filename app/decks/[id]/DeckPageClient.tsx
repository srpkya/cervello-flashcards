"use client"

import React, { useState, useEffect } from 'react'
import { Deck, Flashcard } from '@/lib/types'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Trash2, PlayCircle, Book, Clock, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const flashcardSchema = z.object({
  front: z.string().min(1, "Front side is required"),
  back: z.string().min(1, "Back side is required")
})

type FlashcardFormData = z.infer<typeof flashcardSchema>

export default function DeckPageClient({ 
  initialDeck, 
  initialFlashcards 
}: { 
  initialDeck: Deck, 
  initialFlashcards: Flashcard[] 
}) {
  const [deck] = useState(initialDeck)
  const [flashcards, setFlashcards] = useState(initialFlashcards)
  const [isCreating, setIsCreating] = useState(false)
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null)
  const { toast } = useToast()

  const form = useForm({
    resolver: zodResolver(flashcardSchema),
    defaultValues: {
      front: "",
      back: ""
    }
  })

  useEffect(() => {
    const fetchFlashcards = async () => {
      try {
        const response = await fetch(`/api/flashcards?deckId=${deck.id}`);
        if (!response.ok) throw new Error('Failed to fetch flashcards');
        const fetchedFlashcards = await response.json();
        setFlashcards(fetchedFlashcards);
      } catch (error) {
        console.error("Failed to fetch flashcards:", error);
        toast({
          title: "Error",
          description: "Failed to load flashcards. Please refresh the page.",
          variant: "destructive",
        });
      }
    };

    fetchFlashcards();
  }, [deck.id, toast]);

  const onSubmit = async (data: FlashcardFormData) => {
    try {
      if (editingCard) {
        const response = await fetch(`/api/flashcards/${editingCard.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            front: data.front,
            back: data.back,
            reviewData: {
              lastReviewed: editingCard.lastReviewed,
              nextReview: editingCard.nextReview,
              easeFactor: editingCard.easeFactor,
              interval: editingCard.interval
            }
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
    if (confirm("Are you sure you want to delete this flashcard?")) {
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
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-white border-neutral-200 mb-8 overflow-hidden">
            <CardHeader className="border-b border-neutral-100 bg-neutral-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl font-light text-neutral-800">{deck.title}</CardTitle>
                  <CardDescription className="text-neutral-600 mt-1">{deck.description}</CardDescription>
                </div>
                <Button 
                  asChild
                  className="bg-neutral-900 text-white hover:bg-neutral-800"
                >
                  <Link href={`/review?deckId=${deck.id}`}>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Start Review
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="py-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-neutral-100 rounded-lg">
                    <Book className="h-5 w-5 text-neutral-600" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">Total Cards</p>
                    <p className="text-2xl font-light">{flashcards.length}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-neutral-100 rounded-lg">
                    <Clock className="h-5 w-5 text-neutral-600" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">Due Today</p>
                    <p className="text-2xl font-light">
                      {flashcards.filter(card => 
                        !card.nextReview || new Date(card.nextReview) <= new Date()
                      ).length}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-neutral-100 bg-neutral-50">
              <Dialog open={isCreating} onOpenChange={setIsCreating}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline"
                    className="border-neutral-300 hover:border-neutral-400"
                    onClick={() => {
                      setEditingCard(null);
                      form.reset({ front: "", back: "" });
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Card
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#F5F2EA] border-neutral-200 sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-light">
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
                            <FormLabel>Front</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter the front side content"
                                className="resize-none bg-white"
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
                            <FormLabel>Back</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter the back side content"
                                className="resize-none bg-white"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end">
                        <Button 
                          type="submit"
                          className="bg-neutral-900 text-white hover:bg-neutral-800"
                        >
                          {editingCard ? "Save Changes" : "Add Card"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
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
                  "bg-white border-neutral-200 hover:border-neutral-300 transition-all",
                  "group hover:shadow-lg hover:-translate-y-1"
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-normal text-neutral-600">Card {index + 1}</CardTitle>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="h-5 w-5 text-neutral-400" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-neutral-500 mb-1">Front</p>
                      <p className="text-sm text-neutral-800">{card.front}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-neutral-500 mb-1">Back</p>
                      <p className="text-sm text-neutral-800">{card.back}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t border-neutral-100 pt-4">
                    <div className="flex justify-between items-center w-full">
                      <div className="text-xs text-neutral-500">
                        {card.lastReviewed 
                          ? `Last reviewed ${new Date(card.lastReviewed).toLocaleDateString()}`
                          : 'Not reviewed yet'
                        }
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-neutral-100"
                          onClick={() => {
                            setEditingCard(card);
                            form.reset({ front: card.front, back: card.back });
                            setIsCreating(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-red-50 hover:text-red-600"
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
      </div>
    </div>
  )
}