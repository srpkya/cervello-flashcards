// lib/fsrs.ts
interface FSRSParameters {
  w: [number, number, number, number]; // Weights
  requestRetention: number;
}

export interface Rating {
  rating: 'again' | 'hard' | 'good' | 'easy';
  value: 1 | 2 | 3 | 4;
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

const DEFAULT_PARAMETERS: FSRSParameters = {
  w: [1.0, 1.0, 5.0, -1.0],
  requestRetention: 0.9,
};

export class FSRS {
  private parameters: FSRSParameters;

  constructor(parameters: Partial<FSRSParameters> = {}) {
    this.parameters = { ...DEFAULT_PARAMETERS, ...parameters };
  }

  private getInitialInterval(rating: Rating): number {
    switch (rating.rating) {
      case 'again': return 1/1440;  // 1 minute in days
      case 'hard': return 5/1440;   // 5 minutes
      case 'good': return 10/1440;  // 10 minutes
      case 'easy': return 1;        // 1 day
    }
  }

  // Calculate memory state after delay
  private retrievabilityToStability(R: number, S: number): number {
    const w = this.parameters.w;
    // Cap the stability increase to prevent overflow
    const newStability = Math.min(
      S * (1 + Math.exp(w[0]) * (11 - R) + w[1] * (Math.log(S) - Math.log(1))),
      180 // Cap at 180 days
    );
    return Math.max(1, newStability); // Ensure minimum stability of 1
  }

  // Calculate retrievability given stability and elapsed time
  private calculateRetrievability(S: number, t: number): number {
    return Math.exp(Math.log(0.9) * t / Math.max(1, S));
  }

  // Calculate next interval based on difficulty and stability
  private intervalFromStability(S: number): number {
    // Cap the interval at 180 days (6 months)
    return Math.min(
      Math.max(1, Math.round(S * Math.log(this.parameters.requestRetention) / Math.log(0.9))),
      180
    );
  }

  // Update card state based on rating
  public updateState(
    currentState: CardState,
    rating: Rating,
    now: number = Date.now()
  ): CardState {
    const elapsedDays = Math.max(0, (now - (currentState.scheduledDays || now)) / (24 * 60 * 60 * 1000));
    const R = this.calculateRetrievability(currentState.stability, elapsedDays);

    let newState: CardState = { ...currentState };
    
    // Handle new cards differently
    if (currentState.state === 'new' || currentState.reps === 0) {
      newState.scheduledDays = this.getInitialInterval(rating);
      newState.stability = 1;
      newState.state = rating.rating === 'again' ? 'learning' : 'review';
      newState.reps = 1;
      return newState;
    }

    // Handle learning/relearning cards
    if (currentState.state === 'learning' || currentState.state === 'relearning') {
      if (rating.rating === 'again') {
        newState.scheduledDays = 1/1440; // 1 minute
      } else if (rating.rating === 'good' || rating.rating === 'easy') {
        newState.scheduledDays = 1; // Graduate to 1 day
        newState.state = 'review';
      } else {
        newState.scheduledDays = 10/1440; // 10 minutes
      }
      newState.reps += 1;
      return newState;
    }

    // Handle review cards
    switch (rating.rating) {
      case 'again':
        newState.state = 'relearning';
        newState.stability = Math.max(1, currentState.stability * 0.5);
        newState.difficulty = Math.min(10, currentState.difficulty + 1);
        newState.scheduledDays = 1/1440; // Back to 1 minute
        newState.lapses += 1;
        break;

      case 'hard':
        newState.state = 'review';
        newState.stability = this.retrievabilityToStability(R, currentState.stability) * 0.8;
        newState.difficulty = Math.max(1, currentState.difficulty - 0.5);
        // Cap the interval increase for 'hard' responses
        newState.scheduledDays = Math.min(
          currentState.scheduledDays * 1.2,
          this.intervalFromStability(newState.stability)
        );
        break;

      case 'good':
        newState.state = 'review';
        newState.stability = this.retrievabilityToStability(R, currentState.stability);
        // More conservative interval increase
        newState.scheduledDays = Math.min(
          currentState.scheduledDays * 2,
          this.intervalFromStability(newState.stability)
        );
        break;

      case 'easy':
        newState.state = 'review';
        newState.stability = this.retrievabilityToStability(R, currentState.stability) * 1.3;
        newState.difficulty = Math.max(1, currentState.difficulty - 1);
        // More conservative interval increase for 'easy' responses
        newState.scheduledDays = Math.min(
          currentState.scheduledDays * 2.5,
          this.intervalFromStability(newState.stability)
        );
        break;
    }

    // Cap the maximum interval to 180 days (6 months)
    newState.scheduledDays = Math.min(newState.scheduledDays, 180);
    newState.reps += 1;
    newState.elapsedDays = 0;

    return newState;
  }

  // Get next review date
  public getNextReviewDate(state: CardState): Date {
    const now = new Date();
    // Convert scheduledDays to milliseconds and add to current time
    const nextDate = new Date(now.getTime() + (state.scheduledDays * 24 * 60 * 60 * 1000));
    return nextDate;
  }

  // Get initial state for a new card
  public getInitialState(): CardState {
    return {
      state: 'new',
      stability: 1,
      difficulty: 5,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
    };
  }
}

export const fsrs = new FSRS();