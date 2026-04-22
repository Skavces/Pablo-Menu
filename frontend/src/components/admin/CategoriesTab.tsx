import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../../api/client';
import type { Category } from '../../types';
import { Plus, Pencil, Trash2, GripVertical, Eye, EyeOff } from 'lucide-react';
import CategoryModal from './CategoryModal';

function SortableCategoryRow({
  cat,
  onToggleActive,
  onEdit,
  onDelete,
}: {
  cat: Category;
  onToggleActive: (cat: Category) => void;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-gray-200 rounded-xl pl-3 pr-3 py-4 flex items-center gap-4 shadow-sm"
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
      >
        <GripVertical className="w-5 h-5" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-base font-sans">{cat.name}</p>
        <p className="text-sm text-gray-400 mt-0.5">{cat.slug} · {cat.products?.length ?? 0} ürün</p>
      </div>
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cat.isActive ? 'text-green-600' : 'text-gray-400'}`}>
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cat.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
        {cat.isActive ? 'Aktif' : 'Gizli'}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onToggleActive(cat)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
          title={cat.isActive ? 'Gizle' : 'Göster'}
        >
          {cat.isActive ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
        <button
          onClick={() => onEdit(cat)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
        >
          <Pencil className="w-5 h-5" />
        </button>
        <button
          onClick={() => onDelete(cat)}
          className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default function CategoriesTab() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; category?: Category }>({ open: false });
  const [localCategories, setLocalCategories] = useState<Category[] | null>(null);

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['admin-categories'],
    queryFn: () => api.get('/categories/admin').then((r) => r.data),
    select: (data) => [...data].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)),
  });

  const toggleActive = useMutation({
    mutationFn: (cat: Category) => api.patch(`/categories/${cat.id}`, { isActive: !cat.isActive }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-categories'] }); toast.success('Güncellendi'); },
    onError: () => toast.error('Hata oluştu'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-categories'] }); toast.success('Kategori silindi'); },
    onError: () => toast.error('Silinemedi — bu kategoriye ait ürünler var olabilir'),
  });

  const reorder = useMutation({
    mutationFn: (items: { id: string; order: number }[]) => api.patch('/categories/reorder', { items }),
    onError: () => { toast.error('Sıra kaydedilemedi'); setLocalCategories(null); },
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const displayed = localCategories ?? categories;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const base = localCategories ?? categories;
    const oldIndex = base.findIndex((c) => c.id === active.id);
    const newIndex = base.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(base, oldIndex, newIndex);

    setLocalCategories(reordered);
    reorder.mutate(reordered.map((c, i) => ({ id: c.id, order: i })));
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

      {displayed.length === 0 ? (
        <div className="text-center py-20 text-gray-400 font-sans">
          <p className="text-base">Henüz kategori yok.</p>
          <p className="text-sm mt-1">Yeni Kategori butonuna tıklayın.</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={displayed.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-3">
              {displayed.map((cat) => (
                <SortableCategoryRow
                  key={cat.id}
                  cat={cat}
                  onToggleActive={(c) => toggleActive.mutate(c)}
                  onEdit={(c) => setModal({ open: true, category: c })}
                  onDelete={(c) => { if (confirm(`"${c.name}" kategorisini silmek istediğinizden emin misiniz?`)) remove.mutate(c.id); }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <CategoryModal
        open={modal.open}
        category={modal.category}
        onClose={() => setModal({ open: false })}
      />
    </div>
  );
}
