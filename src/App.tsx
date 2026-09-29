/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, CartItem, Order, AppTheme } from './types';
import { StorageService } from './lib/storage';
import { Header } from './components/Header';
import { ProductCatalog } from './components/ProductCatalog';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTracker } from './components/OrderTracker';
import { StockAlertModal } from './components/StockAlertModal';
import { AdminPortal } from './components/AdminPortal';
import { DigitalReceipt } from './components/DigitalReceipt';
import { LivePriceTickerNotifier } from './components/LivePriceTickerNotifier';
import { Store } from 'lucide-react';

const CART_STORAGE_KEY = 'shamon_poultry_cart_v1';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Theme is now fixed — the theme switcher UI has been removed.
  const [currentTheme] = useState<AppTheme>('emerald');

  const [currentRoute, setCurrentRoute] = useState<'storefront' | 'admin'>(() => {
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    return hash === '#/admin' || hash === '#admin' || search.includes('admin=1') || search.includes('admin=true')
      ? 'admin'
      : 'storefront';
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modals & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [viewingReceiptOrder, setViewingReceiptOrder] = useState<Order | null>(null);

  // Apply theme to document element (fixed value, runs once)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, []);

  // Route & Hash change listener for standalone admin URL
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (hash === '#/admin' || hash === '#admin' || search.includes('admin=1') || search.includes('admin=true')) {
        setCurrentRoute('admin');
      } else {
        setCurrentRoute('storefront');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Load products from Supabase on mount
  useEffect(() => {
    StorageService.getProducts().then(setProducts);
    // Drain any orders that were queued while offline.
    if (navigator.onLine && StorageService.getOfflineQueue().length > 0) {
      StorageService.syncOfflineQueue();
    }
  }, []);

  // Sync products state when orders are placed or stock updated
  useEffect(() => {
    const handleProductSync = () => {
      StorageService.getProducts().then(setProducts);
    };
    window.addEventListener('shamon_order_placed', handleProductSync);
    window.addEventListener('shamon_order_updated', handleProductSync);
    window.addEventListener('shamon_price_updated', handleProductSync);
    window.addEventListener('online', handleProductSync);
    return () => {
      window.removeEventListener('shamon_order_placed', handleProductSync);
      window.removeEventListener('shamon_order_updated', handleProductSync);
      window.removeEventListener('shamon_price_updated', handleProductSync);
      window.removeEventListener('online', handleProductSync);
    };
  }, []);

  // Sync cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart:', e);
    }
  }, [cart]);

  // Cart Handlers
  const handleAddToCart = (
    product: Product,
    selectedVariant: '25kg' | '12.5kg' | 'standard' | 'chick' | 'carton',
    quantity: number
  ) => {
    setCart((prevCart) => {
      const variantSuffix = selectedVariant !== 'standard' ? `_${selectedVariant}` : '';
      const cartItemId = `${product.id}${variantSuffix}`;

      // Calculate unit price and descriptive label
      let unitPrice = product.basePrice;
      let unitLabel = product.unit;

      if (product.isFeed && product.feedSizes) {
        if (selectedVariant === '25kg' && product.feedSizes.fullBag) {
          unitPrice = product.feedSizes.fullBag.price;
          unitLabel = '25kg Full Bag';
        } else if (selectedVariant === '12.5kg' && product.feedSizes.halfBag) {
          unitPrice = product.feedSizes.halfBag.price;
          unitLabel = '12.5kg Half Bag';
        }
      } else if (product.category === 'birds') {
        if (selectedVariant === 'chick') {
          unitPrice = product.chickPricing?.pricePerChick || Math.round(product.basePrice / 50);
          unitLabel = quantity === 1 ? 'Single Chick' : 'Chicks';
        } else if (selectedVariant === 'carton') {
          unitPrice = product.chickPricing?.pricePerCarton || product.basePrice;
          unitLabel = 'Carton (50 chicks)';
        }
      }

      const existingIndex = prevCart.findIndex((item) => item.id === cartItemId);
      if (existingIndex !== -1) {
        const updated = [...prevCart];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          subtotal: newQty * unitPrice,
        };
        return updated;
      } else {
        const newItem: CartItem = {
          id: cartItemId,
          productId: product.id,
          name: product.name,
          category: product.category,
          brand: product.brand,
          unit: unitLabel,
          detailLabel: unitLabel,
          selectedVariant: selectedVariant !== 'standard' ? selectedVariant : undefined,
          unitPrice,
          quantity,
          subtotal: unitPrice * quantity,
          imageUrl: product.imageUrl,
        };
        return [newItem, ...prevCart];
      }
    });
  };

  const handleAddMultipleToCart = (
    items: { product: Product; variant: '25kg' | '12.5kg'; quantity: number }[]
  ) => {
    for (const item of items) {
      handleAddToCart(item.product, item.variant, item.quantity);
    }
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(id);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            quantity,
            subtotal: item.unitPrice * quantity,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleOrderSuccess = (order: Order) => {
    // Clear cart
    setCart([]);
    // Update local products stock
    StorageService.getProducts().then(setProducts);
  };

  const handleNavigateHome = () => {
    if (currentRoute === 'admin') {
      window.location.hash = '';
      setCurrentRoute('storefront');
    }
    setSelectedCategory('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cartTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // If user navigated directly to separate admin page (#/admin)
  if (currentRoute === 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
        {/* Top Standalone Admin Banner */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-amber-300">shamonsKaltungo</span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-slate-300 text-xs font-semibold">Separate Admin Route (/#/admin)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNavigateHome}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-colors shadow-xs"
            >
              <Store className="w-3.5 h-3.5 text-amber-300" />
              <span>Return to Storefront</span>
            </button>
          </div>
        </div>

        {/* Standalone Admin View */}
        <AdminPortal
          isOpen={true}
          isStandalone={true}
          onClose={handleNavigateHome}
          onNavigateHome={handleNavigateHome}
          products={products}
          onUpdateProducts={setProducts}
          onRefreshCatalog={() => StorageService.getProducts().then(setProducts)}
          onViewReceipt={(order) => setViewingReceiptOrder(order)}
          isLoggedIn={isAdminLoggedIn}
          setIsLoggedIn={setIsAdminLoggedIn}
        />

        {/* Printable Digital Receipt Modal */}
        {viewingReceiptOrder && (
          <DigitalReceipt
            order={viewingReceiptOrder}
            onClose={() => setViewingReceiptOrder(null)}
          />
        )}
      </div>
    );
  }

  const handleSelectProductFromTicker = (productId: string) => {
    const targetProd = products.find((p) => p.id === productId);
    if (targetProd) {
      setSelectedCategory(targetProd.category);
    }
    setTimeout(() => {
      const el = document.getElementById(`product-card-${productId}`) || document.getElementById('product-catalog-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-4', 'ring-amber-400', 'transition-all', 'duration-300');
        setTimeout(() => {
          el.classList.remove('ring-4', 'ring-amber-400');
        }, 2500);
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      {/* Header */}
      <Header
        cartCount={cartTotalItems}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenTracker={() => setIsTrackerOpen(true)}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        onNavigateHome={handleNavigateHome}
        currentTheme={currentTheme}
      />

      {/* Live Sliding Stock & Price Notifier Carousel (Continuously looping sideways) */}
      <LivePriceTickerNotifier
        products={products}
        onSelectProduct={handleSelectProductFromTicker}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1">
        {/* Product Catalog */}
        <ProductCatalog
          products={products}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onAddToCart={handleAddToCart}
        />
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onProceedToCheckout={handleProceedToCheckout}
      />

      {/* Checkout Modal with First Bank Transfer */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cart}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Order Tracker Modal */}
      <OrderTracker
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        onViewReceipt={(order) => {
          setIsTrackerOpen(false);
          setViewingReceiptOrder(order);
        }}
      />

      {/* Restock & Hatch Alert Modal */}
      <StockAlertModal
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
      />

      {/* Admin access is intentionally NOT exposed anywhere in the customer
          storefront. Staff sign in at the dedicated route: yoursite.com/#/admin */}

      {/* Printable Digital Receipt Modal */}
      {viewingReceiptOrder && (
        <DigitalReceipt
          order={viewingReceiptOrder}
          onClose={() => setViewingReceiptOrder(null)}
        />
      )}
    </div>
  );
}
