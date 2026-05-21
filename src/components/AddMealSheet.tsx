import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { Sheet } from './Sheet';
import { TextField } from './Input';
import { addMeal, deleteMeal, listMealsForDate } from '../api/daily';
import { format } from 'date-fns';
import { tg } from '../lib/telegram';
import type { MealType, Meal } from '../types/db';

const TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'meal'];

interface Props { open: boolean; onClose: () => void }

export function AddMealSheet({ open, onClose }: Props) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['meals', 'today'], queryFn: () => listMealsForDate(), enabled: open });
  const meals = (q.data ?? []) as Meal[];

  const [name, setName] = useState('');
  const [mealType, setMealType] = useState<MealType>('meal');
  const [calories, setCalories] = useState('');

  const addM = useMutation({
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
    },
  });

  const delM = useMutation({
    mutationFn: (id: string) => deleteMeal(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meals'] }),
  });

  return (
    <Sheet open={open} onClose={onClose} title="Meals today">
      <div className="space-y-4 pt-2">
        {meals.length > 0 && (
          <div className="rounded-2xl overflow-hidden">
            {meals.map((m) => (
              <div key={m.id} className="bg-bg-3 px-3 py-2.5 flex items-center gap-3 border-b border-divider last:border-b-0">
                <div className="text-base">🍽️</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] truncate">{m.name}</div>
                  <div className="text-[11px] text-hint truncate">
                    {format(new Date(m.logged_at), 'HH:mm')} · {m.meal_type}
                    {m.calories ? ` · ${m.calories} kcal` : ''}
                  </div>
                </div>
                <button
                  onClick={() => { tg.haptic('medium'); delM.mutate(m.id); }}
                  className="text-hint p-1 active:opacity-60"
                  aria-label="Delete meal"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3">
          <div className="text-[11px] text-hint tracking-wider uppercase">
            {meals.length === 0 ? 'Log your first meal' : 'Add another meal'}
          </div>
          <TextField
            autoFocus={meals.length === 0}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Meal name…"
          />
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
            onClick={() => addM.mutate()}
            disabled={!name.trim() || addM.isPending}
            className="w-full py-3.5 rounded-full bg-accent text-white font-semibold disabled:opacity-50"
          >
            {addM.isPending ? 'Saving…' : 'Add meal'}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
