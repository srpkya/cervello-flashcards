'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useSession } from "next-auth/react"
import { Deck, ExtendedSession } from '@/lib/types'

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional()
})

export default function DecksClient({ initialDecks }: { initialDecks: Deck[] }) {
  const { data: session } = useSession() as { data: ExtendedSession | null }
  const [decks, setDecks] = useState<Deck[]>(initialDecks)
  const [isCreating, setIsCreating] = useState(false)
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: ""
    }
  })

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!session?.user?.id) {
      console.error("User not authenticated")
      return
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
        })
        const updatedDeck = await response.json()
        setDecks(prevDecks => prevDecks.map(deck => 
          deck.id === editingDeck.id ? updatedDeck : deck
        ))
      } else {
        const response = await fetch('/api/decks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: data.title,
            description: data.description || '',
            userId: session.user.id
          })
        })
        const newDeck = await response.json()
        if (newDeck && newDeck.id) {
          setDecks(prevDecks => [...prevDecks, newDeck])
        } else {
          console.error("Failed to create deck: Invalid response", newDeck)
        }
      }
      form.reset()
      setIsCreating(false)
      setEditingDeck(null)
    } catch (error) {
      console.error("Failed to save deck:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this deck?")) {
      try {
        await fetch(`/api/decks/${id}`, {
          method: 'DELETE'
        })
        setDecks(prevDecks => prevDecks.filter(deck => deck.id !== id))
      } catch (error) {
        console.error("Failed to delete deck:", error)
      }
    }
  }

  if (!session) {
    return <div>Please sign in to view your decks.</div>
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Decks</h1>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Deck
            </Button>
          </DialogTrigger>
          <DialogContent className='bg-gray-400'>
            <DialogHeader>
              <DialogTitle>{editingDeck ? "Edit Deck" : "Create New Deck"}</DialogTitle>
              <DialogDescription>
                {editingDeck 
                  ? "Update the details of your existing deck." 
                  : "Enter the details for your new flashcard deck."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Deck title" {...field} />
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Deck description" {...field} />
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
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {decks.map(deck => (
          <Card key={deck.id}>
            <CardHeader>
              <CardTitle>{deck.title}</CardTitle>
              <CardDescription>{deck.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button asChild>
                <Link href={`/decks/${deck.id}`}>View</Link>
              </Button>
              <div>
                <Button 
                  variant="outline" 
                  className="mr-2" 
                  onClick={() => {
                    setEditingDeck(deck)
                    form.reset({ title: deck.title, description: deck.description || undefined })
                    setIsCreating(true)
                  }}
                >
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleDelete(deck.id)}
                >
                  Delete
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}