import { useState } from 'react';
import type { Product } from '../../types';

interface Props {
  product: Product;
  isLast?: boolean;
}

export default function ProductCard({ product, isLast }: Props) {
  const [imgError, setImgError] = useState(false);
  const [imgOpen, setImgOpen] = useState(false);

  const hasImage = product.imageUrl && !imgError;

  return (
    <>
      <div className={`flex items-stretch gap-5 py-6 ${!isLast ? 'border-b border-cream-200' : ''}`}>
        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h3 className="font-display font-semibold text-pablo-black text-2xl leading-snug tracking-wide">{product.name}</h3>
          {product.description && (
            <p className="text-base text-pablo-gray mt-2 leading-relaxed line-clamp-2 font-sans">
              {product.description}
            </p>
          )}
          <p className="text-pablo-gold font-semibold text-2xl mt-3 font-display">
            {Number(product.price).toFixed(2)} ₺
          </p>
        </div>

        {/* Image */}
        {hasImage ? (
          <button
            onClick={() => setImgOpen(true)}
            className="w-40 h-40 rounded-2xl overflow-hidden flex-shrink-0 bg-cream-200 shadow-sm active:scale-95 transition-transform"
          >
            <img
              src={product.imageUrl ?? undefined}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          </button>
        ) : null}
      </div>

      {/* Image lightbox */}
      {imgOpen && product.imageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-6"
          onClick={() => setImgOpen(false)}
        >
          <div className="w-full max-w-sm">
            <img
              src={product.imageUrl ?? undefined}
              alt={product.name}
              className="w-full rounded-3xl object-contain shadow-2xl"
            />
            <p className="text-white text-center mt-4 text-lg font-semibold">{product.name}</p>
            <p className="text-pablo-gold text-center mt-1 text-xl font-bold">
              {Number(product.price).toFixed(2)} ₺
            </p>
          </div>
        </div>
      )}
    </>
  );
}
