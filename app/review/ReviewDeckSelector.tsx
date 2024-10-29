import React from 'react';
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Deck } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion } from 'framer-motion';

interface ReviewDeckSelectorProps {
  decks: Deck[];
  selectedDecks: Deck[];
  onSelectDecks: (decks: Deck[]) => void;
  onStartReview: () => void;
}

export default function ReviewDeckSelector({ 
  decks, 
  selectedDecks, 
  onSelectDecks,
  onStartReview 
}: ReviewDeckSelectorProps) {
  const [open, setOpen] = React.useState(false);

  const toggleDeck = (deck: Deck) => {
    const isSelected = selectedDecks.some(d => d.id === deck.id);
    if (isSelected) {
      onSelectDecks(selectedDecks.filter(d => d.id !== deck.id));
    } else {
      onSelectDecks([...selectedDecks, deck]);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-8 max-w-xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full space-y-4 text-center"
      >
        <h2 className="text-3xl font-light text-neutral-800 dark:text-white">
          Start Review Session
        </h2>
        <p className="text-lg text-neutral-600 dark:text-neutral-400">
          Select the decks you want to review
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full space-y-4"
      >
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full h-auto py-4 justify-between dark:border-white/10 dark:bg-white/5 text-left"
            >
              <div className="flex flex-col items-start gap-1">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  {selectedDecks.length === 0 ? "Select decks to review" : "Selected decks"}
                </span>
                <span className="font-medium">
                  {selectedDecks.length === 0
                    ? "No decks selected"
                    : `${selectedDecks.length} deck${selectedDecks.length === 1 ? '' : 's'} selected`}
                </span>
              </div>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command className="border dark:border-white/10">
              <CommandInput placeholder="Search decks..." className="h-12" />
              <CommandEmpty>No decks found.</CommandEmpty>
              <CommandGroup className="max-h-[300px] overflow-auto p-2">
                {decks.map((deck) => (
                  <CommandItem
                    key={deck.id}
                    onSelect={() => toggleDeck(deck)}
                    className="flex items-center gap-2 p-2 cursor-pointer"
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                        selectedDecks.some(d => d.id === deck.id)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-neutral-300 dark:border-neutral-700"
                      )}
                    >
                      {selectedDecks.some(d => d.id === deck.id) && (
                        <Check className="h-3 w-3" />
                      )}
                    </div>
                    <span>{deck.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>

        <Button
          onClick={onStartReview}
          disabled={selectedDecks.length === 0}
          className="w-full h-12 dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-lg font-medium"
        >
          Start Review
        </Button>
      </motion.div>
    </div>
  );
}