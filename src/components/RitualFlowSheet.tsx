import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Sheet } from './Sheet';
import { TextArea } from './Input';
import { tg } from '../lib/telegram';

export interface RitualField {
  key: string;
  title: string;
  hint?: string;
  placeholder?: string;
  suggestions?: string[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  intro: React.ReactNode;
  fields: RitualField[];
  initialValues?: Record<string, string>;
  onSubmit: (values: Record<string, string>) => Promise<void> | void;
  submitting?: boolean;
}

export function RitualFlowSheet({ open, onClose, title, intro, fields, initialValues, onSubmit, submitting }: Props) {
  // Steps = 1 intro + N field steps
  const totalSteps = 1 + fields.length;
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>(initialValues ?? {});

  useEffect(() => {
    if (open) {
      setStep(0);
      setValues(initialValues ?? {});
    }
  }, [open, initialValues]);

  const isLastFieldStep = step === totalSteps - 1;
  const onIntroStep = step === 0;
  const currentField = onIntroStep ? null : fields[step - 1];

  const setCurrentValue = (v: string) => {
    if (currentField) setValues((prev) => ({ ...prev, [currentField.key]: v }));
  };

  const handleNext = async () => {
    tg.haptic('light');
    if (isLastFieldStep) {
      await onSubmit(values);
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <Sheet open={open} onClose={onClose} title={title} fullHeight>
      <div className="flex flex-col" style={{ minHeight: '70vh' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-accent' : i < step ? 'w-1.5 bg-accent/60' : 'w-1.5 bg-bg-3'}`}
              />
            ))}
          </div>
          <div className="text-[11px] text-hint ml-auto tracking-wider">
            STEP {step + 1} / {totalSteps}
          </div>
        </div>

        <div className="flex-1 fade-in">
          {onIntroStep ? (
            <div>{intro}</div>
          ) : (
            <FieldStep
              field={currentField!}
              value={values[currentField!.key] ?? ''}
              onChange={setCurrentValue}
            />
          )}
        </div>

        <div className="mt-4 flex gap-2">
          {step > 0 && (
            <button
              onClick={() => { tg.haptic('light'); setStep((s) => Math.max(0, s - 1)); }}
              className="w-12 h-12 rounded-full bg-bg-3 flex items-center justify-center active:opacity-60"
              aria-label="Back"
              disabled={submitting}
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={submitting}
            className="flex-1 py-3.5 rounded-full bg-accent text-white font-semibold flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition"
          >
            {submitting ? 'Saving…' : isLastFieldStep ? <>Finish <Sparkles size={18} /></> : <>Continue <ChevronRight size={18} /></>}
          </button>
        </div>
      </div>
    </Sheet>
  );
}

function FieldStep({ field, value, onChange }: { field: RitualField; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <h2 className="text-[22px] font-bold leading-tight">{field.title}</h2>
      {field.hint && <p className="text-[13px] text-hint mt-1">{field.hint}</p>}

      <TextArea
        autoFocus
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder ?? 'Write here…'}
        className="mt-4"
        maxLength={500}
      />

      {field.suggestions && field.suggestions.length > 0 && (
        <div className="mt-3">
          <div className="text-[11px] text-hint tracking-wider uppercase mb-2">Quick ideas</div>
          <div className="flex flex-wrap gap-2">
            {field.suggestions.map((s) => (
              <button
                key={s}
                onClick={() => { tg.selection(); onChange(value ? `${value}\n${s}` : s); }}
                className="px-3 py-1.5 rounded-full bg-bg-3 text-[12px] active:opacity-60"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
