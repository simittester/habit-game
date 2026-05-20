import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { Section, Card } from '../components/Card';
import { Sheet } from '../components/Sheet';
import { TextField } from '../components/Input';
import { ProgressRing } from '../components/ProgressRing';
import { getWaterToday, setWater, listMealsForDate, addMeal, deleteMeal } from '../api/daily';
import { format } from 'date-fns';
import { tg } from '../lib/telegram';
import type { Meal, MealType } from '../types/db';

export default function HealthScreen() {
  const qc = useQueryClient();
  const [mealOpen, setMealOpen] = useState(false);
  const [mealName, setMealName] = useState('');
  const [mealType, setMealType] = useState<MealType>('meal');
  const [calories, setCalories] = useState('');

  const waterQ = useQuery({ queryKey: ['water', 'today'], queryFn: getWaterToday });
  const mealsQ = useQuery({ queryKey: ['meals', 'today'], queryFn: () => listMealsForDate() });

  const setW = useMutation({
    mutationFn: (n: number) => setWater(n, waterQ.data?.target ?? 8),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['water'] }); qc.invalidateQueries({ queryKey: ['score'] }); },
  });

  const addM = useMutation({
    mutationFn: () => addMeal({ name: mealName.trim(), meal_type: mealType, calories: calories ? Number(calories) : undefined }),
    onSuccess: () => { tg.notify('success'); setMealName(''); setCalories(''); setMealOpen(false); qc.invalidateQueries({ queryKey: ['meals'] }); },
  });

  const delM = useMutation({ mutationFn: deleteMeal, onSuccess: () => qc.invalidateQueries({ queryKey: ['meals'] }) });

  const glasses = waterQ.data?.glasses ?? 0;
  const target = waterQ.data?.target ?? 8;

  return (
    <div className="pb-6">
      <Section title="">
        <h1 className="text-[28px] font-bold leading-tight mt-2">Health</h1>
        <div className="text-[14px] text-hint">Sleep, water, weight, meals.</div>
      </Section>

      <Section title="Hydration">
        <Card>
          <div className="flex items-center gap-4">
            <ProgressRing value={glasses / target} size={64} stroke={6} label={`${glasses}/${target}`} color="#60a5fa" />
            <div className="flex-1">
              <div className="text-[16px] font-semibold">Water</div>
              <div className="text-[13px] text-hint">{glasses} of {target} glasses</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { tg.haptic('light'); setW.mutate(Math.max(0, glasses - 1)); }} className="w-10 h-10 rounded-full bg-bg-3 flex items-center justify-center">
                <Minus size={18} />
              </button>
              <button onClick={() => { tg.haptic('medium'); setW.mutate(glasses + 1); }} className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center">
                <Plus size={18} />
              </button>
            </div>
          </div>
        </Card>
      </Section>

      <Section title="Meals today" action={
        <button onClick={() => setMealOpen(true)} className="text-accent text-[13px]"><Plus size={14} className="inline -mt-0.5" /> Add</button>
      }>
        {(mealsQ.data ?? []).length === 0 ? (
          <Card><div className="text-hint text-sm text-center py-4">No meals logged.</div></Card>
        ) : (
          <div className="rounded-2xl overflow-hidden">
            {(mealsQ.data ?? []).map((m: Meal) => (
              <div key={m.id} className="bg-bg-2 px-3 py-3 flex items-center gap-3 border-b border-divider last:border-b-0">
                <div className="text-lg">🍽️</div>
                <div className="flex-1">
                  <div className="text-[15px] font-medium">{m.name}</div>
                  <div className="text-[12px] text-hint">{format(new Date(m.logged_at), 'HH:mm')} · {m.meal_type}{m.calories ? ` · ${m.calories} kcal` : ''}</div>
                </div>
                <button onClick={() => delM.mutate(m.id)} className="text-hint">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Sheet open={mealOpen} onClose={() => setMealOpen(false)} title="Log a meal">
        <div className="space-y-3 pt-2">
          <TextField autoFocus value={mealName} onChange={(e) => setMealName(e.target.value)} placeholder="Meal name…" />
          <div className="flex flex-wrap gap-2">
            {(['breakfast', 'lunch', 'dinner', 'snack', 'meal'] as MealType[]).map((m) => (
              <button key={m} onClick={() => setMealType(m)} className={`px-3 py-2 rounded-full text-[13px] capitalize ${mealType === m ? 'bg-accent text-white' : 'bg-bg-3'}`}>{m}</button>
            ))}
          </div>
          <input value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="Calories (optional)" type="number" className="w-full bg-bg-3 rounded-2xl px-4 py-3 outline-none" />
          <button onClick={() => addM.mutate()} disabled={!mealName.trim()} className="w-full py-3 rounded-full bg-accent text-white font-semibold disabled:opacity-50">Add meal</button>
        </div>
      </Sheet>
    </div>
  );
}
