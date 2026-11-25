/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { StageStepper } from './components/StageStepper.tsx';
import { TopBar, type AppPage } from './components/TopBar.tsx';
import { CoverPage } from './pages/CoverPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { WalkSummaryPage } from './pages/WalkSummaryPage.tsx';
import { WalkTrackerPage } from './pages/WalkTrackerPage.tsx';
import { apiClient } from './services/apiClient.ts';
import type {
  UserPublic,
  WalkHistoryTotals,
  WalkRecord,
  WeatherReport,
} from './types.ts';

const EMPTY_TOTALS: WalkHistoryTotals = {
  totalWalks: 0,
  totalDurationSeconds: 0,
  totalCaloriesBurned: 0,
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>('cover');
  const [tutors, setTutors] = useState<UserPublic[]>([]);

  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserPublic | null>(null);
  const [currentWeather, setCurrentWeather] = useState<WeatherReport | null>(null);

  const [activeWalk, setActiveWalk] = useState<WalkRecord | null>(null);
  const [lastFinishedWalk, setLastFinishedWalk] = useState<WalkRecord | null>(null);
  const [history, setHistory] = useState<WalkRecord[]>([]);
  const [totals, setTotals] = useState<WalkHistoryTotals>(EMPTY_TOTALS);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [registrationNotice, setRegistrationNotice] = useState<string | null>(null);

  const loadPublicCatalog = useCallback(() => {
    void apiClient.getUsers().then(setTutors).catch(() => setTutors([]));
  }, []);

  useEffect(() => {
    loadPublicCatalog();
  }, [loadPublicCatalog]);

  const loadHistory = useCallback((authToken: string) => {
    setLoadingHistory(true);
    void apiClient
      .getWalkHistory(authToken)
      .then((res) => {
        setHistory(res.walks);
        setTotals(res.totals);
      })
      .catch(() => {
        setHistory([]);
        setTotals(EMPTY_TOTALS);
      })
      .finally(() => {
        setLoadingHistory(false);
      });
  }, []);

  function handleAuthSuccess(newToken: string, user: UserPublic, weather: WeatherReport) {
    setRegistrationNotice(null);
    setToken(newToken);
    setCurrentUser(user);
    setCurrentWeather(weather);
    setActiveWalk(null);
    setLastFinishedWalk(null);
    loadHistory(newToken);
    loadPublicCatalog();
    setCurrentPage('step-3');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleRegisterSuccess(user: UserPublic) {
    setToken(null);
    setCurrentUser(null);
    setCurrentWeather(null);
    setActiveWalk(null);
    setLastFinishedWalk(null);
    setHistory([]);
    setTotals(EMPTY_TOTALS);
    loadPublicCatalog();
    setRegistrationNotice(
      `Cadastro de ${user.tutorName} e ${user.dogName} salvo! Entre agora com seu e-mail (${user.login}) e senha.`,
    );
    setCurrentPage('step-1');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleAuthFailure() {
    setRegistrationNotice(null);
    setToken(null);
    setCurrentUser(null);
    setCurrentWeather(null);
    setActiveWalk(null);
    setLastFinishedWalk(null);
    setHistory([]);
    setTotals(EMPTY_TOTALS);
  }

  function handleLogout() {
    handleAuthFailure();
    setCurrentPage('cover');
  }

  function handleNavigate(page: AppPage) {
    setCurrentPage(page);
    if (page === 'step-4' && token) {
      loadHistory(token);
    }
    if (page === 'cover') {
      loadPublicCatalog();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <TopBar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isAuthenticated={Boolean(token)}
        onLogout={handleLogout}
      />

      {currentPage !== 'cover' && (
        <StageStepper currentPage={currentPage} onNavigate={handleNavigate} />
      )}

      <div className="flex-1">
        {currentPage === 'cover' && (
          <CoverPage pets={tutors} onNavigate={handleNavigate} />
        )}

        {currentPage === 'step-1' && (
          <LoginPage
            isAuthenticated={Boolean(token)}
            currentUser={currentUser}
            currentWeather={currentWeather}
            registrationNotice={registrationNotice}
            onAuthSuccess={handleAuthSuccess}
            onAuthFailure={handleAuthFailure}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'step-2' && (
          <RegisterPage
            onRegisterSuccess={handleRegisterSuccess}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'step-3' && (
          <WalkTrackerPage
            token={token}
            user={currentUser}
            weather={currentWeather}
            activeWalk={activeWalk}
            onWalkStarted={(walk) => setActiveWalk(walk)}
            onWalkFinished={(walk, updatedHistory, updatedTotals) => {
              setActiveWalk(null);
              setLastFinishedWalk(walk);
              setHistory(updatedHistory);
              setTotals(updatedTotals);
            }}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'step-4' && (
          <WalkSummaryPage
            token={token}
            user={currentUser}
            lastFinishedWalk={lastFinishedWalk}
            history={history}
            totals={totals}
            loadingHistory={loadingHistory}
            onNavigate={handleNavigate}
          />
        )}
      </div>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="font-display text-base font-bold text-slate-900">PasseieAu</span>
            <span aria-hidden="true">·</span>
            <span>Login · Cadastro · Passeio · Finalização</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/docs/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-amber-700 hover:text-amber-800 underline underline-offset-4"
            >
              Swagger UI
            </a>
            <span aria-hidden="true">·</span>
            <a
              href="/api/swagger.yaml"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-slate-600 hover:text-slate-900 underline underline-offset-4"
            >
              swagger.yaml
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
