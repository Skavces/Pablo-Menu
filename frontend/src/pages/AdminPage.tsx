import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import CategoriesTab from '../components/admin/CategoriesTab';
import ProductsTab from '../components/admin/ProductsTab';
import TotpSettingsSection from '../components/admin/TotpSettingsSection';
import { LayoutGrid, Package, ShieldCheck, LogOut } from 'lucide-react';
import logo from '../../pablo-logo.png';

type Tab = 'categories' | 'products' | 'security';

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('categories');
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/pb-admin/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <img src={logo} alt="Pablo Artisan" className="h-20 w-auto" />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-pablo-gray hover:text-pablo-black transition font-sans"
          >
            <LogOut className="w-4 h-4" />
            Çıkış Yap
          </button>
        </div>
      </header>

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 flex gap-1">
          {([
            { key: 'categories', label: 'Kategoriler', icon: LayoutGrid },
            { key: 'products',   label: 'Ürünler',     icon: Package },
            { key: 'security',   label: 'Güvenlik',    icon: ShieldCheck },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition font-sans ${
                tab === key
                  ? 'border-pablo-red text-pablo-red'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {tab === 'categories' && <CategoriesTab />}
        {tab === 'products' && <ProductsTab />}
        {tab === 'security' && (
          <div className="max-w-lg">
            <h2 className="text-xl font-display font-semibold text-pablo-black mb-6">Hesap Güvenliği</h2>
            <TotpSettingsSection />
          </div>
        )}
      </main>
    </div>
  );
}
