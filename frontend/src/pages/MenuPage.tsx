import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../api/client';
import type { Category } from '../types';
import ProductCard from '../components/menu/ProductCard';
import logo from '../../pablo-logo.png';
import bg from '../../pablo-bg.jpg';

export default function MenuPage() {
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['public-menu'],
    queryFn: () => api.get('/categories').then((r) => r.data),
  });

  const [activeSlug, setActiveSlug] = useState<string>('');

  const visibleCategories = activeSlug === ''
    ? categories
    : categories.filter((c) => c.slug === activeSlug);

  const handleBadgeClick = (slug: string) => {
    setActiveSlug(slug);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <div className="w-10 h-10 border-[3px] border-pablo-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative"
      style={{ backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}
    >
      <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundColor: '#F5F0E8', opacity: 0.95 }} />
      {/* Header */}
      <header className="sticky top-0 z-30 relative bg-cream-100 border-b-2 border-pablo-red">
        <div className="max-w-2xl mx-auto px-6 pt-6 pb-3">
          <div className="flex justify-center">
            <img src={logo} alt="Pablo Artisan" className="h-40 w-auto" />
          </div>
        </div>

        {/* Category nav */}
        {categories.length > 0 && (
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-3 px-6 py-3 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => handleBadgeClick('')}
                className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-medium tracking-widest uppercase transition-all font-sans ${
                  activeSlug === ''
                    ? 'bg-pablo-red text-white shadow-sm'
                    : 'bg-cream-200 text-pablo-black hover:bg-cream-300'
                }`}
              >
                Tümü
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleBadgeClick(cat.slug)}
                  className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-medium tracking-widest uppercase transition-all font-sans ${
                    activeSlug === cat.slug
                      ? 'bg-pablo-red text-white shadow-sm'
                      : 'bg-cream-200 text-pablo-black hover:bg-cream-300'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Menu content */}
      <main className="relative max-w-2xl mx-auto px-6 pb-24">
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-pablo-gray">
            <p className="text-lg">Menü henüz hazır değil</p>
          </div>
        ) : (
          visibleCategories.map((cat) => (
            <section
              key={cat.id}
  
              className="mt-10"
            >
              {/* Category header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-1 h-7 bg-pablo-red rounded-full flex-shrink-0" />
                <h2 className="text-2xl font-display font-semibold tracking-wide text-pablo-black uppercase">
                  {cat.name}
                </h2>
                <div className="flex-1 h-px bg-cream-300" />
              </div>

              {cat.products.length === 0 ? (
                <p className="text-pablo-gray text-base py-6 text-center">
                  Bu kategoride ürün bulunmuyor.
                </p>
              ) : (
                <div className="flex flex-col">
                  {cat.products.map((product, idx) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isLast={idx === cat.products.length - 1}
                    />
                  ))}
                </div>
              )}
            </section>
          ))
        )}
      </main>
    </div>
  );
}
