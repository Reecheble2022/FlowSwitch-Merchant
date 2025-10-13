import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background-light to-slate-100 dark:from-background-dark dark:to-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-soft-lg border border-slate-200 dark:border-slate-800 p-8">
          <div className="flex items-center justify-center mb-8">
            <img
              src="/Screenshot 2025-10-11 114015.png"
              alt="FlowSwitch"
              className="h-12 w-auto"
            />
          </div>

          <h1 className="text-2xl font-bold text-center gradient-text mb-2">
            FlowSwitch Command
          </h1>
          <p className="text-center text-slate-600 dark:text-slate-400 mb-8">
            Sign in to your account
          </p>

          {error && (
            <div className="mb-6 p-3 rounded-xl bg-error/10 dark:bg-error/20 border border-error/30 dark:border-error/30">
              <p className="text-sm text-error dark:text-error">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@flowswitch.dev"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
            <p className="text-xs text-center text-slate-600 dark:text-slate-400">
              Test credentials:<br />
              <span className="font-mono">admin@flowswitch.dev</span> / <span className="font-mono">Admin123!</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
