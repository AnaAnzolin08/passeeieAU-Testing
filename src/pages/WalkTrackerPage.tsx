import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CloudRain,
  Flame,
  Lock,
  Pause,
  Play,
  Square,
  ThermometerSun,
  Timer,
} from 'lucide-react';
import { apiClient } from '../services/apiClient.ts';
import type { UserPublic, WalkHistoryTotals, WalkRecord, WeatherReport } from '../types.ts';
import { PetPhoto } from '../components/PetPhoto.tsx';
import { formatDurationClock } from '../utils/format.ts';
import type { AppPage } from '../components/TopBar.tsx';

interface WalkTrackerPageProps {
  token: string | null;
  user: UserPublic | null;
  weather: WeatherReport | null;
  activeWalk: WalkRecord | null;
  onWalkStarted: (walk: WalkRecord) => void;
  onWalkFinished: (walk: WalkRecord, history: WalkRecord[], totals: WalkHistoryTotals) => void;
  onNavigate: (page: AppPage) => void;
}

const KCAL_PER_MINUTE = 4.2;

export const WalkTrackerPage: React.FC<WalkTrackerPageProps> = ({
  token,
  user,
  weather,
  activeWalk,
  onWalkStarted,
  onWalkFinished,
  onNavigate,
}) => {
  const [accumulatedSeconds, setAccumulatedSeconds] = useState<number>(0);
  const [segmentStartMs, setSegmentStartMs] = useState<number | null>(null);
  const [segmentElapsed, setSegmentElapsed] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeWalk) {
      setAccumulatedSeconds(0);
      setSegmentStartMs(null);
      setSegmentElapsed(0);
      setIsPaused(false);
      return;
    }

    const startTimeMs = new Date(activeWalk.startedAt).getTime();
    setAccumulatedSeconds(Math.max(0, Math.floor((Date.now() - startTimeMs) / 1000)));
    setSegmentStartMs(Date.now());
    setSegmentElapsed(0);
    setIsPaused(false);
  }, [activeWalk]);

  useEffect(() => {
    if (!activeWalk || isPaused || segmentStartMs === null) {
      return;
    }

    const tick = () => {
      setSegmentElapsed(Math.max(0, Math.floor((Date.now() - segmentStartMs) / 1000)));
    };
    tick();
    const interval = window.setInterval(tick, 500);
    return () => window.clearInterval(interval);
  }, [activeWalk, isPaused, segmentStartMs]);

  if (!token || !user || !weather) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <p className="text-xs font-semibold text-amber-700">
            Duração do Passeio
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold text-slate-900">
            Autentique-se antes de iniciar o monitoramento
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-lg mx-auto">
            Para acompanhar o tempo do passeio e calcular o gasto calórico, faça login ou cadastre
            seu perfil de tutor e pet.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('step-1')}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
            >
              Ir para Login
            </button>
            <button
              type="button"
              onClick={() => onNavigate('step-2')}
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
            >
              Ir para Cadastro
            </button>
          </div>
        </div>
      </main>
    );
  }

  const totalSeconds = accumulatedSeconds + (isPaused ? 0 : segmentElapsed);
  const estimatedCalories = activeWalk
    ? Math.round(((Math.max(1, totalSeconds) / 60) * KCAL_PER_MINUTE) * 100) / 100
    : 0;

  async function handleStartWalk() {
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const walk = await apiClient.startWalk(token);
      onWalkStarted(walk);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível iniciar o passeio.');
    } finally {
      setLoading(false);
    }
  }

  function handlePauseWalk() {
    if (!activeWalk || isPaused || segmentStartMs === null) return;
    const elapsedInSegment = Math.max(0, Math.floor((Date.now() - segmentStartMs) / 1000));
    setAccumulatedSeconds((prev) => prev + elapsedInSegment);
    setSegmentStartMs(null);
    setSegmentElapsed(0);
    setIsPaused(true);
  }

  function handleResumeWalk() {
    if (!activeWalk || !isPaused) return;
    setSegmentStartMs(Date.now());
    setSegmentElapsed(0);
    setIsPaused(false);
  }

  async function handleFinishWalk() {
    if (!token || !activeWalk) return;
    setError(null);
    setLoading(true);
    const finalSeconds = Math.max(
      1,
      accumulatedSeconds +
        (!isPaused && segmentStartMs !== null
          ? Math.floor((Date.now() - segmentStartMs) / 1000)
          : 0),
    );
    try {
      const result = await apiClient.finishWalk(token, activeWalk._id, finalSeconds);
      onWalkFinished(result.walk, result.history, result.totals);
      onNavigate('step-4');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível finalizar o passeio.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
          <p className="text-xs font-semibold text-amber-700">
            Duração e Gasto Calórico
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900">
            Monitoramento do passeio com {user.dogName}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Inicie o cronômetro para registrar o tempo percorrido e acompanhar em tempo real o gasto
            calórico estimado do tutor.
          </p>

          {(weather.hasRain || !weather.canWalk) && !activeWalk ? (
            <div
              role="alert"
              className="mt-6 p-6 rounded-2xl border border-red-300 bg-red-50 text-red-950 space-y-3"
            >
              <div className="flex items-center gap-2.5 font-display text-base font-bold text-red-900">
                {weather.hasRain ? (
                  <CloudRain className="w-6 h-6 text-red-700 shrink-0" aria-hidden="true" />
                ) : (
                  <ThermometerSun className="w-6 h-6 text-red-700 shrink-0" aria-hidden="true" />
                )}
                <span>
                  {weather.hasRain
                    ? 'Tempo chuvoso — Passeio bloqueado preventivamente'
                    : `Calor acima de 27°C entre 9h e 16h (${weather.temperatureC}°C) — Passeio bloqueado`}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-red-800">
                {weather.hasRain ? weather.rainBlockMessage : weather.heatWarning}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-500 bg-slate-200 rounded-xl whitespace-nowrap shrink-0 cursor-not-allowed"
                >
                  <Lock className="w-4 h-4" aria-hidden="true" />
                  <span>Iniciar Passeio (Bloqueado)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {weather.excessiveHeat && (
                <div
                  role="alert"
                  className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-950 flex items-start gap-3"
                >
                  <ThermometerSun
                    className="w-5 h-5 text-amber-700 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div className="space-y-1">
                    <p className="font-display text-sm font-bold text-amber-950">
                      Atenção redobrada: {weather.temperatureC}°C (fora do horário de bloqueio)
                    </p>
                    <p className="text-xs leading-relaxed text-amber-900">
                      {weather.heatWarning}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-6 rounded-2xl bg-slate-900 text-white">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Tempo percorrido</span>
                    <Timer className="w-4 h-4 text-amber-400" aria-hidden="true" />
                  </div>
                  <p className="mt-3 font-mono text-4xl font-semibold tracking-tight tabular-nums">
                    {activeWalk ? formatDurationClock(totalSeconds) : '00:00:00'}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {!activeWalk
                      ? 'Pronto para iniciar'
                      : isPaused
                        ? 'Passeio pausado'
                        : 'Cronômetro ativo em tempo real'}
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Gasto calórico estimado (tutor)</span>
                    <Flame className="w-4 h-4 text-amber-700" aria-hidden="true" />
                  </div>
                  <p className="mt-3 font-mono text-4xl font-semibold tracking-tight text-slate-900 tabular-nums">
                    {estimatedCalories.toFixed(2)}{' '}
                    <span className="text-base font-normal text-slate-500">kcal</span>
                  </p>
                  <p className="mt-2 text-xs text-slate-500 font-mono tabular-nums">
                    Taxa média: {KCAL_PER_MINUTE.toFixed(1)} kcal/min
                  </p>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-sm text-red-800 flex items-start gap-2"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                {!activeWalk ? (
                  <>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleStartWalk}
                      className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-amber-700 hover:bg-amber-800 disabled:opacity-60 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Play className="w-4 h-4" aria-hidden="true" />
                      <span>{loading ? 'Iniciando...' : 'Iniciar Passeio'}</span>
                    </button>
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-xl whitespace-nowrap shrink-0 cursor-not-allowed"
                    >
                      <Pause className="w-4 h-4" aria-hidden="true" />
                      <span>Pausar</span>
                    </button>
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-xl whitespace-nowrap shrink-0 cursor-not-allowed"
                    >
                      <Square className="w-4 h-4" aria-hidden="true" />
                      <span>Finalizar Passeio</span>
                    </button>
                  </>
                ) : (
                  <>
                    {isPaused ? (
                      <button
                        type="button"
                        onClick={handleResumeWalk}
                        className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Play className="w-4 h-4" aria-hidden="true" />
                        <span>Continuar</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handlePauseWalk}
                        className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-900 bg-white border border-slate-300 hover:border-amber-700 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Pause className="w-4 h-4 text-amber-700" aria-hidden="true" />
                        <span>Pausar</span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleFinishWalk}
                      className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Square className="w-4 h-4" aria-hidden="true" />
                      <span>{loading ? 'Finalizando...' : 'Finalizar Passeio'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </section>

        <aside className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-4">
            <PetPhoto
              src={user.dogPhoto}
              alt={user.dogName}
              className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs text-slate-500">Dupla em atividade</p>
              <h2 className="font-display text-lg font-bold text-slate-900 truncate">
                {user.dogName}
              </h2>
              <p className="text-xs text-slate-700 truncate">
                Tutor: {user.tutorName} ({user.login})
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">CEP monitorado</span>
              <span className="font-mono font-medium text-slate-900 tabular-nums">
                {weather.cep}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Localidade</span>
              <span className="font-medium text-slate-900">{weather.cityLabel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Condição climática</span>
              <span className="font-medium text-slate-900">
                {weather.temperatureC}°C · {weather.condition}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onNavigate('step-4')}
              className="w-full px-4 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 hover:border-slate-300 hover:text-slate-900 rounded-xl transition-colors cursor-pointer"
            >
              Ver histórico e finalizações
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
};
