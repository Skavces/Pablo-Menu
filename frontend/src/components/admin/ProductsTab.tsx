import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../../api/client';
import type { Category, Product } from '../../types';
import { Plus, Pencil, Trash2, Eye, EyeOff, ImagePlus, ChevronDown } from 'lucide-react';
import ProductModal from './ProductModal';

export default function ProductsTab() {
  const qc = useQueryClient();
  const [filterCat, setFilterCat] = useState<string>('all');
  const [modal, setModal] = useState<{ open: boolean; product?: Product }>({ open: false });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['admin-categories'],
    queryFn: () => api.get('/categories/admin').then((r) => r.data),
  });

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['admin-products'],
    queryFn: () => api.get('/products').then((r) => r.data),
  });

  const toggleActive = useMutation({
    mutationFn: (p: Product) => api.patch(`/products/${p.id}`, { isActive: !p.isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Güncellendi');
    },
    onError: () => toast.error('Hata oluştu'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Ürün silindi');
    },
    onError: () => toast.error('Silinemedi'),
  });

  const uploadImage = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const form = new FormData();
      form.append('image', file);
      return api.post(`/products/${id}/image`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Görsel yüklendi');
    },
    onError: () => toast.error('Görsel yüklenemedi'),
  });

  const filtered = filterCat === 'all' ? products : products.filter((p) => p.categoryId === filterCat);
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? '—';

  if (isLoading) return <div className="py-16 text-center text-gray-400 font-sans">Yükleniyor...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-display font-semibold text-pablo-black">Ürünler</h2>
        <div className="flex gap-3">
          <div className="relative inline-flex items-center">
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="appearance-none border border-gray-200 rounded-lg pl-4 pr-8 py-2.5 text-sm outline-none focus:ring-2 focus:ring-pablo-red/20 bg-white font-sans text-gray-700 cursor-pointer"
            >
              <option value="all">Tüm Kategoriler</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <button
            onClick={() => setModal({ open: true })}
            className="flex items-center gap-2 bg-pablo-red hover:bg-red-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition font-sans"
          >
            <Plus className="w-4 h-4" />
            Yeni Ürün
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400 font-sans">
          <p className="text-base">Ürün bulunamadı.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((product) => (
            <div key={product.id} className="bg-white border border-gray-200 rounded-xl pl-4 pr-2 py-4 flex items-center gap-4 shadow-sm">
              {/* Thumbnail / upload */}
              <label className="relative w-20 h-20 flex-shrink-0 cursor-pointer group">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="w-full h-full bg-cream-200 rounded-xl flex items-center justify-center">
                    <ImagePlus className="w-6 h-6 text-pablo-gray" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                  <ImagePlus className="w-5 h-5 text-white" />
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadImage.mutate({ id: product.id, file });
                    e.target.value = '';
                  }}
                />
              </label>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-base truncate font-sans">{product.name}</p>
                <p className="text-sm text-gray-400 mt-0.5">{categoryName(product.categoryId)}</p>
                <p className="text-pablo-gold font-bold text-base mt-1 font-display">{Number(product.price).toFixed(2)} ₺</p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {product.isActive ? 'Aktif' : 'Gizli'}
                </span>
                <button onClick={() => toggleActive.mutate(product)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition">
                  {product.isActive ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <button onClick={() => setModal({ open: true, product })} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition">
                  <Pencil className="w-5 h-5" />
                </button>
                <button
                  onClick={() => { if (confirm(`"${product.name}" silinecek?`)) remove.mutate(product.id); }}
                  className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProductModal
        open={modal.open}
        product={modal.product}
        categories={categories}
        onClose={() => setModal({ open: false })}
      />
    </div>
  );
}
