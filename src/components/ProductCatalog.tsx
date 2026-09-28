import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Layers,
  Sparkles,
  ShieldCheck,
  Egg,
  Wheat,
  X,
  AlertCircle,
} from 'lucide-react';
import { Product, BirdProduct, FeedProduct } from '../types';
import { ProductCard } from './ProductCard';

interface ProductCatalogProps {
  products: Product[];
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  onAddToCart: (product: Product, selectedVariant: '25kg' | '12.5kg' | 'standard' | 'chick' | 'carton', quantity: number) => void;
  birds?: BirdProduct[];
  feeds?: FeedProduct[];
  onOpenCart?: () => void;
}

const CATEGORY_TABS = [
  { id: 'all', label: 'All Stock', icon: Layers },
  { id: 'doc', label: 'Day-Old Chicks (DOC)', icon: Egg },
  { id: 'broiler', label: 'Table Broilers', icon: Sparkles },
  { id: 'cockerel', label: 'Improved Cockerels', icon: Sparkles },
  { id: 'chikun', label: 'Chikun Feeds', icon: Wheat },
  { id: 'ultima', label: 'Ultima Feeds', icon: Wheat },
];

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  selectedCategory = 'all',
  onSelectCategory,
  onAddToCart,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>(selectedCategory || 'all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  // Sync internal category with prop if it changes
  React.useEffect(() => {
    if (selectedCategory) {
      setActiveCategory(selectedCategory);
    }
  }, [selectedCategory]);

  const handleCategoryChange = (catId: string) => {
    setActiveCategory(catId);
    if (onSelectCategory) {
      onSelectCategory(catId);
    }
  };

  // Filter products by active category, search query, and stock filter
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Category filter
      if (activeCategory !== 'all') {
        if (activeCategory === 'birds') {
          if (product.isFeed || product.category !== 'birds') return false;
        } else if (activeCategory === 'feeds') {
          if (!product.isFeed && product.category !== 'feeds') return false;
        } else if (activeCategory === 'doc') {
          if (product.subCategory !== 'doc') return false;
        } else if (activeCategory === 'broiler') {
          if (product.subCategory !== 'broiler') return false;
        } else if (activeCategory === 'pol') {
          if (product.subCategory !== 'pol') return false;
        } else if (activeCategory === 'cockerel') {
          if (product.subCategory !== 'cockerel') return false;
        } else if (activeCategory === 'chikun') {
          if (product.brand !== 'Chikun' && product.subCategory !== 'chikun') return false;
        } else if (activeCategory === 'ultima') {
          if (product.brand !== 'Ultima' && product.subCategory !== 'ultima') return false;
        }
      }

      // In stock filter
      if (inStockOnly && !product.inStock) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesBreed = product.breed?.toLowerCase().includes(query);
        const matchesBrand = product.brand?.toLowerCase().includes(query);
        const matchesDescription = product.description.toLowerCase().includes(query);
        const matchesFeature = product.features?.some((f) => f.toLowerCase().includes(query));

        if (!matchesName && !matchesBreed && !matchesBrand && !matchesDescription && !matchesFeature) {
          return false;
        }
      }

      return true;
    });
  }, [products, activeCategory, inStockOnly, searchQuery]);

  return (
    <section id="product-catalog-section" className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kaltungo Depot Catalog</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Chicks, Live Birds &amp; Poultry Feeds
          </h2>
          <p className="text-slate-600 text-sm mt-1 max-w-2xl">
            Book certified Day-Old Chicks, healthy mature table-size birds, and original Chikun &amp; Ultima feeds with instant First Bank transfer verification.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 mb-8 space-y-4">
        {/* Category Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                id={`catalog-tab-${tab.id}`}
                onClick={() => handleCategoryChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900 border border-gray-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-100' : 'text-gray-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search input and stock toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by bird (Broiler, Noiler, Layer), feed, or brand..."
              className="w-full pl-9.5 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden text-slate-900 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 font-semibold">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded-xs"
              />
              <span>In Stock Only</span>
            </label>

            <span className="text-slate-400">|</span>

            <span className="text-slate-500 font-bold">
              Showing <span className="text-emerald-700">{filteredProducts.length}</span> {filteredProducts.length === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm my-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="font-extrabold text-lg text-slate-900">No matching products found</h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            We couldn't find any products matching your current filters or search term "{searchQuery}".
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <button
              onClick={() => {
                setActiveCategory('all');
                setSearchQuery('');
                setInStockOnly(false);
                if (onSelectCategory) onSelectCategory('all');
              }}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* Bottom Trust Banner */}
      <div className="mt-12 bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-base sm:text-lg text-gray-900">
              Official Kaltungo Depot Guarantee
            </h4>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5 max-w-xl">
              All Day-Old Chicks vaccinated at hatchery. Feeds are 100% factory-fresh sealed bags direct from authorized distributors.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-[11px] text-amber-600 font-bold uppercase tracking-wider">
              @Yilmitech
            </div>
            
          </div>
        </div>
      </div>
    </section>
  );
};
