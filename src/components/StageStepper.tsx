import React from 'react';
import type { AppPage } from './TopBar.tsx';

type StepperPage = Exclude<AppPage, 'cover'>;

interface StageStepperProps {
  currentPage: StepperPage;
  onNavigate: (page: AppPage) => void;
}

const STAGES: { id: StepperPage; title: string }[] = [
  { id: 'step-1', title: 'Login' },
  { id: 'step-2', title: 'Cadastro' },
  { id: 'step-3', title: 'Passeio' },
  { id: 'step-4', title: 'Finalização' },
];

export const StageStepper: React.FC<StageStepperProps> = ({ currentPage, onNavigate }) => {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {STAGES.map((stage) => {
            const active = currentPage === stage.id;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => onNavigate(stage.id)}
                className={`text-left px-4 py-3 rounded-xl border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 ${
                  active
                    ? 'border-amber-700 bg-amber-50/60 text-slate-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                <div className="text-sm font-display font-semibold truncate">
                  {stage.title}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
