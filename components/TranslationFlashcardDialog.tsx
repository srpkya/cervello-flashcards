'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from 'lucide-react';
import { languageMapping } from '@/lib/huggingface';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';

const formSchema = z.object({
  text: z.string().min(1, "Text is required").max(500, "Text too long"),
  sourceLang: z.string().min(1, "Source language is required"),
  targetLang: z.string().min(1, "Target language is required")
});

type FormData = z.infer<typeof formSchema>;

interface TranslationFlashcardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deckId: string;
  onFlashcardCreated: () => void;
}

const formatResetTime = (resetIn: number): string => {
  const minutes = Math.ceil(resetIn / 60000);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours === 1 ? '' : 's'}`;
};

const RemainingTranslations = ({ count }: { count: number | null }) => {
  // Changed to return a loading indicator when null
  if (count === null) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading translation quota...</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center text-sm text-muted-foreground">
      <div className="flex items-center gap-1.5">
        {count > 0 ? (
          <span className="text-xs font-medium bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
            {count} translation{count === 1 ? '' : 's'} remaining
          </span>
        ) : (
          <span className="text-xs font-medium bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
            No translations remaining
          </span>
        )}
      </div>
    </div>
  );
};

export default function TranslationFlashcardDialog({
  open,
  onOpenChange,
  deckId,
  onFlashcardCreated
}: TranslationFlashcardDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [remainingTranslations, setRemainingTranslations] = useState<number | null>(null);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [resetTime, setResetTime] = useState<number | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: '',
      sourceLang: 'en',
      targetLang: 'de'
    }
  });

  const fetchRemainingTranslations = useCallback(async () => {
    if (!open) return; // Only fetch if dialog is open

    try {
      const response = await fetch('/api/translate');
      if (!response.ok) throw new Error('Failed to fetch translation limit');
      
      const data = await response.json();
      setRemainingTranslations(data.remaining);

      if (data.isLimited) {
        setRateLimitError(data.message);
        setResetTime(data.resetIn);
      } else {
        setRateLimitError(null);
        setResetTime(null);
      }
    } catch (error) {
      console.error('Error fetching translation quota:', error);
      toast({
        title: "Error",
        description: "Failed to check translation quota",
        variant: "destructive",
      });
      setRemainingTranslations(0); // Set to 0 on error to prevent perpetual loading
    }
  }, [open, toast]);

  useEffect(() => {
    if (open) {
      fetchRemainingTranslations();
      const intervalId = setInterval(fetchRemainingTranslations, 30000);
      return () => clearInterval(intervalId);
    }
  }, [open, fetchRemainingTranslations]);

  useEffect(() => {
    if (!open) {
      form.reset();
      setRateLimitError(null);
      setResetTime(null);
    }
  }, [open, form]);

  const onSubmit = async (values: FormData) => {
    setIsLoading(true);
    setRateLimitError(null);

    try {
      const translationResponse = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!translationResponse.ok) {
        const error = await translationResponse.json();
        if (translationResponse.status === 429) {
          setRateLimitError(error.message);
          setResetTime(error.resetIn);
          setRemainingTranslations(0);
          throw new Error(error.message);
        }
        throw new Error(error.error || 'Translation failed');
      }

      const { source, target, remaining } = await translationResponse.json();
      setRemainingTranslations(remaining);

      await createFlashcard(source, target);
      
      toast({
        title: "Success",
        description: "Translation flashcard created successfully",
      });

      form.reset();
      onFlashcardCreated();
      onOpenChange(false); // Close dialog on success
    } catch (error) {
      console.error('Error:', error);
      if (!rateLimitError) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : 'Failed to create flashcard',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createFlashcard = async (source: string, target: string) => {
    const response = await fetch('/api/flashcards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deckId,
        front: source,
        back: target
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create flashcard');
    }

    return response.json();
  };

  const isDisabled = isLoading || remainingTranslations === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark:glass-card sm:max-w-[425px]">
        <DialogHeader>
          <div className="space-y-2">
            <DialogTitle className="text-xl font-light dark:text-white">
              Create Translation Flashcard
            </DialogTitle>
            <RemainingTranslations count={remainingTranslations} />
          </div>
        </DialogHeader>

        {rateLimitError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Rate Limit Exceeded</AlertTitle>
            <AlertDescription className="mt-1">
              <p>{rateLimitError}</p>
              {resetTime && (
                <p className="mt-2 text-sm opacity-90">
                  Resets in: {formatResetTime(resetTime)}
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="dark:text-neutral-200">Word or Phrase</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter word or phrase to translate"
                      className="dark:bg-white/5 dark:border-white/10 dark:text-white"
                      {...field}
                      disabled={isDisabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sourceLang"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="dark:text-neutral-200">Source Language</FormLabel>
                  <Select
                    disabled={isDisabled}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="dark:bg-white/5 dark:border-white/10 dark:text-white">
                        <SelectValue placeholder="Select source language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(languageMapping).map(([code, name]) => (
                        <SelectItem key={code} value={code}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetLang"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="dark:text-neutral-200">Target Language</FormLabel>
                  <Select
                    disabled={isDisabled}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="dark:bg-white/5 dark:border-white/10 dark:text-white">
                        <SelectValue placeholder="Select target language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(languageMapping).map(([code, name]) => (
                        <SelectItem key={code} value={code}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className={cn(
                "w-full transition-all",
                isDisabled
                  ? "dark:bg-neutral-800 dark:text-neutral-400"
                  : "dark:bg-white dark:text-black dark:hover:bg-neutral-200"
              )}
              disabled={isDisabled}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Translation...
                </>
              ) : remainingTranslations === 0 ? (
                'No Translations Available'
              ) : (
                'Create Flashcard'
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}