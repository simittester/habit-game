import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Sparkles, Flame, Target, Sun } from 'lucide-react';
import { createHabit } from '../api/habits';
import { createProject } from '../api/structure';
import { createTask } from '../api/tasks';
import { markOnboarded } from '../api/settings';
import { todayIso } from '../lib/dates';
import { tg } from '../lib/telegram';
import type { Profile } from '../lib/auth';
import type { Frequency } from '../types/db';

const HABIT_SUGGESTIONS: Array<{ name: string; emoji: string; freq: Frequency }> = [
  { name: 'Drink 8 glasses of water', emoji: '💧', freq: 'daily' },
  { name: 'Read 10 pages', emoji: '📚', freq: 'daily' },
  { name: 'Workout', emoji: '💪', freq: 'weekdays' },
  { name: 'Morning walk', emoji: '🏃', freq: 'daily' },
  { name: '5-min meditation', emoji: '🧘', freq: 'daily' },
  { name: 'No phone after 22:00', emoji: '😴', freq: 'daily' },
];

const PROJECT_SUGGESTIONS: Array<{ name: string; emoji: string }> = [
  { name: 'Get fit', emoji: '💪' },
  { name: 'Learn a language', emoji: '🗣️' },
  { name: 'Start a side project', emoji: '🚀' },
  { name: 'Read 12 books this year', emoji: '📚' },
  { name: 'Save money', emoji: '💰' },
];

const TASK_SUGGESTIONS = [
  'Plan tomorrow tonight',
  '30-min deep work session',
  'Reach out to a friend',
  'Take a walk outside',
];

interface Props { profile: Profile }
type Step = 0 | 1 | 2 | 3 | 4;

export default function OnboardingScreen({ profile }: Props) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>(0);

  const finishM = useMutation({
    mutationFn: () => markOnboarded(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      navigate('/today');
    },
  });

  const finish = () => { tg.haptic('medium'); finishM.mutate(); };
  const next = () => setStep((s) => Math.min(4, (s + 1) as Step) as Step);

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-bg fade-in">
      {step < 4 && <Header step={step} onQuit={finish} />}
      <div className="flex-1 overflow-y-auto">
        {step === 0 && <WelcomeStep profile={profile} onNext={next} />}
        {step === 1 && <HabitStep onNext={next} />}
        {step === 2 && <ProjectStep onNext={next} />}
        {step === 3 && <TaskStep onNext={next} />}
        {step === 4 && <DoneStep profile={profile} onFinish={finish} />}
      </div>
    </div>
  );
}

function Header({ step, onQuit }: { step: Step; onQuit: () => void }) {
  return (
    <div
      className="flex items-center justify-between px-5 pb-3"
      style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)' }}
    >
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-accent' : i < step ? 'w-1.5 bg-accent/60' : 'w-1.5 bg-bg-3'}`}
          />
        ))}
      </div>
      <button onClick={() => { tg.haptic('light'); onQuit(); }} className="text-hint text-[14px] font-medium active:opacity-60">
        Skip setup
      </button>
    </div>
  );
}

function WelcomeStep({ profile, onNext }: { profile: Profile; onNext: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 pt-6 pb-8 text-center fade-in">
      <div className="text-6xl mb-4">🔥</div>
      <h1 className="text-[30px] font-bold leading-tight">Welcome to Momentum, {profile.first_name ?? 'friend'}.</h1>
      <p className="text-[15px] text-hint mt-2 max-w-[280px]">Plan less. Do more. Build the days you actually want.</p>

      <div className="mt-8 w-full space-y-3 max-w-md">
        <ValueCard emoji="🔥" title="Build habits that stick" hint="Daily streaks, milestone confetti, 14-week heatmaps." />
        <ValueCard emoji="🎯" title="Break goals into doable steps" hint="Projects with tasks beneath them, progress that fills as you finish." />
        <ValueCard emoji="📈" title="See your progress grow" hint="Daily score, completion rates, weekly review." />
      </div>

      <button
        onClick={() => { tg.haptic('medium'); onNext(); }}
        className="mt-8 w-full max-w-md py-4 rounded-full bg-accent text-white font-semibold text-[16px] flex items-center justify-center gap-2 active:scale-95 transition"
      >
        Let's set you up <ChevronRight size={18} />
      </button>
      <p className="text-[11px] text-hint mt-3">Takes 60 seconds.</p>
    </div>
  );
}

function ValueCard({ emoji, title, hint }: { emoji: string; title: string; hint: string }) {
  return (
    <div className="flex items-start gap-3 bg-bg-2 rounded-2xl p-4 text-left">
      <div className="text-2xl shrink-0">{emoji}</div>
      <div className="flex-1">
        <div className="text-[15px] font-semibold">{title}</div>
        <div className="text-[12px] text-hint mt-0.5">{hint}</div>
      </div>
    </div>
  );
}

function HabitStep({ onNext }: { onNext: () => void }) {
  const qc = useQueryClient();
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);
  const [customName, setCustomName] = useState('');
  const [freq, setFreq] = useState<Frequency>('daily');

  const m = useMutation({
    mutationFn: async () => {
      const sug = pickedIdx !== null ? HABIT_SUGGESTIONS[pickedIdx] : null;
      const name = sug?.name ?? customName.trim();
      const emoji = sug?.emoji ?? '🔥';
      const f = sug?.freq ?? freq;
      if (!name) return;
      await createHabit({ name, emoji, frequency: f });
    },
    onSuccess: () => {
      tg.notify('success');
      qc.invalidateQueries({ queryKey: ['habits'] });
      qc.invalidateQueries({ queryKey: ['habit-streaks'] });
      onNext();
    },
  });

  const canContinue = pickedIdx !== null || customName.trim().length > 0;

  return (
    <div className="flex flex-col px-6 pt-2 pb-8 fade-in">
      <div className="flex items-center gap-2 text-accent text-[12px] font-semibold tracking-wider uppercase">
        <Flame size={14} /> Step 1 · Habit
      </div>
      <h1 className="text-[26px] font-bold leading-tight mt-2">What's one habit you want to build?</h1>
      <p className="text-[14px] text-hint mt-1">Pick one. You can change or add more later.</p>

      <div className="grid grid-cols-1 gap-2 mt-5">
        {HABIT_SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => { tg.selection(); setPickedIdx(i); setCustomName(''); }}
            className={`flex items-center gap-3 p-3 rounded-2xl text-left transition active:scale-[0.98] ${pickedIdx === i ? 'bg-accent/15 ring-2 ring-accent' : 'bg-bg-2'}`}
          >
            <div className="text-2xl shrink-0">{s.emoji}</div>
            <div className="flex-1">
              <div className="text-[15px] font-medium">{s.name}</div>
              <div className="text-[11px] text-hint capitalize">{s.freq}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-5">
        <div className="text-[11px] text-hint tracking-wider uppercase mb-2">Or write your own</div>
        <input
          value={customName}
          onChange={(e) => { setCustomName(e.target.value); if (e.target.value) setPickedIdx(null); }}
          placeholder="Habit name…"
          className="w-full bg-bg-3 rounded-2xl px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-accent"
        />
        {pickedIdx === null && customName && (
          <div className="flex gap-2 mt-3">
            {(['daily', 'weekdays', 'weekends'] as Frequency[]).map((f) => (
              <button
                key={f}
                onClick={() => { tg.selection(); setFreq(f); }}
                className={`flex-1 py-2 rounded-full text-[13px] capitalize ${freq === f ? 'bg-accent text-white' : 'bg-bg-3'}`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => m.mutate()}
        disabled={!canContinue || m.isPending}
        className="mt-6 w-full py-4 rounded-full bg-accent text-white font-semibold text-[16px] flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition"
      >
        {m.isPending ? 'Saving…' : <>Continue <ChevronRight size={18} /></>}
      </button>
    </div>
  );
}

function ProjectStep({ onNext }: { onNext: () => void }) {
  const qc = useQueryClient();
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);
  const [customName, setCustomName] = useState('');

  const m = useMutation({
    mutationFn: async () => {
      const sug = pickedIdx !== null ? PROJECT_SUGGESTIONS[pickedIdx] : null;
      const name = sug?.name ?? customName.trim();
      const emoji = sug?.emoji ?? '🎯';
      if (!name) return;
      await createProject({ name, emoji });
    },
    onSuccess: () => {
      tg.notify('success');
      qc.invalidateQueries({ queryKey: ['projects'] });
      onNext();
    },
  });

  const canContinue = pickedIdx !== null || customName.trim().length > 0;

  return (
    <div className="flex flex-col px-6 pt-2 pb-8 fade-in">
      <div className="flex items-center gap-2 text-accent text-[12px] font-semibold tracking-wider uppercase">
        <Target size={14} /> Step 2 · Big goal
      </div>
      <h1 className="text-[26px] font-bold leading-tight mt-2">What's a big goal you're working toward?</h1>
      <p className="text-[14px] text-hint mt-1">We'll create a project for it. You'll add tasks underneath.</p>

      <div className="grid grid-cols-2 gap-2 mt-5">
        {PROJECT_SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => { tg.selection(); setPickedIdx(i); setCustomName(''); }}
            className={`p-3 rounded-2xl text-left transition active:scale-[0.98] ${pickedIdx === i ? 'bg-accent/15 ring-2 ring-accent' : 'bg-bg-2'}`}
          >
            <div className="text-2xl mb-1">{s.emoji}</div>
            <div className="text-[14px] font-medium">{s.name}</div>
          </button>
        ))}
      </div>

      <div className="mt-5">
        <div className="text-[11px] text-hint tracking-wider uppercase mb-2">Or write your own</div>
        <input
          value={customName}
          onChange={(e) => { setCustomName(e.target.value); if (e.target.value) setPickedIdx(null); }}
          placeholder="What does done look like?"
          className="w-full bg-bg-3 rounded-2xl px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="mt-6 space-y-2">
        <button
          onClick={() => m.mutate()}
          disabled={!canContinue || m.isPending}
          className="w-full py-4 rounded-full bg-accent text-white font-semibold text-[16px] flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition"
        >
          {m.isPending ? 'Saving…' : <>Continue <ChevronRight size={18} /></>}
        </button>
        <button
          onClick={() => { tg.haptic('light'); onNext(); }}
          className="w-full py-3 rounded-full text-hint text-[14px] active:opacity-60"
        >
          Skip this step
        </button>
      </div>
    </div>
  );
}

function TaskStep({ onNext }: { onNext: () => void }) {
  const qc = useQueryClient();
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);
  const [customName, setCustomName] = useState('');

  const m = useMutation({
    mutationFn: async () => {
      const title = pickedIdx !== null ? TASK_SUGGESTIONS[pickedIdx] : customName.trim();
      if (!title) return;
      await createTask({ title, priority: 1, scheduled_for: todayIso() });
    },
    onSuccess: () => {
      tg.notify('success');
      qc.invalidateQueries({ queryKey: ['tasks'] });
      onNext();
    },
  });

  const canContinue = pickedIdx !== null || customName.trim().length > 0;

  return (
    <div className="flex flex-col px-6 pt-2 pb-8 fade-in">
      <div className="flex items-center gap-2 text-accent text-[12px] font-semibold tracking-wider uppercase">
        <Sun size={14} /> Step 3 · Today
      </div>
      <h1 className="text-[26px] font-bold leading-tight mt-2">One thing you'll do today?</h1>
      <p className="text-[14px] text-hint mt-1">Don't overthink it. Small wins compound.</p>

      <div className="space-y-2 mt-5">
        {TASK_SUGGESTIONS.map((t, i) => (
          <button
            key={i}
            onClick={() => { tg.selection(); setPickedIdx(i); setCustomName(''); }}
            className={`w-full p-3 rounded-2xl text-left transition active:scale-[0.98] ${pickedIdx === i ? 'bg-accent/15 ring-2 ring-accent' : 'bg-bg-2'}`}
          >
            <div className="text-[14px] font-medium">⭐ {t}</div>
          </button>
        ))}
      </div>

      <div className="mt-5">
        <div className="text-[11px] text-hint tracking-wider uppercase mb-2">Or write your own</div>
        <input
          value={customName}
          onChange={(e) => { setCustomName(e.target.value); if (e.target.value) setPickedIdx(null); }}
          placeholder="One task that matters today…"
          className="w-full bg-bg-3 rounded-2xl px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="mt-6 space-y-2">
        <button
          onClick={() => m.mutate()}
          disabled={!canContinue || m.isPending}
          className="w-full py-4 rounded-full bg-accent text-white font-semibold text-[16px] flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition"
        >
          {m.isPending ? 'Saving…' : <>Continue <ChevronRight size={18} /></>}
        </button>
        <button
          onClick={() => { tg.haptic('light'); onNext(); }}
          className="w-full py-3 rounded-full text-hint text-[14px] active:opacity-60"
        >
          Skip this step
        </button>
      </div>
    </div>
  );
}

function DoneStep({ profile, onFinish }: { profile: Profile; onFinish: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 pt-12 pb-8 text-center fade-in">
      <div className="text-7xl mb-4">🚀</div>
      <h1 className="text-[30px] font-bold leading-tight">You're set up, {profile.first_name ?? 'friend'}.</h1>
      <p className="text-[15px] text-hint mt-3 max-w-[300px]">
        Open Momentum every morning. Check off habits. Watch the streak grow. Small days build big years.
      </p>

      <div className="mt-8 w-full max-w-md space-y-3">
        <ValueCard emoji="🔥" title="Tap on Today to start" hint="Your first habit and task are waiting." />
        <ValueCard emoji="✨" title="Hit a 7-day streak" hint="Confetti happens at every milestone." />
      </div>

      <button
        onClick={onFinish}
        className="mt-8 w-full max-w-md py-4 rounded-full bg-accent text-white font-semibold text-[16px] flex items-center justify-center gap-2 active:scale-95 transition"
      >
        Open Momentum <Sparkles size={18} />
      </button>
    </div>
  );
}
