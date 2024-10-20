'use client'

import React, { useState, useCallback } from 'react'
import { Deck, Flashcard } from '@/lib/types'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const flashcardSchema = z.object({
  front: z.string().min(1, "Front side is required"),
  back: z.string().min(1, "Back side is required")
})

export default function DeckPageClient({ 
  initialDeck, 
  initialFlashcards 
}: { 
  initialDeck: Deck, 
  initialFlashcards: Flashcard[] 
}) {
  const [deck, setDeck] = useState(initialDeck)
  const [flashcards, setFlashcards] = useState(initialFlashcards)
  const [isCreating, setIsCreating] = useState(false)
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null)

  const form = useForm({
    resolver: zodResolver(flashcardSchema),
    defaultValues: {
      front: "",
      back: ""
    }
  })

  const onSubmit = async (data: z.infer<typeof flashcardSchema>) => {
    try {
      if (editingCard) {
        const response = await fetch(`/api/flashcards/${editingCard.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const updatedCard = await response.json();
        setFlashcards(prevCards => prevCards.map(card => 
          card.id === editingCard.id ? updatedCard : card
        ));
      } else {
        const response = await fetch('/api/flashcards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, deckId: deck.id })
        });
        const newCard = await response.json();
        setFlashcards(prevCards => [...prevCards, newCard]);
      }
      form.reset();
      setIsCreating(false);
      setEditingCard(null);
    } catch (error) {
      console.error("Failed to save flashcard:", error);
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this flashcard?")) {
      try {
        await fetch(`/api/flashcards/${id}`, {
          method: 'DELETE'
        });
        setFlashcards(prevCards => prevCards.filter(card => card.id !== id));
      } catch (error) {
        console.error("Failed to delete flashcard:", error);
      }
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">{deck.title}</h1>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{deck.title}</CardTitle>
          <CardDescription>{deck.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Number of cards: {flashcards.length}</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button asChild>
            <Link href={`/review?deckId=${deck.id}`}>Start Review</Link>
          </Button>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>Add Flashcard</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCard ? "Edit Flashcard" : "Add New Flashcard"}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="front"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Front</FormLabel>
                        <FormControl>
                          <Input placeholder="Front side of the flashcard" {...field} />
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
                          <Input placeholder="Back side of the flashcard" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Save</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
      <h2 className="text-2xl font-bold mb-4">Flashcards in this Deck</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {flashcards.map((card) => (
          <Card key={card.id}>
            <CardHeader>
              <CardTitle>Flashcard</CardTitle>
            </CardHeader>
            <CardContent>
              <p><strong>Front:</strong> {card.front}</p>
              <p><strong>Back:</strong> {card.back}</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="mr-2" onClick={() => {
                setEditingCard(card);
                form.reset({ front: card.front, back: card.back });
                setIsCreating(true);
              }}>
                Edit
              </Button>
              <Button variant="destructive" onClick={() => handleDelete(card.id)}>Delete</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}