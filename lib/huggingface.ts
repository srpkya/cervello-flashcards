import { TranslationResult } from './types';

export interface Language {
  code: string;
  name: string;
}

export const supportedLanguages: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'German' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' }
];

// Map language codes to model names
const MODEL_MAP: { [key: string]: string } = {
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

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
        console.log(`Model loading, attempt ${attempt + 1} of ${maxRetries}`);
        const result = await response.json();
        console.log('Loading response:', result);
        await delay(waitTime);
        waitTime *= 2;
        continue;
      }

      return response;
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt < maxRetries - 1) {
        await delay(waitTime);
        waitTime *= 2;
      }
    }
  }

  throw lastError || new Error('Max retries reached');
}

export async function getTranslation(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult> {
  if (!process.env.HUGGINGFACE_API_KEY) {
    throw new Error('HUGGINGFACE_API_KEY environment variable is not set');
  }

  const modelKey = `${sourceLang}-${targetLang}`;
  const modelName = MODEL_MAP[modelKey];

  if (!modelName) {
    throw new Error(`Unsupported language pair: ${sourceLang} to ${targetLang}`);
  }

  const modelEndpoint = `https://api-inference.huggingface.co/models/${modelName}`;

  try {
    console.log(`Using model: ${modelName}`);
    console.log(`Translating: ${text}`);
    
    const response = await fetchWithRetry(
      modelEndpoint,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
          'x-wait-for-model': 'true'
        },
        body: JSON.stringify({
          inputs: text,
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Translation error response:', errorData);
      throw new Error(`Translation failed with status ${response.status}`);
    }

    const result = await response.json();
    console.log('Raw translation result:', result);

    let translation: string;
    if (Array.isArray(result) && result.length > 0) {
      translation = result[0].translation_text || text;
    } else if (typeof result === 'string') {
      translation = result;
    } else {
      console.error('Unexpected response format:', result);
      throw new Error('Invalid response format from translation service');
    }

    return {
      source: text,
      target: translation,
      sourceExample: text,
      targetExample: translation
    };

  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}