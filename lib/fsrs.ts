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
  
  // Default parameters based on FSRS research
  const DEFAULT_PARAMETERS: FSRSParameters = {
    w: [1.0, 1.0, 5.0, -1.0],
    requestRetention: 0.9,
  };
  
  export class FSRS {
    private parameters: FSRSParameters;
  
    constructor(parameters: Partial<FSRSParameters> = {}) {
      this.parameters = { ...DEFAULT_PARAMETERS, ...parameters };
    }
  
    // Calculate memory state after delay
    private retrievabilityToStability(R: number, S: number): number {
      const w = this.parameters.w;
      return S * (1 + Math.exp(w[0]) * (11 - R) + w[1] * (Math.log(S) - Math.log(1)));
    }
  
    // Calculate retrievability given stability and elapsed time
    private calculateRetrievability(S: number, t: number): number {
      return Math.exp(Math.log(0.9) * t / S);
    }
  
    // Calculate next interval based on difficulty and stability
    private intervalFromStability(S: number): number {
      return Math.round(S * Math.log(this.parameters.requestRetention) / Math.log(0.9));
    }
  
    // Update card state based on rating
    public updateState(
      currentState: CardState,
      rating: Rating,
      now: number = Date.now()
    ): CardState {
      const elapsedDays = (now - currentState.scheduledDays) / (24 * 60 * 60 * 1000);
      const R = this.calculateRetrievability(currentState.stability, elapsedDays);
  
      let newState: CardState = { ...currentState };
      
      switch (rating.rating) {
        case 'again':
          newState.state = 'relearning';
          newState.stability = Math.max(1, currentState.stability * 0.5);
          newState.difficulty = Math.min(10, currentState.difficulty + 1);
          newState.lapses += 1;
          break;
  
        case 'hard':
          newState.stability = this.retrievabilityToStability(R, currentState.stability) * 0.8;
          newState.difficulty = Math.max(1, currentState.difficulty - 0.5);
          break;
  
        case 'good':
          newState.stability = this.retrievabilityToStability(R, currentState.stability);
          break;
  
        case 'easy':
          newState.stability = this.retrievabilityToStability(R, currentState.stability) * 1.3;
          newState.difficulty = Math.max(1, currentState.difficulty - 1);
          break;
      }
  
      // Calculate next review interval
      newState.scheduledDays = this.intervalFromStability(newState.stability);
      newState.reps += 1;
      newState.elapsedDays = 0;
  
      // If it's a successful review, move to review state
      if (rating.rating !== 'again') {
        newState.state = 'review';
      }
  
      return newState;
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
  
    // Calculate next review date
    public getNextReviewDate(state: CardState): Date {
      const now = new Date();
      const nextDate = new Date(now.getTime() + state.scheduledDays * 24 * 60 * 60 * 1000);
      return nextDate;
    }
  }
  
  export const fsrs = new FSRS();