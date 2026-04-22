import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../../api/client';
import type { Category } from '../../types';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  category?: Category;
  onClose: () => void;
}

function toSlug(str: string) {
  return str
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function CategoryModal({ open, category, onClose }: Props) {
  const qc = useQueryClient();
  const isEdit = !!category;

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => {
    if (open) {
      setName(category?.name ?? '');
      setSlug(category?.slug ?? '');
      setSlugEdited(false);
    }
  }, [open, category]);

  const handleNameChange = (v: string) => {
    setName(v);
    if (!slugEdited) setSlug(toSlug(v));
  };

  const save = useMutation({
    mutationFn: () => {
      const payload = { name: name.trim(), slug: slug.trim() };
      return isEdit
        ? api.patch(`/categories/${category!.id}`, payload)
        : api.post('/categories', payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success(isEdit ? 'Kategori güncellendi' : 'Kategori oluşturuldu');
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Hata oluştu');
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900 text-base">
            {isEdit ? 'Kategori Düzenle' : 'Yeni Kategori'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
          className="flex flex-col gap-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ad</label>
            <input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              maxLength={100}
              className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pablo-black/20 focus:border-transparent"
              placeholder="Soğuk Kahveler"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }}
              required
              pattern="[a-z0-9-]+"
              maxLength={120}
              className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pablo-black/20 font-mono"
              placeholder="soguk-kahveler"
            />
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
