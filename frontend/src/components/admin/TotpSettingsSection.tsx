import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../../api/client';
import { Shield, ShieldCheck, ShieldOff, Copy, Check, X } from 'lucide-react';

interface TotpStatus {
  enabled: boolean;
  backupCodesRemaining: number;
}

interface SetupData {
  qrCode: string;
  secret: string;
}

type Panel = 'idle' | 'setup-qr' | 'setup-verify' | 'disable';

export default function TotpSettingsSection() {
  const queryClient = useQueryClient();
  const [panel, setPanel] = useState<Panel>('idle');
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [secretVisible, setSecretVisible] = useState(false);

  const { data: status, isLoading } = useQuery<TotpStatus>({
    queryKey: ['totp-status'],
    queryFn: () => api.get('/auth/totp/status').then((r) => r.data),
  });

  const generateMutation = useMutation({
    mutationFn: () => api.post<SetupData>('/auth/totp/generate').then((r) => r.data),
    onSuccess: (data) => {
      setSetupData(data);
      setPanel('setup-qr');
      setCode('');
    },
    onError: () => toast.error('Kurulum başlatılamadı'),
  });

  const enableMutation = useMutation({
    mutationFn: (c: string) =>
      api.post<{ backupCodes: string[] }>('/auth/totp/enable', { code: c }).then((r) => r.data),
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      setPanel('idle');
      setCode('');
      queryClient.invalidateQueries({ queryKey: ['totp-status'] });
      toast.success('2FA etkinleştirildi');
    },
    onError: () => {
      toast.error('Geçersiz kod');
      setCode('');
    },
  });

  const disableMutation = useMutation({
    mutationFn: (c: string) => api.post('/auth/totp/disable', { code: c }),
    onSuccess: () => {
      setPanel('idle');
      setCode('');
      queryClient.invalidateQueries({ queryKey: ['totp-status'] });
      toast.success('2FA devre dışı bırakıldı');
    },
    onError: () => {
      toast.error('Geçersiz kod');
      setCode('');
    },
  });

  const handleCopy = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const handleCopyAll = async () => {
    if (!backupCodes) return;
    await navigator.clipboard.writeText(backupCodes.join('\n'));
    toast.success('Tüm kodlar kopyalandı');
  };

  const handleCodeInput = (value: string) => {
    const cleaned = value.replace(/[^0-9A-Fa-f\-]/g, '').slice(0, 11);
    setCode(cleaned);
  };

  const close = () => {
    setPanel('idle');
    setCode('');
    setSetupData(null);
    setSecretVisible(false);
  };

  if (isLoading) {
    return <div className="h-24 flex items-center justify-center"><div className="w-5 h-5 border-2 border-pablo-black/20 border-t-pablo-black rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Status card */}
      <div className="bg-white rounded-xl border border-cream-200 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {status?.enabled ? (
              <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <Shield className="w-5 h-5 text-pablo-gray flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-sm font-semibold text-pablo-black">
                İki Faktörlü Doğrulama
              </p>
              <p className="text-xs text-pablo-gray mt-0.5">
                {status?.enabled
                  ? `Aktif · ${status.backupCodesRemaining} yedek kod kaldı`
                  : 'Devre dışı'}
              </p>
            </div>
          </div>

          {status?.enabled ? (
            <button
              onClick={() => setPanel('disable')}
              className="flex-shrink-0 flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium transition"
            >
              <ShieldOff className="w-3.5 h-3.5" />
              Kapat
            </button>
          ) : (
            <button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="flex-shrink-0 text-xs font-medium text-pablo-black border border-pablo-black/20 hover:border-pablo-black px-3 py-1.5 rounded-lg transition disabled:opacity-50"
            >
              {generateMutation.isPending ? 'Hazırlanıyor...' : 'Etkinleştir'}
            </button>
          )}
        </div>
      </div>

      {/* Backup codes display (shown once after enable) */}
      {backupCodes && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-amber-900">Yedek Kodlarınız</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Bunlar yalnızca bir kez gösterilir. Güvenli bir yere kaydedin.
              </p>
            </div>
            <button onClick={() => setBackupCodes(null)} className="text-amber-400 hover:text-amber-600 transition">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {backupCodes.map((c, i) => (
              <button
                key={i}
                onClick={() => handleCopy(c, i)}
                className="flex items-center justify-between bg-white border border-amber-200 rounded-lg px-3 py-2 text-xs font-mono text-amber-900 hover:bg-amber-100 transition"
              >
                {c}
                {copiedIdx === i ? (
                  <Check className="w-3 h-3 text-green-600 ml-2 flex-shrink-0" />
                ) : (
                  <Copy className="w-3 h-3 text-amber-400 ml-2 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
          <button
            onClick={handleCopyAll}
            className="w-full text-xs text-amber-700 hover:text-amber-900 font-medium transition"
          >
            Tümünü Kopyala
          </button>
        </div>
      )}

      {/* QR Setup panel */}
      {panel === 'setup-qr' && setupData && (
        <div className="bg-white rounded-xl border border-cream-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-pablo-black">Authenticator Kurulumu</p>
            <button onClick={close} className="text-pablo-gray hover:text-pablo-black transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          <ol className="text-xs text-pablo-gray space-y-1.5 mb-4 list-decimal list-inside">
            <li>Google Authenticator veya Authy uygulamasını açın</li>
            <li>Yeni hesap ekle → QR kodu tara</li>
            <li>QR kodu tarayamıyorsanız gizli anahtarı girin</li>
          </ol>

          <div className="flex justify-center mb-4">
            <img src={setupData.qrCode} alt="TOTP QR" className="w-48 h-48 rounded-lg border border-cream-200" />
          </div>

          <div className="mb-4">
            <button
              onClick={() => setSecretVisible((v) => !v)}
              className="w-full text-xs text-pablo-gray hover:text-pablo-black transition mb-1"
            >
              {secretVisible ? 'Gizli anahtarı gizle ▲' : 'Gizli anahtarı göster ▼'}
            </button>
            {secretVisible && (
              <div className="flex items-center gap-2 bg-cream-100 rounded-lg px-3 py-2">
                <code className="text-xs font-mono text-pablo-black break-all flex-1">{setupData.secret}</code>
                <button
                  onClick={() => handleCopy(setupData.secret, -1)}
                  className="flex-shrink-0 text-pablo-gray hover:text-pablo-black transition"
                >
                  {copiedIdx === -1 ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setPanel('setup-verify')}
            className="w-full bg-pablo-black text-white text-sm font-medium py-2.5 rounded-lg hover:bg-pablo-brown transition"
          >
            QR'ı Taradım →
          </button>
        </div>
      )}

      {/* Verify setup code */}
      {panel === 'setup-verify' && (
        <div className="bg-white rounded-xl border border-cream-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-pablo-black">Kodu Doğrula</p>
            <button onClick={close} className="text-pablo-gray hover:text-pablo-black transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-pablo-gray mb-4">
            Uygulamada görünen 6 haneli kodu girerek kurulumu tamamlayın.
          </p>

          <input
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) => handleCodeInput(e.target.value)}
            maxLength={6}
            placeholder="000000"
            autoFocus
            className="w-full bg-cream-100 border border-cream-300 rounded-lg px-4 py-3 text-center text-xl font-mono tracking-[0.4em] text-pablo-black outline-none focus:ring-2 focus:ring-pablo-black/20 focus:border-pablo-black transition mb-3"
          />

          <div className="flex gap-2">
            <button
              onClick={() => setPanel('setup-qr')}
              className="flex-1 text-sm text-pablo-gray border border-cream-300 py-2.5 rounded-lg hover:border-pablo-gray transition"
            >
              Geri
            </button>
            <button
              onClick={() => enableMutation.mutate(code)}
              disabled={code.length !== 6 || enableMutation.isPending}
              className="flex-1 bg-pablo-black text-white text-sm font-medium py-2.5 rounded-lg hover:bg-pablo-brown transition disabled:opacity-50"
            >
              {enableMutation.isPending ? 'Doğrulanıyor...' : 'Etkinleştir'}
            </button>
          </div>
        </div>
      )}

      {/* Disable panel */}
      {panel === 'disable' && (
        <div className="bg-white rounded-xl border border-red-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-red-700">2FA Devre Dışı Bırak</p>
            <button onClick={close} className="text-pablo-gray hover:text-pablo-black transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-pablo-gray mb-4">
            Devre dışı bırakmak için TOTP kodunuzu veya bir yedek kodunuzu girin.
          </p>

          <input
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) => handleCodeInput(e.target.value)}
            maxLength={11}
            placeholder="000000"
            autoFocus
            className="w-full bg-cream-100 border border-cream-300 rounded-lg px-4 py-3 text-center text-xl font-mono tracking-[0.3em] text-pablo-black outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition mb-3"
          />

          <div className="flex gap-2">
            <button
              onClick={close}
              className="flex-1 text-sm text-pablo-gray border border-cream-300 py-2.5 rounded-lg hover:border-pablo-gray transition"
            >
              İptal
            </button>
            <button
              onClick={() => disableMutation.mutate(code)}
              disabled={code.length < 6 || disableMutation.isPending}
              className="flex-1 bg-red-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
            >
              {disableMutation.isPending ? 'İşleniyor...' : 'Devre Dışı Bırak'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
