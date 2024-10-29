// app/marketplace/DeckRatingDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Star } from "lucide-react";
import { useSession } from "next-auth/react";

interface DeckRatingDialogProps {
  deck: {
    id: string;
    userId: string;
    averageRating: number;
    ratingCount: number;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRatingSubmit: (rating: number, newAverage: number, newCount: number) => void;
}

export function DeckRatingDialog({
  deck,
  open,
  onOpenChange,
  onRatingSubmit
}: DeckRatingDialogProps) {
  const [hoveredRating, setHoveredRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();
  const { toast } = useToast();

  const handleRatingSubmit = async () => {
    if (!session?.user?.id || selectedRating === 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/marketplace/${deck.id}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          rating: selectedRating
        }),
      });

      if (!response.ok) throw new Error('Failed to submit rating');
      
      // Calculate new average and count
      const newCount = deck.ratingCount + 1;
      const newAverage = ((deck.averageRating * deck.ratingCount) + selectedRating) / newCount;
      
      onRatingSubmit(selectedRating, newAverage, newCount);
      onOpenChange(false);

      toast({
        title: "Success",
        description: "Rating submitted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit rating",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark:glass-card sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-light">Rate Collection</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="flex justify-center space-x-2 mb-6">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                className="relative p-1"
                onMouseEnter={() => setHoveredRating(rating)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setSelectedRating(rating)}
                disabled={isSubmitting}
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    (hoveredRating || selectedRating) >= rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="text-center text-sm text-neutral-600 dark:text-neutral-400 mb-6">
            {selectedRating > 0 && (
              <span>You selected {selectedRating} stars</span>
            )}
          </div>
          <Button
            className="w-full dark:bg-white dark:text-black dark:hover:bg-neutral-200"
            onClick={handleRatingSubmit}
            disabled={isSubmitting || selectedRating === 0}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}