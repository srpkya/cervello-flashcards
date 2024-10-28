import { TranslationResult } from "./types";

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 5,
  initialDelay = 1000
): Promise<Response> {
  let lastError: Error | null = null;
  let waitTime = initialDelay;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 503) {
        console.log(`Service unavailable, attempt ${attempt + 1} of ${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        waitTime *= 2;
        continue;
      }

      return response;
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        waitTime *= 2;
      }
    }
  }

  throw lastError || new Error('Max retries reached');
}

const TRANSLATION_MODEL_MAP: { [key: string]: string } = {
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

export const supportedLanguages = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'German' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' }
];

export async function getTranslation(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult> {
  if (!process.env.HUGGINGFACE_API_KEY) {
    throw new Error('HUGGINGFACE_API_KEY environment variable is not set');
  }

  const modelKey = `${sourceLang}-${targetLang}`;
  const translationModel = TRANSLATION_MODEL_MAP[modelKey];

  if (!translationModel) {
    throw new Error(`Unsupported language pair: ${sourceLang} to ${targetLang}`);
  }

  try {
    const response = await fetchWithRetry(
      `https://api-inference.huggingface.co/models/${translationModel}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: text
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Translation failed with status ${response.status}`);
    }

    const result = await response.json();
    const translatedText = Array.isArray(result) 
      ? result[0].translation_text 
      : result.translation_text;

    return {
      source: text,
      target: translatedText,
      sourceExample: '',  // Removed example sentence functionality
      targetExample: ''   // Removed example sentence functionality
    };
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}