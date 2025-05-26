import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheck, FaCoins, FaGift } from "react-icons/fa";

interface MilestoneCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  milestone: {
    title: string;
    amount: number;
    description: string;
    type: 'goal_reached' | 'contribution_milestone' | 'pot_completed';
  };
}

const MilestoneCelebration: React.FC<MilestoneCelebrationProps> = ({ 
  isOpen, 
  onClose, 
  milestone 
}) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      // Auto-hide confetti after 3 seconds
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const PotWithHands = ({ isGoalReached }: { isGoalReached: boolean }) => (
    <div className="relative">
      {/* Purple Pot */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        <svg width="80" height="80" viewBox="0 0 80 80" className="mx-auto">
          {/* Pot body */}
          <motion.path
            d="M20 30 L60 30 L58 70 L22 70 Z"
            fill="#8B5CF6"
            stroke="#7C3AED"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          />
          {/* Pot handles */}
          <motion.circle
            cx="15" cy="35" r="3"
            fill="#8B5CF6"
            stroke="#7C3AED"
            strokeWidth="2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8 }}
          />
          <motion.circle
            cx="65" cy="35" r="3"
            fill="#8B5CF6"
            stroke="#7C3AED"
            strokeWidth="2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8 }}
          />
          {/* Filling animation */}
          <motion.rect
            x="22" y="32" width="36" height="36"
            fill="#A855F7"
            initial={{ height: 0, y: 68 }}
            animate={{ height: 36, y: 32 }}
            transition={{ duration: 1.5, delay: 0.5 }}
          />
        </svg>
      </motion.div>
      
      {/* Falling gold coins */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 200 + 50, 
              y: -20, 
              rotate: 0,
              scale: 0
            }}
            animate={{ 
              y: 120, 
              rotate: 360,
              scale: [0, 1, 1, 0.8]
            }}
            transition={{ 
              duration: 2,
              delay: 0.5 + i * 0.2,
              ease: "easeIn"
            }}
            className="absolute text-2xl"
          >
            🪙
          </motion.div>
        ))}
      </div>
    </div>
  );

  const getIcon = () => {
    switch (milestone.type) {
      case 'goal_reached':
        return <PotWithHands isGoalReached={true} />;
      case 'contribution_milestone':
        return <PotWithHands isGoalReached={false} />;
      case 'pot_completed':
        return <FaGift className="text-purple-500" size={60} />;
      default:
        return <FaCoins className="text-green-500" size={60} />;
    }
  };

  const confettiParticles = Array.from({ length: 50 }, (_, i) => (
    <motion.div
      key={i}
      className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-pink-400 rounded-full"
      initial={{
        x: Math.random() * 400,
        y: -10,
        rotate: 0,
        scale: Math.random() * 0.5 + 0.5,
      }}
      animate={{
        y: 500,
        rotate: 360 * 3,
        x: Math.random() * 400,
      }}
      transition={{
        duration: Math.random() * 2 + 2,
        ease: "easeOut",
        delay: Math.random() * 0.5,
      }}
    />
  ));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-primary/5 to-secondary/5 border-none">
        <div className="relative overflow-hidden">
          {/* Confetti Animation */}
          <AnimatePresence>
            {showConfetti && (
              <div className="absolute inset-0 pointer-events-none">
                {confettiParticles}
              </div>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <div className="text-center py-8 px-4 relative z-10">
            {/* Animated Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 260, 
                damping: 20,
                delay: 0.2 
              }}
              className="flex justify-center mb-4"
            >
              {getIcon()}
            </motion.div>

            {/* Animated Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-2xl font-bold text-primary mb-2"
            >
              🎉 {milestone.title}
            </motion.h2>

            {/* Animated Amount */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="text-3xl font-bold text-green-600 mb-2"
            >
              ₡{milestone.amount.toLocaleString()}
            </motion.div>

            {/* Animated Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-muted-foreground mb-6"
            >
              {milestone.description}
            </motion.p>

            {/* Animated Achievement Indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex justify-center mb-6"
            >
              {milestone.type === 'goal_reached' ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    delay: 1.2,
                    type: "spring",
                    stiffness: 300 
                  }}
                  className="flex items-center space-x-2 bg-green-100 px-4 py-2 rounded-full"
                >
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">🎯</span>
                  </div>
                  <span className="text-green-800 font-medium">Target Reached</span>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    delay: 1.2,
                    type: "spring",
                    stiffness: 300 
                  }}
                  className="flex items-center space-x-2 bg-blue-100 px-4 py-2 rounded-full"
                >
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <FaCheck className="text-white text-xs" />
                  </div>
                  <span className="text-blue-800 font-medium">Checkpoint</span>
                </motion.div>
              )}
            </motion.div>

            {/* Animated Close Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              <Button 
                onClick={onClose}
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-white font-bold px-8"
              >
                Continue Saving! 🚀
              </Button>
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MilestoneCelebration;