import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { Sheet } from './Sheet';
import { listWeightLogs, deleteWeightLog } from '../api/body';
import { format } from 'date-fns';
import { tg } from '../lib/telegram';
import type { WeightLog } from '../types/db';

interface Props { open: boolean; onClose: () => void }

export function WeightHistorySheet({ open, onClose }: Props) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['weight', 'logs'], queryFn: () => listWeightLogs(180), enabled: open });

  const delM = useMutation({
    mutationFn: (id: string) => deleteWeightLog(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['weight'] }),
  });

  const logs = ((q.data ?? []) as WeightLog[]).slice().reverse(); // newest first

  return (
    <Sheet open={open} onClose={onClose} title="Weight history">
      <div className="pt-2 pb-2">
        {logs.length === 0 ? (
          <div className="text-center py-6 text-hint text-sm">No entries yet.</div>
        ) : (
          <div className="space-y-2">
            {logs.map((log, i) => {
              const prev = logs[i + 1];
              const delta = prev ? Number(log.weight_kg) - Number(prev.weight_kg) : null;
              return (
                <div key={log.id} className="bg-bg-3 rounded-2xl p-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[16px] font-semibold tabular-nums">{Number(log.weight_kg).toFixed(1)}</span>
                      <span className="text-[11px] text-hint">kg</span>
                      {delta !== null && delta !== 0 && (
                        <span className={`text-[11px] font-semibold tabular-nums ${delta > 0 ? 'text-amber-300' : 'text-green-400'}`}>
                          {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-hint mt-0.5">{format(new Date(log.log_date), 'EEE, MMM d, yyyy')}</div>
                    {log.note && (
                      <div className="text-[13px] text-text/90 mt-1.5 italic">"{log.note}"</div>
                    )}
                  </div>
                  <button
                    onClick={async () => {
                      if (await tg.showConfirm(`Delete entry from ${format(new Date(log.log_date), 'MMM d')}?`)) {
                        delM.mutate(log.id);
                      }
                    }}
                    className="text-hint p-1 active:opacity-60"
                    aria-label="Delete entry"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Sheet>
  );
}
