import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CloudRain,
  Lock,
  ThermometerSun,
} from 'lucide-react';
import { apiClient } from '../services/apiClient.ts';
import type { UserPublic, WeatherReport } from '../types.ts';
import { PetPhoto } from '../components/PetPhoto.tsx';
import type { AppPage } from '../components/TopBar.tsx';

interface LoginPageProps {
  isAuthenticated: boolean;
  currentUser: UserPublic | null;
  currentWeather: WeatherReport | null;
  registrationNotice?: string | null;
  onAuthSuccess: (token: string, user: UserPublic, weather: WeatherReport) => void;
  onAuthFailure: () => void;
  onNavigate: (page: AppPage) => void;
}

const LOGIN_DOG_GALLERY = [
  {
    src: '/src/assets/images/corgi_avatar_biscoito_1795046208844.jpg',
    alt: 'Corgi Biscoito',
  },
  {
    src: '/src/assets/images/dog_avatar_golden_1795046753182.jpg',
    alt: 'Golden Retriever',
  },
  {
    src: '/src/assets/images/dog_avatar_frenchie_1795046753250.jpg',
    alt: 'Buldogue Francês',
  },
  {
    src: '/src/assets/images/dog_avatar_beagle_1795046753785.jpg',
    alt: 'Beagle',
  },
  {
    src: '/src/assets/images/corgi_avatar_pudim_1795046209907.jpg',
    alt: 'Corgi Pudim',
  },
  {
    src: '/src/assets/images/corgi_avatar_pipoca_1795046209722.jpg',
    alt: 'Corgi Pipoca',
  },
];

export const LoginPage: React.FC<LoginPageProps> = ({
  isAuthenticated,
  currentUser,
  currentWeather,
  registrationNotice,
  onAuthSuccess,
  onAuthFailure,
  onNavigate,
}) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitCredentials(email: string, pass: string) {
    setError(null);
    setLoading(true);
    try {
      const res = await apiClient.login(email, pass);
      onAuthSuccess(res.token, res.user, res.weather);
    } catch (err) {
      onAuthFailure();
      setError(err instanceof Error ? err.message : 'Falha ao realizar login.');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void submitCredentials(login, password);
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <section className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
          <p className="text-xs font-semibold text-amber-700">Autenticação</p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900">
            Entrar na conta do tutor
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Acesse com seu e-mail e senha cadastrados para verificar as condições climáticas do seu
            CEP antes de iniciar o passeio.
          </p>

          {registrationNotice && !isAuthenticated && (
            <div
              role="status"
              className="mt-4 p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-900 flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700" aria-hidden="true" />
              <span>{registrationNotice}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="login-input" className="block text-sm font-medium text-slate-700">
                E-mail (login)
              </label>
              <input
                id="login-input"
                type="email"
                required
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Ex.: seuemail@exemplo.com"
                className="mt-1.5 w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/15"
              />
            </div>

            <div>
              <label htmlFor="password-input" className="block text-sm font-medium text-slate-700">
                Senha
              </label>
              <input
                id="password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha cadastrada"
                className="mt-1.5 w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/15"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-sm text-red-800 flex items-start gap-2.5"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-700" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {loading ? 'Validando...' : 'Entrar e verificar clima'}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('step-2')}
                className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Não tem conta? Cadastre-se
              </button>
            </div>
          </form>
        </section>

        <section className="lg:col-span-6 space-y-5">
          {isAuthenticated && currentUser && currentWeather ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-4">
                <PetPhoto
                  src={currentUser.dogPhoto}
                  alt={currentUser.dogName}
                  className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">
                    Tutor conectado · {currentUser.tutorName} ({currentUser.login})
                  </p>
                  <h2 className="mt-0.5 font-display text-xl font-bold text-slate-900 truncate">
                    {currentUser.dogName}
                  </h2>
                  <p className="mt-1 text-sm font-mono text-slate-600 tabular-nums">
                    CEP {currentWeather.cep} · {currentWeather.cityLabel}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <p className="text-xs text-slate-500">Temperatura atual</p>
                  <p className="mt-1 font-display text-2xl font-bold text-slate-900 font-mono tabular-nums">
                    {currentWeather.temperatureC}°C
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Condição prevista</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {currentWeather.condition}
                  </p>
                </div>
              </div>

              {currentWeather.hasRain && (
                <div
                  role="alert"
                  className="p-4 rounded-xl border border-red-300 bg-red-50 text-red-900 space-y-2"
                >
                  <div className="flex items-center gap-2 font-display text-sm font-bold">
                    <CloudRain className="w-5 h-5 text-red-700 shrink-0" aria-hidden="true" />
                    <span>Previsão de Chuva — Passeio Bloqueado</span>
                  </div>
                  <p className="text-sm leading-relaxed text-red-800">
                    {currentWeather.rainBlockMessage}
                  </p>
                </div>
              )}

              {currentWeather.excessiveHeat && (
                <div
                  role="alert"
                  className={`p-4 rounded-xl border space-y-2 ${
                    !currentWeather.canWalk && !currentWeather.hasRain
                      ? 'border-red-300 bg-red-50 text-red-900'
                      : 'border-amber-300 bg-amber-50 text-amber-950'
                  }`}
                >
                  <div className="flex items-center gap-2 font-display text-sm font-bold">
                    <ThermometerSun
                      className={`w-5 h-5 shrink-0 ${
                        !currentWeather.canWalk && !currentWeather.hasRain
                          ? 'text-red-700'
                          : 'text-amber-700'
                      }`}
                      aria-hidden="true"
                    />
                    <span>
                      {!currentWeather.canWalk && !currentWeather.hasRain
                        ? `Calor excessivo (${currentWeather.temperatureC}°C · acima de 27°C, das 9h às 16h)`
                        : `Atenção redobrada (${currentWeather.temperatureC}°C fora do horário de bloqueio)`}
                    </span>
                  </div>
                  <p
                    className={`text-sm leading-relaxed ${
                      !currentWeather.canWalk && !currentWeather.hasRain
                        ? 'text-red-800'
                        : 'text-amber-900'
                    }`}
                  >
                    {currentWeather.heatWarning}
                  </p>
                </div>
              )}

              {!currentWeather.hasRain && !currentWeather.excessiveHeat && (
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-950 space-y-1.5">
                  <div className="flex items-center gap-2 font-display text-sm font-bold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" aria-hidden="true" />
                    <span>Clima Seguro para Passeio</span>
                  </div>
                  <p className="text-sm text-emerald-900">
                    Nenhuma previsão de chuva ou calor extremo para o CEP {currentWeather.cep}. Você
                    pode iniciar o monitoramento do passeio.
                  </p>
                </div>
              )}

              <div className="pt-2 flex flex-wrap items-center gap-3">
                {currentWeather.canWalk ? (
                  <button
                    type="button"
                    onClick={() => onNavigate('step-3')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Iniciar Passeio</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-500 bg-slate-200 rounded-xl cursor-not-allowed whitespace-nowrap shrink-0"
                  >
                    <Lock className="w-4 h-4" aria-hidden="true" />
                    <span>
                      {currentWeather.hasRain
                        ? 'Início do passeio bloqueado (Chuva)'
                        : 'Início bloqueado: temperatura acima de 27°C entre 9h e 16h'}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onNavigate('step-4')}
                  className="px-4 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 hover:border-slate-300 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Ver histórico
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="relative h-48 sm:h-52 bg-slate-100">
                  <PetPhoto
                    src="/src/assets/images/hero_corgi_walk_1795046209171.jpg"
                    alt="Cachorro passeando com segurança em um parque"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent">
                    <p className="text-xs sm:text-sm font-medium text-white">
                      Passeios seguros para cães de todos os tamanhos.
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50/70 border-t border-slate-100">
                  <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-3 gap-3">
                    {LOGIN_DOG_GALLERY.map((dog) => (
                      <div
                        key={dog.src}
                        className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-white"
                      >
                        <PetPhoto
                          src={dog.src}
                          alt={dog.alt}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed">
                  Ao autenticar-se, o sistema consulta automaticamente a condição climática do CEP
                  cadastrado e aplica duas proteções essenciais para a saúde do seu cachorro:
                </p>
                <div className="space-y-3 pt-2">
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
                    <p className="text-sm font-semibold text-slate-900">
                      Alerta sobre Calor Excessivo
                    </p>
                    <p className="mt-1 text-xs text-slate-700 leading-relaxed">
                      Altas temperaturas elevam o risco de hipertermia, desidratação e queimaduras
                      nos coxins das patas pelo contato com o asfalto aquecido.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-sm font-semibold text-slate-900">
                      Bloqueio Preventivo por Previsão de Chuva
                    </p>
                    <p className="mt-1 text-xs text-slate-700 leading-relaxed">
                      Quando há previsão de chuva no CEP do tutor, um aviso de segurança é exibido e
                      o início do passeio é impedido na plataforma.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};