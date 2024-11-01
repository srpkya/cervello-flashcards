import { useState } from 'react';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { X } from 'lucide-react';

interface DeckLabelInputProps {
  labels: string[];
  onLabelsChange: (labels: string[]) => void;
}

export function DeckLabelInput({ labels, onLabelsChange }: DeckLabelInputProps) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      if (!labels.includes(input.trim())) {
        onLabelsChange([...labels, input.trim()]);
      }
      setInput('');
    }
  };

  const removeLabel = (labelToRemove: string) => {
    onLabelsChange(labels.filter(label => label !== labelToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {labels.map(label => (
          <Badge
            key={label}
            variant="secondary"
            className="px-2 py-1 flex items-center gap-1"
          >
            {label}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => removeLabel(label)}
              data-testid={`remove-label-${label}`}
            />
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Add label (press Enter)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="dark:bg-white/5 dark:border-white/10"
        />
      </div>
    </div>
  );
}