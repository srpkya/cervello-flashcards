// lib/types.ts
import { Session, DefaultSession } from "next-auth"
import { pipeline, PipelineType } from '@huggingface/transformers';
import type { 
  Flashcard as DrizzleFlashcard,
  StudySession as DrizzleStudySession,
} from './schema';

export interface Deck {
  id: string;
  title: string;
  description: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudyData {
  date: string;
  count: number;
  studyTime: number;
}

export type Config = {
  schema: string
  out: string
  dialect: "sqlite"
  driver: "d1-http" | "expo" | "turso" | undefined
  dbCredentials: {
    url: string
    authToken: string | undefined
  }
}


export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  audio?: string | null;
  createdAt: number;
  updatedAt: number;
  lastReviewed: number | null;
  nextReview: number | null;  // Allow null here
  state: 'new' | 'learning' | 'review' | 'relearning';
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  interval: number;
  easeFactor: number;
}


export interface ReviewData {
  lastReviewed: number;
  nextReview: number | null;  // Allow null here
  state: 'new' | 'learning' | 'review' | 'relearning';
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
}


export interface ExtendedUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

export interface ExtendedSession extends DefaultSession {
  user: ExtendedUser
}

export interface RouteHandlerContext<T = Record<string, string>> {
  params: T;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface StudySessionStats {
  totalCardsToday: number;
  studyTimeToday: number;
  streak: number;
  lastThirtyDays: StudyData[];
}

export interface TranslationResponse {
  source: string;
  target: string;
  sourceExample: string;
  targetExample: string;
  audio?: string;
}

export interface Language {
  code: string;
  name: string;
}

export interface TranslationResult {
  source: string;
  target: string;
  sourceExample: string;
  targetExample: string;
}

export interface TTSOptions {
  speaker_embeddings?: null | string;
  speed_ratio?: number;
  pitch_ratio?: number;
  energy_ratio?: number;
}

export interface TranslationResponse {
  translation_text: string;
}

export interface TranslationWorkerMessage {
  task: PipelineType;
  modelId: string;
  inputs: string;
  options?: Record<string, any>;
}

export type FlashcardUpdateData = {
  front: string;
  back: string;
  reviewData?: {
    lastReviewed: number;
    nextReview: number;
    state?: 'new' | 'learning' | 'review' | 'relearning';
    stability?: number;
    difficulty?: number;
    elapsedDays?: number;
    scheduledDays?: number;
    reps?: number;
    lapses?: number;
  };
};

export interface TranslationWorkerResponse {
  type: 'progress' | 'result' | 'error';
  progress?: number;
  result?: TranslationResponse;
  error?: string;
}


export interface Deck {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CardState {
  state: 'new' | 'learning' | 'review' | 'relearning';
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
}

export type StudySession = DrizzleStudySession;
