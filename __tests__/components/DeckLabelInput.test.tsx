import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeckLabelInput } from '@/components/DeckLabelInput';
import { describe, it, expect, vi } from 'vitest';

describe('DeckLabelInput', () => {
  const mockOnLabelsChange = vi.fn();

  beforeEach(() => {
    mockOnLabelsChange.mockClear();
  });

  it('adds new label when pressing Enter', async () => {
    const user = userEvent.setup();
    
    render(
      <DeckLabelInput 
        labels={[]} 
        onLabelsChange={mockOnLabelsChange} 
      />
    );
    
    const input = screen.getByPlaceholderText(/add label/i);
    
    // Type into the input
    await act(async () => {
      await user.type(input, 'New Label');
      await user.keyboard('{Enter}');
    });

    expect(mockOnLabelsChange).toHaveBeenCalledWith(['New Label']);
  });

  it('removes label when clicking X icon', async () => {
    const user = userEvent.setup();
    
    render(
      <DeckLabelInput 
        labels={['Test Label']} 
        onLabelsChange={mockOnLabelsChange} 
      />
    );
    
    const removeButton = screen.getByTestId('remove-label-Test Label');
    
    await act(async () => {
      await user.click(removeButton);
    });

    expect(mockOnLabelsChange).toHaveBeenCalledWith([]);
  });

  it('does not add empty labels', async () => {
    const user = userEvent.setup();
    
    render(
      <DeckLabelInput 
        labels={[]} 
        onLabelsChange={mockOnLabelsChange} 
      />
    );
    
    const input = screen.getByPlaceholderText(/add label/i);
    
    await act(async () => {
      await user.type(input, '   ');
      await user.keyboard('{Enter}');
    });

    expect(mockOnLabelsChange).not.toHaveBeenCalled();
  });

  it('does not add duplicate labels', async () => {
    const user = userEvent.setup();
    
    render(
      <DeckLabelInput 
        labels={['Existing Label']} 
        onLabelsChange={mockOnLabelsChange} 
      />
    );
    
    const input = screen.getByPlaceholderText(/add label/i);
    
    await act(async () => {
      await user.type(input, 'Existing Label');
      await user.keyboard('{Enter}');
    });

    expect(mockOnLabelsChange).not.toHaveBeenCalled();
  });

  it('clears input after adding label', async () => {
    const user = userEvent.setup();
    
    render(
      <DeckLabelInput 
        labels={[]} 
        onLabelsChange={mockOnLabelsChange} 
      />
    );
    
    const input = screen.getByPlaceholderText(/add label/i) as HTMLInputElement;
    
    await act(async () => {
      await user.type(input, 'New Label');
      await user.keyboard('{Enter}');
    });

    expect(input.value).toBe('');
  });
});