import { useState, FormEvent, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import logo from '../../pablo-logo.png';

type Step = 'credentials' | 'totp';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, verifyTotp, isAuthenticated } = useAuth();

  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [preAuthToken, setPreAuthToken] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const totpInputRef = useRef<HTMLInputElement>(null);

  if (isAuthenticated) {
    navigate('/pb-admin', { replace: true });
    return null;
  }

  const handleCredentials = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(email, password, rememberMe);
      if ('requiresTotp' in result) {
        setPreAuthToken(result.preAuthToken);
        setStep('totp');
        setTimeout(() => totpInputRef.current?.focus(), 50);
      } else {
        navigate('/pb-admin', { replace: true });
      }
    } catch {
      toast.error('E-posta veya şifre hatalı');
    } finally {
      setLoading(false);
    }
  };

  const handleTotp = async (e: FormEvent) => {
    e.preventDefault();
    if (!totpCode.trim()) return;
    setLoading(true);
    try {
      await verifyTotp(preAuthToken, totpCode.trim(), rememberMe);
      navigate('/pb-admin', { replace: true });
    } catch {
      toast.error('Geçersiz kod, tekrar deneyin');
      setTotpCode('');
      totpInputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleTotpInput = (value: string) => {
    // Allow digits (TOTP) or hex+dash (backup code)
    const cleaned = value.replace(/[^0-9A-Fa-f\-]/g, '').slice(0, 11);
    setTotpCode(cleaned);
  };

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm -mt-20">
        <div className="flex justify-center mb-8">
          <img src={logo} alt="Pablo Artisan" className="h-36 w-auto" />
        </div>

        {step === 'credentials' ? (
          <form onSubmit={handleCredentials} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium tracking-wider uppercase text-pablo-gray mb-1.5">
                E-posta
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-white border border-cream-300 rounded-lg px-4 py-3 text-sm text-pablo-black outline-none focus:ring-2 focus:ring-pablo-red/20 focus:border-pablo-red transition"
                placeholder="admin@pablo.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium tracking-wider uppercase text-pablo-gray mb-1.5">
                Şifre
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full bg-white border border-cream-300 rounded-lg px-4 py-3 pr-11 text-sm text-pablo-black outline-none focus:ring-2 focus:ring-pablo-red/20 focus:border-pablo-red transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-pablo-gray hover:text-pablo-black transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer select-none group">
              <div className="relative flex-shrink-0">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
                    rememberMe
                      ? 'bg-pablo-red border-pablo-red'
                      : 'bg-white border-cream-300 group-hover:border-pablo-gray'
                  }`}
                >
                  {rememberMe && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-pablo-gray">
                Beni hatırla <span className="text-pablo-gray/60 text-xs">(30 gün)</span>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-pablo-red hover:bg-red-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition text-sm tracking-wider mt-2"
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleTotp} className="flex flex-col gap-4">
            <div className="text-center mb-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-pablo-red/10 mb-3">
                <svg className="w-6 h-6 text-pablo-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 3h3m-3 3h3" />
                </svg>
              </div>
              <p className="text-sm text-pablo-gray leading-relaxed">
                Authenticator uygulamasındaki<br />6 haneli kodu girin
              </p>
            </div>

            <div>
              <input
                ref={totpInputRef}
                type="text"
                inputMode="numeric"
                value={totpCode}
                onChange={(e) => handleTotpInput(e.target.value)}
                required
                autoComplete="one-time-code"
                maxLength={11}
                placeholder="000000"
                className="w-full bg-white border border-cream-300 rounded-lg px-4 py-3 text-center text-xl font-mono tracking-[0.4em] text-pablo-black outline-none focus:ring-2 focus:ring-pablo-red/20 focus:border-pablo-red transition"
              />
              <p className="text-xs text-pablo-gray/60 text-center mt-1.5">
                Cihazınızı kaybettiyseniz yedek kodunuzu kullanabilirsiniz
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || totpCode.length < 6}
              className="w-full bg-pablo-red hover:bg-red-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition text-sm tracking-wider"
            >
              {loading ? 'Doğrulanıyor...' : 'Doğrula'}
            </button>

            <button
              type="button"
              onClick={() => { setStep('credentials'); setTotpCode(''); }}
              className="text-xs text-pablo-gray hover:text-pablo-black transition text-center"
            >
              ← Geri dön
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
