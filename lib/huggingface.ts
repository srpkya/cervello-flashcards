// lib/huggingface.ts
import { TranslationResult } from './types';

const MAX_RETRIES = 5;
const BASE_DELAY = 2000;

interface TranslationResponse {
  translation_text: string;
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Implements exponential backoff with jitter
 */
function getBackoffDelay(attempt: number) {
  const exponentialDelay = BASE_DELAY * Math.pow(2, attempt);
  const jitter = Math.random() * 1000; // Add up to 1 second of random jitter
  return exponentialDelay + jitter;
}

/**
 * Makes a request to the Hugging Face model API with retries
 */
async function makeModelRequest(
  model: string,
  apiToken: string,
  body: any,
  attempt: number = 0
): Promise<Response> {
  const response = await fetch(
    `https://api-inference.huggingface.co/models/${model}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      // Increase timeout for initial model loading
      signal: AbortSignal.timeout(30000)
    }
  );

  // Handle specific response codes
  if (response.status === 503) {
    if (attempt >= MAX_RETRIES) {
      throw new Error(`Model ${model} failed to load after ${MAX_RETRIES} attempts`);
    }

    console.log(`Model ${model} is loading (attempt ${attempt + 1}/${MAX_RETRIES})`);
    const backoffDelay = getBackoffDelay(attempt);
    await delay(backoffDelay);
    
    return makeModelRequest(model, apiToken, body, attempt + 1);
  }

  return response;
}

async function translateText(
  text: string,
  model: string,
  apiToken: string
): Promise<string> {
  try {
    const response = await makeModelRequest(model, apiToken, { inputs: text });

    if (!response.ok) {
      throw new Error(`Translation failed: ${response.statusText}`);
    }

    const data: TranslationResponse[] = await response.json();
    
    if (!Array.isArray(data) || !data[0]?.translation_text) {
      throw new Error('Invalid response format from translation service');
    }

    return data[0].translation_text;
  } catch (error) {
    if (error instanceof Error) {
      // Check if it's a timeout error
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        throw new Error('Translation service timed out. Please try again.');
      }
    }
    throw error;
  }
}

export async function getTranslation(
  text: string,
  sourceLang: string,
  targetLang: string,
  apiToken: string
): Promise<TranslationResult> {
  const modelKey = `${sourceLang}-${targetLang}`;
  const model = TRANSLATION_MODEL_MAP[modelKey];

  if (!model) {
    throw new Error(`Unsupported language pair: ${sourceLang} to ${targetLang}`);
  }

  try {
    // Pre-validate the input
    if (!text.trim()) {
      throw new Error('Translation text cannot be empty');
    }

    if (text.length > 500) {
      throw new Error('Text too long. Maximum length is 500 characters.');
    }

    console.log(`Starting translation from ${sourceLang} to ${targetLang}...`);
    const translatedText = await translateText(text, model, apiToken);

    return {
      source: text,
      target: translatedText,
      sourceExample: '',
      targetExample: ''
    };
  } catch (error) {
    console.error('Translation error:', error);
    
    // Provide user-friendly error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes('failed to load')) {
        throw new Error('Translation service is currently initializing. Please try again in a few moments.');
      }
      if (error.message.includes('timed out')) {
        throw new Error('Request timed out. The service might be experiencing high load.');
      }
      if (error.message.includes('Maximum length')) {
        throw new Error(error.message);
      }
    }
    
    // Generic error for other cases
    throw new Error('Translation service is temporarily unavailable. Please try again in a few moments.');
  }
}

export const TRANSLATION_MODEL_MAP: { [key: string]: string } = {
  'en-de': 'Helsinki-NLP/opus-mt-en-de',
  'de-en': 'Helsinki-NLP/opus-mt-de-en',
  'en-fr': 'Helsinki-NLP/opus-mt-en-fr',
  'fr-en': 'Helsinki-NLP/opus-mt-fr-en',
  'en-es': 'Helsinki-NLP/opus-mt-en-es',
  'es-en': 'Helsinki-NLP/opus-mt-es-en',
  'en-it': 'Helsinki-NLP/opus-mt-en-it',
  'it-en': 'Helsinki-NLP/opus-mt-it-en',
  'en-pt': 'Helsinki-NLP/opus-mt-en-pt',
  'pt-en': 'Helsinki-NLP/opus-mt-pt-en',
  'en-ru': 'Helsinki-NLP/opus-mt-en-ru',
  'ru-en': 'Helsinki-NLP/opus-mt-ru-en'
};

export type SupportedLanguage = 'en' | 'de' | 'fr' | 'es' | 'it' | 'pt' | 'ru';

export const languageMapping: Record<SupportedLanguage, string> = {
  'en': 'English',
  'de': 'German',
  'fr': 'French',
  'es': 'Spanish',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian'
};

export function isLanguagePairSupported(sourceLang: string, targetLang: string): boolean {
  return `${sourceLang}-${targetLang}` in TRANSLATION_MODEL_MAP;
}