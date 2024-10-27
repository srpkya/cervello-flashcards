import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CheckCircle, ChevronLeft } from "lucide-react";

export default function ReviewCompletion({ 
    cardsReviewed, 
    studyTime,
    onStartNewSession,
    onBackToDecks 
  }: { 
    cardsReviewed: number;
    studyTime: { hours: number; minutes: number };
    onStartNewSession: () => void;
    onBackToDecks: () => void;
  }) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </motion.div>
        
        <h2 className="text-3xl font-light text-neutral-800 dark:text-white mb-3">
          Review Complete!
        </h2>
        
        <div className="text-center space-y-2 mb-8">
          <p className="text-neutral-600 dark:text-neutral-400">
            You've reviewed {cardsReviewed} cards
          </p>
          <p className="text-neutral-600 dark:text-neutral-400">
            Study time: {studyTime.hours}h {studyTime.minutes}m
          </p>
        </div>
  
        <div className="flex space-x-4">
          <Button
            variant="outline"
            onClick={onBackToDecks}
            className="dark:border-white/10 dark:hover:border-white/20 dark:text-white"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Decks
          </Button>
          <Button
            onClick={onStartNewSession}
            className="dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            Start New Session
          </Button>
        </div>
      </div>
    );
  }