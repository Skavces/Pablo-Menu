import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../../api/client';
import type { Category } from '../../types';
import { Plus, Pencil, Trash2, GripVertical, Eye, EyeOff } from 'lucide-react';
import CategoryModal from './CategoryModal';

export default function CategoriesTab() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; category?: Category }>({ open: false });

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['admin-categories'],
    queryFn: () => api.get('/categories/admin').then((r) => r.data),
  });

  const toggleActive = useMutation({
    mutationFn: (cat: Category) =>
      api.patch(`/categories/${cat.id}`, { isActive: !cat.isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success('Güncellendi');
    },
    onError: () => toast.error('Hata oluştu'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success('Kategori silindi');
    },
    onError: () => toast.error('Silinemedi — bu kategoriye ait ürünler var olabilir'),
  });

  const handleDelete = (cat: Category) => {
    if (confirm(`"${cat.name}" kategorisini silmek istediğinizden emin misiniz?`)) {
      remove.mutate(cat.id);
    }
  };

  if (isLoading) return <div className="py-16 text-center text-gray-400 font-sans">Yükleniyor...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-semibold text-pablo-black">Kategoriler</h2>
        <button
          onClick={() => setModal({ open: true })}
          className="flex items-center gap-2 bg-pablo-red hover:bg-red-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition font-sans"
        >
          <Plus className="w-4 h-4" />
          Yeni Kategori
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-20 text-gray-400 font-sans">
          <p className="text-base">Henüz kategori yok.</p>
          <p className="text-sm mt-1">Yeni Kategori butonuna tıklayın.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white border border-gray-200 rounded-xl pl-5 pr-3 py-4 flex items-center gap-4 shadow-sm"
            >
              <GripVertical className="w-5 h-5 text-gray-300 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-base font-sans">{cat.name}</p>
                <p className="text-sm text-gray-400 mt-0.5">{cat.slug} · {cat.products?.length ?? 0} ürün</p>
              </div>
              <span className={`text-sm px-3 py-1 rounded-full font-medium ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {cat.isActive ? 'Aktif' : 'Gizli'}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleActive.mutate(cat)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
                  title={cat.isActive ? 'Gizle' : 'Göster'}
                >
                  {cat.isActive ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => setModal({ open: true, category: cat })}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CategoryModal
        open={modal.open}
        category={modal.category}
        onClose={() => setModal({ open: false })}
      />
    </div>
  );
}
