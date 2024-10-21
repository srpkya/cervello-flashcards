import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface FlipCardProps {
  front: string;
  back: string;
}

const FlipCard: React.FC<FlipCardProps> = ({ front, back }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="w-full h-64 cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
      style={{ perspective: '1000px' }}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', height: '100%', transformStyle: 'preserve-3d' }}
      >
        <motion.div
          className="absolute w-full h-full bg-white rounded-lg shadow-lg flex items-center justify-center p-6"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <p className="text-xl font-semibold text-center">{front}</p>
        </motion.div>
        <motion.div
          className="absolute w-full h-full bg-blue-100 rounded-lg shadow-lg flex items-center justify-center p-6"
          style={{ backfaceVisibility: 'hidden', rotateY: 180 }}
        >
          <p className="text-xl font-semibold text-center">{back}</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default FlipCard;