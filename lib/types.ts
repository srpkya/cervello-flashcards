import { Session, DefaultSession } from "next-auth"

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
  createdAt: Date;
  updatedAt: Date;
  lastReviewed: Date | null;
  nextReview: Date | null;
  easeFactor: number;
  interval: number;
}

export interface ReviewData {
  lastReviewed: Date | string;
  nextReview: Date | string;
  easeFactor: number;
  interval: number;
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