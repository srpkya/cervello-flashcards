
export class TranslationError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = 'TranslationError';

    console.error('Translation Error:', {
      message,
      statusCode,
      context,
      stack: this.stack
    });
  }

  static isServiceUnavailable(error: unknown): boolean {
    return error instanceof TranslationError && error.statusCode === 503;
  }

  static isBadRequest(error: unknown): boolean {
    return error instanceof TranslationError && error.statusCode === 400;
  }
}

export class ErrorHandler {
  static async handle(error: unknown) {
    console.error('Raw error:', error);

    if (error instanceof TranslationError) {
      return {
        error: error.message,
        statusCode: error.statusCode,
        context: error.context
      };
    }

    if (error instanceof Error) {
      if (error.message.includes('503')) {
        return {
          error: 'Translation service is temporarily unavailable. Please try again.',
          statusCode: 503
        };
      }
      if (error.message.includes('400')) {
        return {
          error: 'Invalid translation request. Please check your input.',
          statusCode: 400
        };
      }

      return {
        error: `Translation error: ${error.message}`,
        statusCode: 500
      };
    }

    return {
      error: 'An unexpected error occurred',
      statusCode: 500
    };
  }

  static async logError(error: unknown, context?: Record<string, any>) {
    console.error('Translation error:', {
      error,
      context,
      timestamp: new Date().toISOString()
    });
  }
}