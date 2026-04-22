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
import type { Category, Product } from '../../types';
import { Plus, Pencil, Trash2, Eye, EyeOff, ImagePlus, ChevronDown, GripVertical } from 'lucide-react';
import ProductModal from './ProductModal';

function SortableProductRow({
  product,
  categoryName,
  onToggleActive,
  onEdit,
  onRemove,
  onUploadImage,
}: {
  product: Product;
  categoryName: (id: string) => string;
  onToggleActive: (p: Product) => void;
  onEdit: (p: Product) => void;
  onRemove: (p: Product) => void;
  onUploadImage: (id: string, file: File) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id });

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
      className="bg-white border border-gray-200 rounded-xl pl-2 pr-2 py-4 flex items-center gap-3 shadow-sm"
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
      >
        <GripVertical className="w-5 h-5" />
      </button>

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
            if (file) onUploadImage(product.id, file);
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
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${product.isActive ? 'text-green-600' : 'text-gray-400'}`}>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${product.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
          {product.isActive ? 'Aktif' : 'Gizli'}
        </span>
        <button onClick={() => onToggleActive(product)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition">
          {product.isActive ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
        <button onClick={() => onEdit(product)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition">
          <Pencil className="w-5 h-5" />
        </button>
        <button
          onClick={() => onRemove(product)}
          className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default function ProductsTab() {
  const qc = useQueryClient();
  const [filterCat, setFilterCat] = useState<string>('all');
  const [modal, setModal] = useState<{ open: boolean; product?: Product }>({ open: false });
  const [localProducts, setLocalProducts] = useState<Product[] | null>(null);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['admin-categories'],
    queryFn: () => api.get('/categories/admin').then((r) => r.data),
  });

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['admin-products'],
    queryFn: () => api.get('/products').then((r) => r.data),
    select: (data) => [...data].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)),
  });

  const toggleActive = useMutation({
    mutationFn: (p: Product) => api.patch(`/products/${p.id}`, { isActive: !p.isActive }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); toast.success('Güncellendi'); },
    onError: () => toast.error('Hata oluştu'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); toast.success('Ürün silindi'); },
    onError: () => toast.error('Silinemedi'),
  });

  const uploadImage = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const form = new FormData();
      form.append('image', file);
      return api.post(`/products/${id}/image`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); toast.success('Görsel yüklendi'); },
    onError: () => toast.error('Görsel yüklenemedi'),
  });

  const reorder = useMutation({
    mutationFn: (items: { id: string; order: number }[]) => api.patch('/products/reorder', { items }),
    onError: () => { toast.error('Sıra kaydedilemedi'); setLocalProducts(null); },
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const displayProducts = localProducts ?? products;
  const filtered = filterCat === 'all' ? displayProducts : displayProducts.filter((p) => p.categoryId === filterCat);
  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? '—';

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const base = localProducts ?? products;
    const oldIndex = base.findIndex((p) => p.id === active.id);
    const newIndex = base.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(base, oldIndex, newIndex);

    setLocalProducts(reordered);
    reorder.mutate(reordered.map((p, i) => ({ id: p.id, order: i })));
  };

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
      ) : filterCat !== 'all' ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filtered.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-3">
              {filtered.map((product) => (
                <SortableProductRow
                  key={product.id}
                  product={product}
                  categoryName={catName}
                  onToggleActive={(p) => toggleActive.mutate(p)}
                  onEdit={(p) => setModal({ open: true, product: p })}
                  onRemove={(p) => { if (confirm(`"${p.name}" silinecek?`)) remove.mutate(p.id); }}
                  onUploadImage={(id, file) => uploadImage.mutate({ id, file })}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="flex flex-col gap-8">
          {categories.map((cat) => {
            const catProducts = filtered.filter((p) => p.categoryId === cat.id);
            if (catProducts.length === 0) return null;
            return (
              <div key={cat.id}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-1 h-5 bg-pablo-red rounded-full flex-shrink-0" />
                  <h3 className="text-base font-semibold text-pablo-black uppercase tracking-wide font-sans">{cat.name}</h3>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={catProducts.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-3">
                      {catProducts.map((product) => (
                        <SortableProductRow
                          key={product.id}
                          product={product}
                          categoryName={catName}
                          onToggleActive={(p) => toggleActive.mutate(p)}
                          onEdit={(p) => setModal({ open: true, product: p })}
                          onRemove={(p) => { if (confirm(`"${p.name}" silinecek?`)) remove.mutate(p.id); }}
                          onUploadImage={(id, file) => uploadImage.mutate({ id, file })}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            );
          })}
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
