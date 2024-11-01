import { render, screen, fireEvent } from '@testing-library/react';
import { DeckLabelInput } from '@/components/DeckLabelInput';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

describe('DeckLabelInput', () => {
  const mockOnLabelsChange = vi.fn();

  beforeEach(() => {
    mockOnLabelsChange.mockClear();
  });

  it('adds new label when pressing Enter', async () => {
    render(<DeckLabelInput labels={[]} onLabelsChange={mockOnLabelsChange} />);
    
    const input = screen.getByPlaceholderText(/add label/i);
    await userEvent.type(input, 'New Label{enter}');

    expect(mockOnLabelsChange).toHaveBeenCalledWith(['New Label']);
  });

  it('removes label when clicking X icon', () => {
    render(<DeckLabelInput labels={['Test Label']} onLabelsChange={mockOnLabelsChange} />);
    
    const removeIcon = screen.getByTestId('remove-label-Test Label');
    fireEvent.click(removeIcon);

    expect(mockOnLabelsChange).toHaveBeenCalledWith([]);
  });
});