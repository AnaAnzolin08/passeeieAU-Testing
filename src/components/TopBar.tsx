import React from 'react';

export type AppPage = 'cover' | 'step-1' | 'step-2' | 'step-3' | 'step-4';

interface TopBarProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  isAuthenticated: boolean;
  onLogout: () => void;
}

const NAV_ITEMS: { id: AppPage; label: string }[] = [
  { id: 'step-1', label: 'Login' },
  { id: 'step-2', label: 'Cadastro' },
  { id: 'step-3', label: 'Passeio' },
  { id: 'step-4', label: 'Finalização' },
];

export const TopBar: React.FC<TopBarProps> = ({
  currentPage,
  onNavigate,
  isAuthenticated,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
        <button
          type="button"
          onClick={() => onNavigate('cover')}
          className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 hover:text-amber-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-700"
        >
          PasseieAu
        </button>

        <nav
          aria-label="Etapas da plataforma"
          className="hidden md:flex items-center gap-6 text-sm font-medium"
        >
          {NAV_ITEMS.map((item) => {
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-700 ${
                  active
                    ? 'border-amber-700 text-slate-900 font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center shrink-0">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={onLogout}
              className="px-4 py-2 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              Sair
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('step-1')}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              Entrar
            </button>
          )}
        </div>
      </div>

      <nav
        aria-label="Etapas mobile"
        className="md:hidden border-t border-slate-100 px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto"
      >
        {NAV_ITEMS.map((item) => {
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`min-h-[40px] px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                active
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
