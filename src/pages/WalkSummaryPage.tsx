import React from 'react';
import { ArrowRight, CheckCircle2, Flame, History, Timer } from 'lucide-react';
import type { UserPublic, WalkHistoryTotals, WalkRecord } from '../types.ts';
import { CalorieChart } from '../components/CalorieChart.tsx';
import { PetPhoto } from '../components/PetPhoto.tsx';
import { formatDateTimeBr, formatDurationHuman } from '../utils/format.ts';
import type { AppPage } from '../components/TopBar.tsx';

interface WalkSummaryPageProps {
  token: string | null;
  user: UserPublic | null;
  lastFinishedWalk: WalkRecord | null;
  history: WalkRecord[];
  totals: WalkHistoryTotals;
  loadingHistory: boolean;
  onNavigate: (page: AppPage) => void;
}

export const WalkSummaryPage: React.FC<WalkSummaryPageProps> = ({
  token,
  user,
  lastFinishedWalk,
  history,
  totals,
  loadingHistory,
  onNavigate,
}) => {
  if (!token || !user) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <p className="text-xs font-semibold text-amber-700">
            Histórico do Cliente
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold text-slate-900">
            Área exclusiva de clientes autenticados
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-lg mx-auto">
            Faça login para visualizar o gráfico de calorias gastas e o histórico detalhado dos seus
            passeios.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('step-1')}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
            >
              Ir para Login
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      {lastFinishedWalk && (
        <section className="bg-white border border-emerald-200 rounded-2xl p-6 sm:p-8 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <PetPhoto
              src={user.dogPhoto}
              alt={user.dogName}
              className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                <span>Passeio finalizado e registrado</span>
              </div>
              <h1 className="mt-1 font-display text-xl font-bold text-slate-900">
                Resumo da caminhada com {lastFinishedWalk.dogName}
              </h1>
              <p className="mt-0.5 text-xs text-slate-500 font-mono tabular-nums">
                {formatDateTimeBr(lastFinishedWalk.startedAt)} · CEP {lastFinishedWalk.cep} ·{' '}
                {lastFinishedWalk.temperatureC}°C
              </p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div>
              <p className="text-xs text-slate-500">Duração final</p>
              <p className="mt-0.5 font-mono text-xl font-bold text-slate-900 tabular-nums">
                {formatDurationHuman(lastFinishedWalk.durationSeconds)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Calorias gastas</p>
              <p className="mt-0.5 font-mono text-xl font-bold text-amber-700 tabular-nums">
                {lastFinishedWalk.caloriesBurned.toFixed(1)} kcal
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-amber-700">
              Finalização do Passeio
            </p>
            <h2 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-slate-900">
              Total de calorias gastas pelo tutor
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Tutor: {user.tutorName} ({user.login}) · Visualização individual de gasto calórico.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('step-3')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Novo passeio</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-slate-100">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Passeios concluídos</span>
              <History className="w-4 h-4 text-slate-400" aria-hidden="true" />
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {totals.totalWalks}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Duração acumulada</span>
              <Timer className="w-4 h-4 text-slate-400" aria-hidden="true" />
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {formatDurationHuman(totals.totalDurationSeconds)}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200">
            <div className="flex items-center justify-between text-xs text-amber-800">
              <span>Total de calorias gastas</span>
              <Flame className="w-4 h-4 text-amber-700" aria-hidden="true" />
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-amber-700 tabular-nums">
              {totals.totalCaloriesBurned.toFixed(1)} kcal
            </p>
          </div>
        </div>

        <div className="mt-6">
          <CalorieChart
            walks={history}
            highlightedWalkId={lastFinishedWalk?._id ?? null}
          />
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Histórico detalhado de passeios
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Registro completo de duração e calorias por caminhada realizada por {user.tutorName}.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 tabular-nums">
            {history.length} registros
          </span>
        </div>

        {loadingHistory ? (
          <div className="mt-6 space-y-2">
            <div className="h-10 rounded-lg bg-slate-100 animate-pulse" />
            <div className="h-10 rounded-lg bg-slate-100 animate-pulse" />
          </div>
        ) : history.length === 0 ? (
          <div className="mt-6 p-8 border border-dashed border-slate-200 rounded-xl text-center">
            <p className="text-sm font-medium text-slate-700">
              Você ainda não concluiu nenhum passeio com {user.dogName}.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('step-3')}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              Iniciar primeiro passeio
            </button>
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                  <th className="py-3 pr-4">Data / Início</th>
                  <th className="py-3 px-4">Término</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Tutor</th>
                  <th className="py-3 px-4">Pet</th>
                  <th className="py-3 px-4">CEP &amp; Clima</th>
                  <th className="py-3 px-4 text-right">Duração</th>
                  <th className="py-3 pl-4 text-right">Calorias</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {[...history].reverse().map((walk) => {
                  const isNewest = walk._id === lastFinishedWalk?._id;
                  return (
                    <tr
                      key={walk._id}
                      className={isNewest ? 'bg-amber-50/50' : 'hover:bg-slate-50/80'}
                    >
                      <td className="py-3 pr-4 font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                        {formatDateTimeBr(walk.startedAt)}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                        {walk.finishedAt ? formatDateTimeBr(walk.finishedAt) : '—'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          {walk.status === 'completed' ? 'Finalizado' : 'Em andamento'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                        {walk.tutorName || user.tutorName}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                        {walk.dogName}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                        <span className="font-mono tabular-nums">{walk.cep}</span>
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        <span>
                          {walk.temperatureC}°C ({walk.weatherSummary})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-900 tabular-nums whitespace-nowrap">
                        {formatDurationHuman(walk.durationSeconds)}
                      </td>
                      <td className="py-3 pl-4 text-right font-mono font-semibold text-amber-700 tabular-nums whitespace-nowrap">
                        {walk.caloriesBurned.toFixed(1)} kcal
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
};
