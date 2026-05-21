import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Minus, Trash2, Ruler, Weight } from 'lucide-react';
import { Section, Card } from '../components/Card';
import { Sheet } from '../components/Sheet';
import { TextField } from '../components/Input';
import { ProgressRing } from '../components/ProgressRing';
import { WeightSparkline } from '../components/WeightSparkline';
import { LogWeightSheet } from '../components/LogWeightSheet';
import { SetHeightSheet } from '../components/SetHeightSheet';
import { WeightHistorySheet } from '../components/WeightHistorySheet';
import { getWaterToday, setWater, listMealsForDate, addMeal, deleteMeal } from '../api/daily';
import { getSettings } from '../api/settings';
import { listWeightLogs, bmi, bmiBucket } from '../api/body';
import { format } from 'date-fns';
import { tg } from '../lib/telegram';
import type { Meal, MealType, WeightLog } from '../types/db';

export default function HealthScreen() {
  const qc = useQueryClient();
  const [mealOpen, setMealOpen] = useState(false);
  const [weightOpen, setWeightOpen] = useState(false);
  const [heightOpen, setHeightOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [mealName, setMealName] = useState('');
  const [mealType, setMealType] = useState<MealType>('meal');
  const [calories, setCalories] = useState('');

  const waterQ = useQuery({ queryKey: ['water', 'today'], queryFn: getWaterToday });
  const mealsQ = useQuery({ queryKey: ['meals', 'today'], queryFn: () => listMealsForDate() });
  const weightQ = useQuery({ queryKey: ['weight', 'logs'], queryFn: () => listWeightLogs(90) });
  const settingsQ = useQuery({ queryKey: ['settings'], queryFn: getSettings });

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

  const weights = (weightQ.data ?? []) as WeightLog[];
  const latestLog = weights.length ? weights[weights.length - 1] : null;
  const latestWeight = latestLog ? Number(latestLog.weight_kg) : null;
  const previousWeight = weights.length >= 2 ? Number(weights[weights.length - 2].weight_kg) : null;
  const weightDelta = latestWeight !== null && previousWeight !== null ? latestWeight - previousWeight : null;

  const height = settingsQ.data?.height_cm ? Number(settingsQ.data.height_cm) : null;
  const bmiValue = latestWeight && height ? bmi(latestWeight, height) : 0;
  const bmiInfo = bmiBucket(bmiValue);

  return (
    <div className="pb-6">
      <Section title="">
        <h1 className="text-[28px] font-bold leading-tight mt-2">Health</h1>
        <div className="text-[14px] text-hint">Sleep, water, weight, meals.</div>
      </Section>

      <Section title="Body">
        <Card>
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-[11px] text-hint tracking-wider uppercase mb-1">
                <Weight size={12} /> Weight
              </div>
              {latestWeight !== null ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-bold tabular-nums">{latestWeight.toFixed(1)}</div>
                    <div className="text-[13px] text-hint">kg</div>
                  </div>
                  {weightDelta !== null && (
                    <div className={`text-[12px] font-semibold ${weightDelta === 0 ? 'text-hint' : weightDelta > 0 ? 'text-amber-300' : 'text-green-400'}`}>
                      {weightDelta > 0 ? '+' : ''}{weightDelta.toFixed(1)} kg vs last log
                    </div>
                  )}
                  {latestLog?.note && (
                    <div className="text-[12px] text-text/80 mt-1.5 italic line-clamp-2">"{latestLog.note}"</div>
                  )}
                </>
              ) : (
                <div className="text-[14px] text-hint">No weight logged yet.</div>
              )}
            </div>

            <div className="text-right shrink-0">
              <div className="flex items-center gap-1 text-[11px] text-hint tracking-wider uppercase mb-1 justify-end">
                <Ruler size={12} /> Height
              </div>
              {height ? (
                <div className="text-[18px] font-semibold tabular-nums">
                  {Math.round(height)} <span className="text-[12px] text-hint">cm</span>
                </div>
              ) : (
                <div className="text-[14px] text-hint">—</div>
              )}
              {bmiValue > 0 && (
                <div className="mt-2">
                  <div className="text-[10px] text-hint tracking-wider uppercase">BMI</div>
                  <div className={`text-[14px] font-semibold tabular-nums ${bmiInfo.color}`}>{bmiValue.toFixed(1)} · {bmiInfo.label}</div>
                </div>
              )}
            </div>
          </div>

          {weights.length >= 2 && (
            <button
              onClick={() => { tg.haptic('light'); setHistoryOpen(true); }}
              className="mt-3 w-full block text-left active:opacity-70"
              aria-label="Open weight history"
            >
              <WeightSparkline logs={weights} />
              <div className="flex items-center justify-between text-[10px] text-hint mt-1">
                <span>{format(new Date(weights[0].log_date), 'MMM d')}</span>
                <span className="text-accent">view history →</span>
                <span>{format(new Date(weights[weights.length - 1].log_date), 'MMM d')}</span>
              </div>
            </button>
          )}

          {weights.length === 1 && (
            <button
              onClick={() => { tg.haptic('light'); setHistoryOpen(true); }}
              className="mt-3 w-full py-1.5 text-[11px] text-accent active:opacity-60"
            >
              View history →
            </button>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => { tg.haptic('medium'); setWeightOpen(true); }}
              className="py-2.5 rounded-2xl bg-bg-3 text-[13px] font-semibold active:opacity-70 flex items-center justify-center gap-1.5"
            >
              <Weight size={13} /> Log weight
            </button>
            <button
              onClick={() => { tg.haptic('medium'); setHeightOpen(true); }}
              className="py-2.5 rounded-2xl bg-bg-3 text-[13px] font-semibold active:opacity-70 flex items-center justify-center gap-1.5"
            >
              <Ruler size={13} /> {height ? 'Edit height' : 'Set height'}
            </button>
          </div>
        </Card>
      </Section>

      <Section title="Hydration">
        <Card>
          <div className="flex items-center gap-4">
            <ProgressRing value={glasses / target} size={64} stroke={6} label={`${glasses}/${target}`} color="#60a5fa" pulseAtComplete={false} />
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

      <LogWeightSheet open={weightOpen} onClose={() => setWeightOpen(false)} initial={latestWeight ?? undefined} />
      <SetHeightSheet open={heightOpen} onClose={() => setHeightOpen(false)} initial={height ?? null} />
      <WeightHistorySheet open={historyOpen} onClose={() => setHistoryOpen(false)} />

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
