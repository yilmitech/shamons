import React, { useState } from 'react';
import { 
  Plus, 
  Minus, 
  ShoppingBag, 
  Check, 
  Sparkles,
} from 'lucide-react';
import { Product } from '../types';
import { formatNaira } from '../lib/utils';

export type CardVariant = '25kg' | '12.5kg' | 'standard' | 'chick' | 'carton';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, selectedVariant: CardVariant, quantity: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const isDocBird = product.category === 'birds' && product.subCategory === 'doc';

  // If feed, default to '25kg'; if DOC bird, default to 'carton'; otherwise 'standard'
  const [selectedVariant, setSelectedVariant] = useState<CardVariant>(() => {
    if (product.isFeed) return '25kg';
    if (isDocBird) return 'carton';
    return 'standard';
  });
  const [quantity, setQuantity] = useState<number>(product.minOrderQuantity || 1);
  const [addedAnimation, setAddedAnimation] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  // Compute current price based on variant
  const currentPrice = React.useMemo(() => {
    if (product.isFeed && product.feedSizes) {
      if (selectedVariant === '25kg' && product.feedSizes.fullBag) {
        return product.feedSizes.fullBag.price;
      }
      if (selectedVariant === '12.5kg' && product.feedSizes.halfBag) {
        return product.feedSizes.halfBag.price;
      }
    }
    if (isDocBird) {
      if (selectedVariant === 'chick') {
        return product.chickPricing?.pricePerChick || Math.round(product.basePrice / 50);
      }
      if (selectedVariant === 'carton') {
        return product.chickPricing?.pricePerCarton || product.basePrice;
      }
    }
    return product.basePrice;
  }, [product, selectedVariant, isDocBird]);

  // Compute current stock status
 const currentInStock = React.useMemo(() => {
  if (product.isFeed && product.feedSizes) {
    if (selectedVariant === '25kg') {
      return !!product.feedSizes.fullBag?.inStock && (product.feedSizes.fullBag?.stockCount ?? 0) > 0;
    }
    if (selectedVariant === '12.5kg') {
      return !!product.feedSizes.halfBag?.inStock && (product.feedSizes.halfBag?.stockCount ?? 0) > 0;
    }
  }
  return product.inStock && (product.stockCount ?? 0) > 0;
}, [product, selectedVariant]);

  const currentStockCount = React.useMemo(() => {
  if (product.isFeed && product.feedSizes) {
    if (selectedVariant === '25kg') return product.feedSizes.fullBag?.stockCount ?? 0;
    if (selectedVariant === '12.5kg') return product.feedSizes.halfBag?.stockCount ?? 0;
  }
  return product.stockCount;
}, [product, selectedVariant]);

  const handleIncrement = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleAdd = () => {
    onAddToCart(product, selectedVariant, quantity);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1800);
  };

  return (
    <div 
      className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group"
      id={`product-card-${product.id}`}
    >
      {/* Product Image & Top Overlays */}
      <div className="relative h-48 sm:h-52 w-full bg-slate-100 overflow-hidden shrink-0">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          {product.brand && (
            <span className="bg-white/95 backdrop-blur-md text-gray-700 text-[11px] font-extrabold px-2.5 py-1 rounded-md shadow-xs border border-gray-100">
              {product.brand === 'shamonsHatchery'
                ? 'Certified DOC'
                : product.brand === 'shamonsFarms' || product.brand === 'shamonsFarm'
                ? 'Live Birds'
                : product.brand}
            </span>
          )}

          {/* Stock Status Badge */}
          {currentInStock ? (
            <span className="bg-emerald-600/95 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse" />
              <span>In Stock ({currentStockCount})</span>
            </span>
          ) : (
            <span className="bg-rose-600/95 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-xs">
              Out of Stock
            </span>
          )}
        </div>

        {/* Bottom Badge inside image */}
        {product.badge && (
          <div className="absolute bottom-2.5 left-3">
            <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded shadow-xs uppercase tracking-wider">
              {product.badge}
            </span>
          </div>
        )}
      </div>

      {/* Card Content Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Breed / Category tag */}
          {product.breed && (
            <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{product.breed}</span>
            </div>
          )}

          {/* Product Name */}
          <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-snug group-hover:text-emerald-800 transition-colors">
            {product.name}
          </h3>

          {/* Description */}
          <p className="text-xs text-slate-600 line-clamp-2 mt-1.5 leading-relaxed">
            {product.description}
          </p>

          {/* Target Age / Usage info (Protein percentages removed as requested) */}
          {/* {product.nutritionalInfo && (product.nutritionalInfo.targetAge || product.nutritionalInfo.usage) && (
            <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-2 text-[11px] text-slate-600 space-y-0.5">
              {product.nutritionalInfo.targetAge && (
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700">Target Age:</span>
                  <span className="font-medium text-slate-800">{product.nutritionalInfo.targetAge}</span>
                </div>
              )}
              {product.nutritionalInfo.usage && (
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700">Recommendation:</span>
                  <span className="text-slate-600 truncate">{product.nutritionalInfo.usage}</span>
                </div>
              )}
            </div>
          )} */}

          {/* Day-Old Chicks Order Unit Selector: Single Chick vs Full Carton */}
          {isDocBird && (
            <div className="mt-4">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Order By:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedVariant('carton');
                    setQuantity(1);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    selectedVariant === 'carton'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs ring-1 ring-emerald-600'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                  id={`unit-carton-${product.id}`}
                >
                  <span className="font-extrabold">Full Carton</span>
                  <span className="text-[10px] text-slate-500 font-medium">50 chicks + 1 bonus</span>
                  <span className="text-[11px] text-emerald-700 font-black">
                    {formatNaira(product.chickPricing?.pricePerCarton || product.basePrice)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedVariant('chick');
                    setQuantity(1);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    selectedVariant === 'chick'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs ring-1 ring-emerald-600'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                  id={`unit-chick-${product.id}`}
                >
                  <span className="font-extrabold">Single Chicks</span>
                  <span className="text-[10px] text-slate-500 font-medium">1 chick or more</span>
                  <span className="text-[11px] text-emerald-700 font-black">
                    {formatNaira(product.chickPricing?.pricePerChick || Math.round(product.basePrice / 50))} / chick
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Feed Size Selector (25kg Full Bag vs 12.5kg Half Bag) */}
          {product.isFeed && product.feedSizes && (
            <div className="mt-4">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Select Bag Size:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedVariant('25kg')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-0.5 ${
                    selectedVariant === '25kg'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs ring-1 ring-emerald-600'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                  id={`size-25kg-${product.id}`}
                >
                  <span className="font-extrabold">25kg Full Bag</span>
                  <span className="text-[11px] text-emerald-700 font-black">
  {formatNaira(product.feedSizes.halfBag?.price ?? Math.round(product.basePrice / 2 + 250))}
</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedVariant('12.5kg')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-0.5 ${
                    selectedVariant === '12.5kg'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs ring-1 ring-emerald-600'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                  id={`size-12kg-${product.id}`}
                >
                  <span className="font-extrabold">12.5kg Half Bag</span>
                 <span className="text-[11px] text-emerald-700 font-black">
  {formatNaira(product.feedSizes.halfBag?.price ?? Math.round(product.basePrice / 2 + 250))}
</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions: Pricing, Quantity & Add to Cart */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <span className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                {formatNaira(currentPrice)}
              </span>
              <span className="text-xs text-slate-500 font-medium ml-1">
                / {product.isFeed 
                    ? (selectedVariant === '25kg' ? '25kg Bag' : '12.5kg Bag')
                    : selectedVariant === 'chick'
                    ? 'Single Chick'
                    : selectedVariant === 'carton'
                    ? 'Carton'
                    : product.unit}
              </span>
            </div>

            {/* Total calculation for multiple quantities */}
            {quantity > 1 && (
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Total: {formatNaira(currentPrice * quantity)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Quantity Stepper (incremental button) */}
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 shrink-0">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={quantity <= 1}
                className="w-7 h-7 rounded-lg bg-white text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-white flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                id={`qty-minus-${product.id}`}
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center text-xs font-bold text-slate-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={handleIncrement}
                className="w-7 h-7 rounded-lg bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                id={`qty-plus-${product.id}`}
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Add to Cart / Book Button */}
            <button
              type="button"
              onClick={handleAdd}
              disabled={!currentInStock}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer ${
                addedAnimation
                  ? 'bg-emerald-700 text-white'
                  : currentInStock
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/20'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
              id={`add-to-cart-btn-${product.id}`}
            >
              {addedAnimation ? (
                <>
                  <Check className="w-4 h-4 text-amber-300 animate-bounce" />
                  <span>Added to Cart!</span>
                </>
              ) : currentInStock ? (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>{product.category === 'birds' ? (selectedVariant === 'chick' ? `Book ${quantity > 1 ? `${quantity} Chicks` : 'Chick'}` : 'Book Carton') : 'Add to Cart'}</span>
                </>
              ) : (
                <span>Out of Stock</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
