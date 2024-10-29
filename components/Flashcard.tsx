// components/Flashcard.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { cn } from '@/lib/utils';

interface FlashcardProps {
  front: string;
  back: string;
  className?: string;
}

const Flashcard: React.FC<FlashcardProps> = ({
  front,
  back,
  className
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => setIsFlipped(!isFlipped);

  return (
    <Card 
      className={cn(
        "relative dark:glass-card bg-white dark:border-white/5 overflow-hidden cursor-pointer min-h-[400px]",
        className
      )}
      onClick={handleFlip}
    >
      <div className="absolute inset-0 p-8 flex items-center justify-center">
        <motion.div
          className="w-full text-center"
          initial={false}
          animate={{ rotateX: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring" }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className={`${isFlipped ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
            <h3 className="text-xl text-neutral-600 dark:text-neutral-400 mb-4">Front</h3>
            <p className="text-2xl font-light dark:text-white">{front}</p>
          </div>
          <div 
            className={`${isFlipped ? 'opacity-100' : 'opacity-0'} absolute inset-0 flex items-center justify-center transition-opacity duration-300`}
            style={{ transform: "rotateX(180deg)" }}
          >
            <div>
              <h3 className="text-xl text-neutral-600 dark:text-neutral-400 mb-4">Back</h3>
              <p className="text-2xl font-light dark:text-white">{back}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </Card>
  );
};

export default Flashcard;