import { useState } from 'react';
import { Sheet } from './Sheet';
import { TextField } from './Input';
import { addMeal } from '../api/daily';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tg } from '../lib/telegram';
import type { MealType } from '../types/db';

const TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'meal'];

interface Props { open: boolean; onClose: () => void }

export function AddMealSheet({ open, onClose }: Props) {
  const [name, setName] = useState('');
  const [mealType, setMealType] = useState<MealType>('meal');
  const [calories, setCalories] = useState('');
  const qc = useQueryClient();

  const m = useMutation({
    mutationFn: () => addMeal({
      name: name.trim(),
      meal_type: mealType,
      calories: calories ? Number(calories) : undefined,
    }),
    onSuccess: () => {
      tg.notify('success');
      qc.invalidateQueries({ queryKey: ['meals'] });
      qc.invalidateQueries({ queryKey: ['summary'] });
      qc.invalidateQueries({ queryKey: ['score'] });
      setName('');
      setCalories('');
      setMealType('meal');
      onClose();
    },
  });

  return (
    <Sheet open={open} onClose={onClose} title="Log a meal">
      <div className="space-y-3 pt-2">
        <TextField autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Meal name…" />
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => { tg.selection(); setMealType(t); }}
              className={`px-3 py-2 rounded-full text-[13px] capitalize ${mealType === t ? 'bg-accent text-white' : 'bg-bg-3'}`}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          placeholder="Calories (optional)"
          type="number"
          inputMode="numeric"
          className="w-full bg-bg-3 rounded-2xl px-4 py-3 text-[15px] outline-none"
        />
        <button
          onClick={() => m.mutate()}
          disabled={!name.trim() || m.isPending}
          className="w-full py-3.5 rounded-full bg-accent text-white font-semibold disabled:opacity-50"
        >
          {m.isPending ? 'Saving…' : 'Add meal'}
        </button>
      </div>
    </Sheet>
  );
}
