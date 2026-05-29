import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Moon, Sun, Plus, Minus, Trash2 } from 'lucide-react';
import { Sheet } from './Sheet';
import { TextField } from './Input';
import { computeSleepHours, getSleepToday, upsertSleep, deleteSleepLog } from '../api/sleep';
import { getSettings } from '../api/settings';
import { tg } from '../lib/telegram';

interface Props { open: boolean; onClose: () => void }

const QUALITY_LABELS = ['Awful', 'Poor', 'Okay', 'Good', 'Great'];

export function AddSleepSheet({ open, onClose }: Props) {
  const qc = useQueryClient();
  const todayQ = useQuery({ queryKey: ['sleep', 'today'], queryFn: getSleepToday, enabled: open });
  const settingsQ = useQuery({ queryKey: ['settings'], queryFn: getSettings });
  const target = settingsQ.data?.sleep_target_hours ? Number(settingsQ.data.sleep_target_hours) : 8;

  const [hours, setHours] = useState(8);
  const [useTimes, setUseTimes] = useState(false);
  const [bedtime, setBedtime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [quality, setQuality] = useState<number | null>(null);
  const [note, setNote] = useState('');

  // Pre-fill if there's an existing log for today
  useEffect(() => {
    if (open && todayQ.data) {
      setHours(Number(todayQ.data.hours));
      if (todayQ.data.bedtime && todayQ.data.wake_time) {
        setUseTimes(true);
        setBedtime(todayQ.data.bedtime.slice(0, 5));
        setWakeTime(todayQ.data.wake_time.slice(0, 5));
      }
      setQuality(todayQ.data.quality);
      setNote(todayQ.data.note ?? '');
    } else if (open && !todayQ.data) {
      // reset to defaults when no entry exists
      setHours(target);
      setUseTimes(false);
      setBedtime('23:00');
      setWakeTime('07:00');
      setQuality(null);
      setNote('');
    }
  }, [open, todayQ.data, target]);

  // Auto-compute hours when times are used
  useEffect(() => {
    if (useTimes) {
      const h = computeSleepHours(bedtime, wakeTime);
      if (h >= 1 && h <= 16) setHours(h);
    }
  }, [useTimes, bedtime, wakeTime]);

  const saveM = useMutation({
    mutationFn: () => upsertSleep({
      hours,
      bedtime: useTimes ? `${bedtime}:00` : null,
      wake_time: useTimes ? `${wakeTime}:00` : null,
      quality,
      note: note.trim() || null,
    }),
    onSuccess: () => {
      tg.notify('success');
      qc.invalidateQueries({ queryKey: ['sleep'] });
      onClose();
    },
  });

  const deleteM = useMutation({
    mutationFn: () => todayQ.data ? deleteSleepLog(todayQ.data.id) : Promise.resolve(),
    onSuccess: () => {
      tg.notify('warning');
      qc.invalidateQueries({ queryKey: ['sleep'] });
      onClose();
    },
  });

  const hitTarget = hours >= target;

  return (
    <Sheet open={open} onClose={onClose} title={todayQ.data ? 'Edit sleep' : 'Log sleep'}>
      <div className="space-y-4 pt-2 pb-2">
        {/* Hero hours */}
        <div className="bg-bg-3 rounded-2xl p-5 flex items-center justify-between">
          <button
            onClick={() => { tg.haptic('light'); setHours((h) => Math.max(1, +(h - 0.5).toFixed(1))); }}
            disabled={useTimes}
            className="w-11 h-11 rounded-full bg-bg-4 flex items-center justify-center active:opacity-60 disabled:opacity-30"
          >
            <Minus size={18} />
          </button>
          <div className="text-center">
            <div className="text-[36px] font-bold leading-none tabular-nums">{hours.toFixed(1)}</div>
            <div className={`text-[11px] mt-1 ${hitTarget ? 'text-green-400' : 'text-hint'} tracking-wider uppercase`}>
              {hitTarget ? `✓ Target ${target}h` : `hours · target ${target}h`}
            </div>
          </div>
          <button
            onClick={() => { tg.haptic('light'); setHours((h) => Math.min(16, +(h + 0.5).toFixed(1))); }}
            disabled={useTimes}
            className="w-11 h-11 rounded-full bg-bg-4 flex items-center justify-center active:opacity-60 disabled:opacity-30"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Times toggle */}
        <div>
          <button
            onClick={() => { tg.selection(); setUseTimes((v) => !v); }}
            className={`w-full flex items-center justify-between p-3 rounded-2xl text-[14px] transition ${useTimes ? 'bg-accent/15 ring-2 ring-accent' : 'bg-bg-3'}`}
          >
            <span className="flex items-center gap-2">
              <Moon size={14} className="text-accent" />
              <span>Log exact times</span>
            </span>
            <span className="text-[11px] text-hint">{useTimes ? 'on' : 'off'}</span>
          </button>

          {useTimes && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <div className="text-[10px] text-hint tracking-wider uppercase mb-1 flex items-center gap-1">
                  <Moon size={11} /> Bedtime
                </div>
                <input
                  type="time"
                  value={bedtime}
                  onChange={(e) => setBedtime(e.target.value)}
                  className="w-full bg-bg-3 rounded-xl px-3 py-2.5 text-[15px] outline-none focus:ring-2 focus:ring-accent tabular-nums"
                />
              </div>
              <div>
                <div className="text-[10px] text-hint tracking-wider uppercase mb-1 flex items-center gap-1">
                  <Sun size={11} /> Wake
                </div>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="w-full bg-bg-3 rounded-xl px-3 py-2.5 text-[15px] outline-none focus:ring-2 focus:ring-accent tabular-nums"
                />
              </div>
            </div>
          )}
        </div>

        {/* Quality */}
        <div>
          <div className="text-[10px] text-hint tracking-wider uppercase mb-2">How did it feel?</div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((q) => (
              <button
                key={q}
                onClick={() => { tg.selection(); setQuality(quality === q ? null : q); }}
                className={`flex-1 py-2.5 rounded-xl text-[20px] transition active:scale-95 ${quality === q ? 'bg-accent/20 ring-2 ring-accent' : 'bg-bg-3'}`}
              >
                {q === 1 ? '😩' : q === 2 ? '😕' : q === 3 ? '😐' : q === 4 ? '🙂' : '🤩'}
              </button>
            ))}
          </div>
          {quality !== null && (
            <div className="text-[11px] text-hint mt-1.5 text-center">{QUALITY_LABELS[quality - 1]}</div>
          )}
        </div>

        {/* Note */}
        <TextField
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)"
          maxLength={140}
        />

        {/* Save + delete */}
        <button
          onClick={() => saveM.mutate()}
          disabled={hours < 1 || hours > 16 || saveM.isPending}
          className="w-full py-3.5 rounded-full bg-accent text-white font-semibold disabled:opacity-50"
        >
          {saveM.isPending ? 'Saving…' : todayQ.data ? 'Save changes' : 'Log sleep'}
        </button>

        {todayQ.data && (
          <button
            onClick={async () => {
              const ok = await tg.showConfirm('Delete today’s sleep entry?');
              if (ok) deleteM.mutate();
            }}
            className="w-full py-2 text-red-400 text-[13px] font-medium flex items-center justify-center gap-1.5 active:opacity-60"
          >
            <Trash2 size={14} /> Delete entry
          </button>
        )}

        <div className="text-[11px] text-hint text-center">Logged for today. Logging again overwrites today's entry.</div>
      </div>
    </Sheet>
  );
}
