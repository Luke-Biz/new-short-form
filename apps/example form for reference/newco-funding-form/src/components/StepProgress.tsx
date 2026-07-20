import type { FormStep, StepNumber } from '../types';
import { STEP_INFO } from '../constants';

type StepInfo = { n: StepNumber; label: string; shortLabel: string };

type StepProgressProps = {
  currentStep: FormStep;
  highestStep: StepNumber;
  announcement?: string;
  steps?: StepInfo[];
};

type TrackState = 'normal' | 'disqualified' | 'success';

function getTrackState(step: FormStep): TrackState {
  if (step === 'disqualified') return 'disqualified';
  if (step === 'success') return 'success';
  return 'normal';
}

function getFillPercent(step: FormStep): string {
  if (step === 'disqualified' || step === 'success') return '100%';
  const map: Record<StepNumber, string> = { 1: '33%', 2: '66%', 3: '100%' };
  return map[step as StepNumber];
}

function getProgressLabel(step: FormStep, steps: StepInfo[]): string {
  if (step === 'disqualified') return 'Not eligible';
  if (step === 'success') return 'Application submitted';
  return `Step ${step} of 3 — ${steps[(step as StepNumber) - 1].label}`;
}

function getProgressCount(step: FormStep): string {
  if (step === 'disqualified') return '—';
  if (step === 'success') return 'Done';
  const map: Record<StepNumber, string> = { 1: '33%', 2: '66%', 3: '100%' };
  return map[step as StepNumber];
}

const TRACK_COLOR: Record<TrackState, string> = {
  normal: 'var(--brand)',
  disqualified: '#ef4444',
  success: '#16a34a',
};

export function StepProgress({ currentStep, announcement, steps = STEP_INFO }: StepProgressProps) {
  const trackState = getTrackState(currentStep);
  const isTerminal = currentStep === 'disqualified' || currentStep === 'success';

  return (
    <div className="mb-6" aria-label="Form progress">
      {/* Label row */}
      <div className="flex justify-between items-center mb-[7px]">
        <span className="text-[12px] font-medium text-text-muted">
          <span className="sm:hidden">
            {isTerminal
              ? getProgressLabel(currentStep, steps)
              : `${(currentStep as StepNumber)} / 3`}
          </span>
          <span className="hidden sm:inline">{getProgressLabel(currentStep, steps)}</span>
        </span>
        <span className="text-[12px] text-text-tertiary" aria-hidden="true">
          {getProgressCount(currentStep)}
        </span>
      </div>

      {/* Progress track */}
      <div
        role="progressbar"
        aria-valuenow={typeof currentStep === 'number' ? currentStep : undefined}
        aria-valuemin={1}
        aria-valuemax={3}
        aria-label={getProgressLabel(currentStep, steps)}
        className="relative h-[3px] bg-form-border rounded-[2px]"
      >
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 rounded-[2px] transition-[width,background] duration-[400ms] ease-in-out"
          style={{
            width: getFillPercent(currentStep),
            background: TRACK_COLOR[trackState],
          }}
        />
      </div>

      {/* Screen-reader live region for step transitions */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
