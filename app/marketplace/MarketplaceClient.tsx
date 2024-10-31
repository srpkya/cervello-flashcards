// app/marketplace/MarketplaceClient.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from 'framer-motion';
import { Star, StarHalf, MessageCircle, Download, Trash2, Loader2, User } from 'lucide-react';
import { DeckRatingDialog } from './DeckRatingDialog';
import { DeckCommentsDialog } from './DeckCommentsDialog';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from 'date-fns';
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

interface MarketplaceDeck {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  createdAt: number;
  downloads: number;
  averageRating: number;
  ratingCount: number;
  user?: {
    name: string | null;
    image: string | null;
  };
}

interface DeckCardProps {
  deck: MarketplaceDeck;
  onRate: () => void;
  onComment: () => void;
  onRemove?: () => void;
  isOwner?: boolean;
  currentUserId?: string | null;
}

export default function MarketplaceClient() {
  const [allDecks, setAllDecks] = useState<MarketplaceDeck[]>([]);
  const [mySharedDecks, setMySharedDecks] = useState<MarketplaceDeck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<MarketplaceDeck | null>(null);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [removingDeckId, setRemovingDeckId] = useState<string | null>(null);
  const [downloadingDeckId, setDownloadingDeckId] = useState<string | null>(null);
  const { data: session } = useSession();
  const { toast } = useToast();

  useEffect(() => {
    fetchDecks();
    if (session?.user?.id) {
      fetchMySharedDecks();
    }
  }, [session?.user?.id]);

  const fetchDecks = async () => {
    try {
      const response = await fetch('/api/marketplace');
      if (!response.ok) throw new Error('Failed to fetch decks');
      const data = await response.json();
      setAllDecks(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load marketplace decks",
        variant: "destructive",
      });
    }
  };

  const fetchMySharedDecks = async () => {
    if (!session?.user?.id) return;
    try {
      const response = await fetch(`/api/marketplace/user/${session.user.id}`);
      if (!response.ok) throw new Error('Failed to fetch shared decks');
      const data = await response.json();
      setMySharedDecks(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load your shared decks",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFromMarketplace = async (deckId: string) => {
    setRemovingDeckId(deckId);
    try {
      const response = await fetch(`/api/marketplace/${deckId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove deck');
      }

      setAllDecks(prev => prev.filter(deck => deck.id !== deckId));
      setMySharedDecks(prev => prev.filter(deck => deck.id !== deckId));

      toast({
        title: "Success",
        description: "Deck removed from marketplace successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove deck",
        variant: "destructive",
      });
    } finally {
      setRemovingDeckId(null);
    }
  };

  const handleRatingSubmit = async (rating: number, newAverage: number, newCount: number) => {
    if (!selectedDeck || selectedDeck.userId === session?.user?.id) {
      toast({
        title: "Error",
        description: "You cannot rate your own deck",
        variant: "destructive",
      });
      return;
    }

    const updateDeckList = (decks: MarketplaceDeck[]) =>
      decks.map(deck =>
        deck.id === selectedDeck.id
          ? {
            ...deck,
            averageRating: newAverage,
            ratingCount: newCount,
          }
          : deck
      );

    setAllDecks(updateDeckList);
    setMySharedDecks(updateDeckList);
    setIsRatingOpen(false);
  };

  const DeckCard = ({
    deck,
    onRate,
    onComment,
    onRemove,
    isOwner = false,
    currentUserId
  }: DeckCardProps) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const { toast } = useToast();
    const isOwnDeck = deck.userId === currentUserId;
    const { data: session } = useSession();


    const handleAddToCollection = async () => {
      if (!session?.user?.id) {
        toast({
          title: "Error",
          description: "Please sign in to add this collection",
          variant: "destructive",
        });
        return;
      }

      setIsDownloading(true);
      try {
        const response = await fetch(`/api/marketplace/${deck.id}/clone`, {
          method: 'POST',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to add collection');
        }

        toast({
          title: "Success",
          description: "Collection added to your library",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to add collection",
          variant: "destructive",
        });
      } finally {
        setIsDownloading(false);
      }
    };

    const getUserDisplayName = () => {
      if (isOwner || deck.userId === currentUserId) {
        return `${deck.user?.name || 'You'} (You)`;
      }
      return deck.user?.name || 'Anonymous';
    };

    const renderStars = (rating: number) => {
      const ratingValue = rating || 0;
      const fullStars = Math.floor(ratingValue);
      const hasHalfStar = (ratingValue % 1) >= 0.5;

      return (
        <div className="flex items-center space-x-1">
          {[...Array(5)].map((_, index) => {
            if (index < fullStars) {
              return <Star key={index} className="w-4 h-4 fill-yellow-400 text-yellow-400" />;
            } else if (index === fullStars && hasHalfStar) {
              return <StarHalf key={index} className="w-4 h-4 fill-yellow-400 text-yellow-400" />;
            } else {
              return <Star key={index} className="w-4 h-4 text-gray-300" />;
            }
          })}
          <span className="text-sm text-neutral-500 ml-2">
            ({rating ? rating.toFixed(1) : '0.0'})
          </span>
        </div>
      );
    };


    return (
      <Card className="dark:glass-card h-full flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={deck.user?.image || undefined} />
                <AvatarFallback>
                  {deck.user?.name?.[0] || 'A'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-medium dark:text-white">
                  {getUserDisplayName()}
                </div>
                <div className="text-sm text-neutral-500">
                  {formatDistanceToNow(deck.createdAt, { addSuffix: true })}
                </div>
              </div>
            </div>
          </div>
          <CardTitle className="text-xl font-light mt-4">{deck.title}</CardTitle>
          <CardDescription>{deck.description}</CardDescription>
        </CardHeader>

        <CardContent className="flex-grow">
          <div className="space-y-4">
            <div className="flex items-center space-x-1">
              {renderStars(deck.averageRating)}
            </div>
            <div className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-400">
              <Download className="h-4 w-4" />
              <span>{deck.downloads} downloads</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between gap-2">
          {isOwner ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove from Marketplace
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove from Marketplace?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove the deck from the marketplace. All ratings and comments will be deleted.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onRemove}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <>
              <div className="flex space-x-2">
                {!isOwnDeck && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRate}
                    className="dark:border-white/10 dark:hover:border-white/20 dark:text-white"
                  >
                    <Star className="w-4 h-4 mr-1" />
                    Rate
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onComment}
                  className="dark:border-white/10 dark:hover:border-white/20 dark:text-white"
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Comments
                </Button>
              </div>
              {!isOwnDeck && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleAddToCollection}
                  disabled={isDownloading}
                  className="dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-1" />
                      Add
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </CardFooter>
      </Card>
    );
  };
  const renderStars = (rating: number) => {
    const ratingValue = rating || 0;
    const fullStars = Math.floor(ratingValue);
    const hasHalfStar = (ratingValue % 1) >= 0.5;
  
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, index) => {
          if (index < fullStars) {
            return <Star key={index} className="w-4 h-4 fill-yellow-400 text-yellow-400" />;
          } else if (index === fullStars && hasHalfStar) {
            return <StarHalf key={index} className="w-4 h-4 fill-yellow-400 text-yellow-400" />;
          } else {
            return <Star key={index} className="w-4 h-4 text-gray-300" />;
          }
        })}
        <span className="text-sm text-neutral-500 ml-2">
          ({rating ? rating.toFixed(1) : '0.0'})
        </span>
      </div>
    );
  };
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-light text-neutral-800 dark:text-white">
              Collection Marketplace
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-2">
              Discover and add shared collections from the community
            </p>
          </div>
        </div>

        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="browse">Browse Collections</TabsTrigger>
            <TabsTrigger value="my-shared">My Shared</TabsTrigger>
          </TabsList>

          <TabsContent value="browse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {allDecks.map((deck) => (
                  <motion.div
                    key={deck.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <DeckCard
                      deck={deck}
                      onRate={() => {
                        if (deck.userId === session?.user?.id) {
                          toast({
                            title: "Error",
                            description: "You cannot rate your own deck",
                            variant: "destructive",
                          });
                          return;
                        }
                        setSelectedDeck(deck);
                        setIsRatingOpen(true);
                      }}
                      onComment={() => {
                        setSelectedDeck(deck);
                        setIsCommentsOpen(true);
                      }}
                      currentUserId={session?.user?.id}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </TabsContent>

          <TabsContent value="my-shared">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {mySharedDecks.map((deck) => (
                  <motion.div
                    key={deck.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Card className="dark:glass-card h-full flex flex-col">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                              {session?.user?.image ? (
                                <AvatarImage src={session.user.image} />
                              ) : (
                                <AvatarFallback>
                                  {session?.user?.name?.[0] || 'A'}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium dark:text-white">
                                {session?.user?.name}
                              </div>
                              <div className="text-sm text-neutral-500">
                                {formatDistanceToNow(deck.createdAt, { addSuffix: true })}
                              </div>
                            </div>
                          </div>
                        </div>
                        <CardTitle className="text-xl font-light mt-4">{deck.title}</CardTitle>
                        <CardDescription>{deck.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <div className="space-y-4">
                          <div className="flex items-center space-x-1">
                            {renderStars(deck.averageRating)}
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-400">
                            <Download className="h-4 w-4" />
                            <span>{deck.downloads} downloads</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-end gap-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="w-full"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove from Marketplace
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove from Marketplace?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove the deck from the marketplace. All ratings and comments will be deleted.
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveFromMarketplace(deck.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {selectedDeck && (
        <>
          <DeckRatingDialog
            deck={selectedDeck}
            open={isRatingOpen}
            onOpenChange={setIsRatingOpen}
            onRatingSubmit={(rating: number, newAverage: number, newCount: number) => {
              if (selectedDeck.userId === session?.user?.id) {
                toast({
                  title: "Error",
                  description: "You cannot rate your own deck",
                  variant: "destructive",
                });
                return;
              }
              handleRatingSubmit(rating, newAverage, newCount);
            }}
          />
          <DeckCommentsDialog
            deck={{
              ...selectedDeck,
              deckOwnerName: selectedDeck.user?.name || 'Anonymous'
            }}
            open={isCommentsOpen}
            onOpenChange={setIsCommentsOpen}
            currentUserId={session?.user?.id}
          />
        </>
      )}
    </div>
  );
}