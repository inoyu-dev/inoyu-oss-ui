import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { getAllGoals, UnomiMetadata } from '@/services/client/UnomiClientService';

interface GoalSelectorProps {
  value?: string;
  onChange: (goalId: string | undefined) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function GoalSelector({
  value,
  onChange,
  label = 'Primary Goal',
  required = false,
  disabled = false,
}: GoalSelectorProps) {
  const [goals, setGoals] = useState<UnomiMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const goalsData = await getAllGoals();
        setGoals(goalsData.filter(g => g.enabled));
      } catch (error) {
        console.error('Error fetching goals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, []);

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Select
        value={value || 'none'}
        onValueChange={(val) => onChange(val === 'none' ? undefined : val)}
        disabled={disabled || loading}
      >
        <SelectTrigger>
          <SelectValue placeholder={loading ? 'Loading goals...' : 'Select a goal'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          {goals.map((goal) => (
            <SelectItem key={goal.id} value={goal.id}>
              {goal.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value && (
        <p className="text-xs text-muted-foreground">
          Selected: {goals.find(g => g.id === value)?.name || value}
        </p>
      )}
    </div>
  );
}
