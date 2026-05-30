import { AlertCircle, Eye, LockKeyhole, Server, ShieldCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { loginSession, type AppSession } from '../../api/netarApi';

interface LoginPageProps {
  onLogin: (session: AppSession) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');

    const response = await loginSession(username, password);

    setBusy(false);

    const session = response.envelope?.data;
    if (!response.ok || !session) {
      setError(response.envelope?.msg ?? response.error ?? 'Login failed. Check the configured service and credentials.');
      return;
    }

    onLogin(session);
  };

  return (
    <main className="login-page">
      <section className="login-hero" aria-label="Netar EMS sign in">
        <div className="login-brand">
          <img src="/assets/netar-light-logo.png" alt="Netar EMS" />
          <span>Netar EMS</span>
        </div>
        <div className="login-copy">
          <h1>Network operations console</h1>
          <p>Monitor network elements, subscribers, sessions, alarms, configuration, maintenance, and diagnostics from one guarded EMS workspace.</p>
        </div>
        <div className="login-assurance-grid">
          <span><ShieldCheck size={17} /> Role based operator access</span>
          <span><Server size={17} /> Service configured by environment</span>
          <span><LockKeyhole size={17} /> Guarded live actions</span>
        </div>
      </section>

      <form className="login-card" onSubmit={handleSubmit}>
        <div>
          <h2>Login Platform</h2>
          <p>Use your operator credentials to enter Netar EMS.</p>
        </div>

        <label>
          <span>Login account</span>
          <input
            autoComplete="username"
            placeholder="Login account"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </label>

        <label>
          <span>Login password</span>
          <div className="password-field">
            <input
              autoComplete="current-password"
              placeholder="Login password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <Eye size={16} aria-hidden="true" />
          </div>
        </label>

        {error && (
          <div className="login-error" role="alert">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <button type="submit" disabled={busy}>
          {busy ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </main>
  );
}
