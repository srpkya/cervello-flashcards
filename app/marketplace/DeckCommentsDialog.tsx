// components/DeckCommentsDialog.tsx
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  createdAt: number;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface DeckCommentsDialogProps {
  deck: {
    id: string;
    deckOwnerName: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId?: string | null;
}

export function DeckCommentsDialog({
  deck,
  open,
  onOpenChange,
  currentUserId
}: DeckCommentsDialogProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();
  const { toast } = useToast();

  useEffect(() => {
    if (open && deck) {
      fetchComments();
    }
  }, [open, deck]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/marketplace/${deck.id}/comments`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      const data = await response.json();
      setComments(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!session?.user?.id || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/marketplace/${deck.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: session.user.id,
          content: newComment.trim()
        }),
      });

      if (!response.ok) throw new Error('Failed to submit comment');

      const newCommentData = await response.json();
      setComments(prev => [...prev, newCommentData]);
      setNewComment('');
      
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit comment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark:glass-card sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-light">Comments</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <ScrollArea className="h-[400px] pr-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-[200px]">
                <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center text-neutral-500 dark:text-neutral-400 py-8">
                No comments yet. Be the first to comment!
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="mb-4 last:mb-0">
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.user.image || undefined} />
                      <AvatarFallback>
                        {comment.user.name?.[0] || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium dark:text-white flex items-center gap-2">
                          {comment.user.name || 'Anonymous'}
                          {comment.user.id === currentUserId && (
                            <span className="text-xs text-neutral-500">(You)</span>
                          )}
                          {comment.user.id === deck.id && (
                            <span className="text-xs text-neutral-500">(Owner)</span>
                          )}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {format(comment.createdAt, 'MMM d, yyyy')}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
          
          {session?.user && (
            <div className="mt-4 space-y-4">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="dark:bg-white/5 dark:border-white/10 min-h-[100px]"
                disabled={isSubmitting}
              />
              <Button
                onClick={handleSubmitComment}
                disabled={isSubmitting || !newComment.trim()}
                className="w-full dark:bg-white dark:text-black dark:hover:bg-neutral-200"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Post Comment'
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}