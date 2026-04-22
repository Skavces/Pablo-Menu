import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../../api/client';
import type { Category, Product } from '../../types';
import { X, ImagePlus, Trash2 } from 'lucide-react';

interface Props {
  open: boolean;
  product?: Product;
  categories: Category[];
  onClose: () => void;
}

export default function ProductModal({ open, product, categories, onClose }: Props) {
  const qc = useQueryClient();
  const isEdit = !!product;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  useEffect(() => {
    if (open) {
      setName(product?.name ?? '');
      setDescription(product?.description ?? '');
      setPrice(product ? String(product.price) : '');
      setCategoryId(product?.categoryId ?? (categories[0]?.id ?? ''));
      setPendingImage(null);
      setPreviewUrl(null);
      setRemoveImage(false);
    }
  }, [open, product, categories]);

  useEffect(() => {
    if (!pendingImage) return;
    const url = URL.createObjectURL(pendingImage);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingImage]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        price,
        categoryId,
      };

      let savedProduct: Product;
      if (isEdit) {
        const res = await api.patch(`/products/${product!.id}`, payload);
        savedProduct = res.data;
      } else {
        const res = await api.post('/products', payload);
        savedProduct = res.data;
      }

      if (pendingImage) {
        const form = new FormData();
        form.append('image', pendingImage);
        await api.post(`/products/${savedProduct.id}/image`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(isEdit ? 'Ürün güncellendi' : 'Ürün oluşturuldu');
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Hata oluştu');
    },
  });

  const currentImageUrl = removeImage ? null : (previewUrl ?? product?.imageUrl ?? null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900 text-base">
            {isEdit ? 'Ürün Düzenle' : 'Yeni Ürün'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="flex flex-col gap-4">

          {/* Görsel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Görsel <span className="text-gray-400 font-normal">(opsiyonel)</span></label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden border-2 border-dashed border-cream-300 hover:border-pablo-red transition group bg-cream-100"
              >
                {currentImageUrl ? (
                  <img src={currentImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-gray-400 group-hover:text-pablo-red transition">
                    <ImagePlus className="w-6 h-6" />
                    <span className="text-xs">Ekle</span>
                  </div>
                )}
                {currentImageUrl && (
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <ImagePlus className="w-5 h-5 text-white" />
                  </div>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) { setPendingImage(file); setRemoveImage(false); }
                  e.target.value = '';
                }}
              />
              {currentImageUrl && (
                <button
                  type="button"
                  onClick={() => { setPendingImage(null); setPreviewUrl(null); setRemoveImage(true); }}
                  className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Görseli kaldır
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Adı</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={150}
              className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pablo-black/20"
              placeholder="Latte"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama <span className="text-gray-400 font-normal">(opsiyonel)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={2}
              className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pablo-black/20 resize-none"
              placeholder="Sütlü espresso..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat (₺)</label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              type="number"
              min="0"
              step="0.01"
              className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pablo-black/20"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pablo-black/20 bg-white"
            >
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex gap-2 mt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-cream-300 text-gray-700 font-medium py-2 rounded-lg text-sm hover:bg-gray-50 transition">
              İptal
            </button>
            <button
              type="submit"
              disabled={save.isPending}
              className="flex-1 bg-pablo-black hover:bg-pablo-brown disabled:opacity-60 text-white font-medium py-2 rounded-lg text-sm transition"
            >
              {save.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
