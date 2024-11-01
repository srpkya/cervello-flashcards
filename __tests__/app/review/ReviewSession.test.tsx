import { render, screen, fireEvent, waitFor } from '@/test-utils/wrapper';
import ReviewSession from '@/app/review/ReviewSession';
import { mockFlashcard } from '@/test-utils/db-mocks';
import { vi } from 'vitest';

describe('ReviewSession', () => {
  const mockOnComplete = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    } as Response);
  });

  it('renders flashcard correctly', () => {
    render(
      <ReviewSession 
        flashcards={[mockFlashcard]} 
        onComplete={mockOnComplete}
        userId="test-user"
      />
    );

    expect(screen.getByText('Test Front')).toBeInTheDocument();
  });

  it('shows back of card when clicked', async () => {
    render(
      <ReviewSession 
        flashcards={[mockFlashcard]} 
        onComplete={mockOnComplete}
        userId="test-user"
      />
    );

    fireEvent.click(screen.getByText('Test Front'));
    expect(await screen.findByText('Test Back')).toBeInTheDocument();
  });

  it('shows completion screen after reviewing all cards', async () => {
    render(
      <ReviewSession 
        flashcards={[mockFlashcard]} 
        onComplete={mockOnComplete}
        userId="test-user"
      />
    );

    // Flip card
    fireEvent.click(screen.getByText('Test Front'));
    
    // Find and click the "Good" button
    const goodButton = await screen.findByText('Good');
    fireEvent.click(goodButton);

    // Wait for completion screen
    await waitFor(() => {
      expect(screen.getByText(/Review Complete/i)).toBeInTheDocument();
    });
  });

  it('calls onComplete when starting new session', async () => {
    render(
      <ReviewSession 
        flashcards={[mockFlashcard]} 
        onComplete={mockOnComplete}
        userId="test-user"
      />
    );

    // Complete the review
    fireEvent.click(screen.getByText('Test Front'));
    const goodButton = await screen.findByText('Good');
    fireEvent.click(goodButton);

    // Find and click the "Start New Session" button
    const startNewButton = await screen.findByText('Start New Session');
    fireEvent.click(startNewButton);

    expect(mockOnComplete).toHaveBeenCalled();
  });
});