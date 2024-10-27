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
    <div className="flex flex-col items-center gap-4 p-8">
      <div className="w-full max-w-2xl space-y-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-2xl font-light text-neutral-800 dark:text-white">
            Start Review Session
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Select the decks you want to review
          </p>
        </div>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between dark:border-white/10 dark:bg-white/5"
            >
              {selectedDecks.length === 0
                ? "Select decks..."
                : `${selectedDecks.length} deck${selectedDecks.length === 1 ? '' : 's'} selected`}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search decks..." />
              <CommandEmpty>No decks found.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {decks.map((deck) => (
                  <CommandItem
                    key={deck.id}
                    onSelect={() => toggleDeck(deck)}
                    className="flex items-center gap-2"
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border",
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

        <div className="flex justify-center">
          <Button
            onClick={onStartReview}
            disabled={selectedDecks.length === 0}
            className="dark:bg-white dark:text-black dark:hover:bg-neutral-200 min-w-[200px]"
          >
            Start Review
          </Button>
        </div>

        {selectedDecks.length > 0 && (
          <div className="text-sm text-center text-neutral-600 dark:text-neutral-400">
            Ready to review {selectedDecks.length} deck{selectedDecks.length === 1 ? '' : 's'}
          </div>
        )}
      </div>
    </div>
  );
}