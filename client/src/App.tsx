import { useEffect, useState } from 'react';
import { LoginPage } from './components/auth/LoginPage';
import { AppShell } from './components/layout/AppShell';
import { getCurrentSession, type AppSession } from './api/netarApi';

const SESSION_STORAGE_KEY = 'netar.ems.session';

function readStoredSession() {
  try {
    const value = window.localStorage.getItem(SESSION_STORAGE_KEY);
    return value ? JSON.parse(value) as AppSession : null;
  } catch {
    return null;
  }
}

function storeSession(session: AppSession | null) {
  if (!session) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export default function App() {
  const [session, setSession] = useState<AppSession | null>(() => readStoredSession());
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getCurrentSession().then((result) => {
      if (cancelled) return;
      const restoredSession = result.envelope?.data;
      if (result.ok && restoredSession) {
        setSession(restoredSession);
        storeSession(restoredSession);
        return;
      }
      if (result.status === 401 || result.envelope?.msg === 'Session expired') {
        setSession(null);
        storeSession(null);
      }
    }).finally(() => {
      if (!cancelled) {
        setCheckingSession(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogin = (nextSession: AppSession) => {
    setSession(nextSession);
    storeSession(nextSession);
  };

  const handleSessionEnd = () => {
    setSession(null);
    storeSession(null);
  };

  if (checkingSession) {
    return (
      <main className="login-page">
        <section className="login-card">
          <h2>Restoring session</h2>
          <p>Checking your Netar EMS session.</p>
        </section>
      </main>
    );
  }

  if (!session) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <AppShell session={session} onSessionEnd={handleSessionEnd} />;
}
