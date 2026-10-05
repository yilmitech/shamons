import { Product, Order, StockAlertSubscription, HatcheryBatch, ProductFeedSizes, ProductChickPricing } from '../types';
import { supabase } from './supabaseClient';

const OFFLINE_QUEUE_KEY = 'shamon_poultry_offline_queue_v1';

// ---------------------------------------------------------------------------
// Row <-> app-model mapping helpers.
// The database uses snake_case columns; the rest of the app uses the
// camelCase `Product` / `Order` / `StockAlertSubscription` / `HatcheryBatch`
// shapes defined in ../types. These functions translate both ways.
// ---------------------------------------------------------------------------

function rowToProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    subCategory: row.sub_category ?? undefined,
    brand: row.brand ?? undefined,
    breed: row.breed ?? undefined,
    description: row.description ?? '',
    basePrice: Number(row.base_price) || 0,
    unit: row.unit ?? '',
    minOrderQuantity: row.min_order_quantity ?? undefined,
    imageUrl: row.image_url ?? undefined,
    isFeed: !!row.is_feed,
    feedSizes: (row.feed_sizes as ProductFeedSizes) ?? undefined,
    chickPricing: (row.chick_pricing as ProductChickPricing) ?? undefined,
    inStock: row.in_stock ?? true,
    stockCount: row.stock_count ?? 0,
    tags: row.tags ?? undefined,
    hatchSchedule: row.hatch_schedule ?? undefined,
    nextHatchDate: row.next_hatch_date ?? undefined,
    badge: row.badge ?? undefined,
    features: row.features ?? undefined,
    nutritionalInfo: row.nutritional_info ?? undefined,
  };
}

function productToRow(p: Product): any {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    sub_category: p.subCategory ?? null,
    brand: p.brand ?? null,
    breed: p.breed ?? null,
    description: p.description ?? '',
    base_price: p.basePrice ?? 0,
    unit: p.unit ?? '',
    min_order_quantity: p.minOrderQuantity ?? null,
    image_url: p.imageUrl ?? null,
    is_feed: !!p.isFeed,
    feed_sizes: p.feedSizes ?? null,
    chick_pricing: p.chickPricing ?? null,
    in_stock: p.inStock ?? true,
    stock_count: p.stockCount ?? 0,
    tags: p.tags ?? null,
    hatch_schedule: p.hatchSchedule ?? null,
    next_hatch_date: p.nextHatchDate ?? null,
    badge: p.badge ?? null,
    features: p.features ?? null,
    nutritional_info: p.nutritionalInfo ?? null,
  };
}

function rowToOrder(row: any): Order {
  return {
    id: row.id,
    bookingCode: row.booking_code,
    bookingRef: row.booking_code,
    customerName: row.customer_name,
    phone: row.phone,
    altPhone: row.alt_phone ?? undefined,
    email: row.email ?? undefined,
    address: row.address ?? undefined,
    lga: row.lga ?? undefined,
    fulfillmentMethod: row.fulfillment_method ?? undefined,
    deliveryOrPickupLocation: row.delivery_or_pickup_location ?? undefined,
    preferredDate: row.preferred_date ?? undefined,
    notes: row.notes ?? undefined,
    items: row.items ?? [],
    totalAmount: Number(row.total_amount) || 0,
    paymentMethod: row.payment_method ?? undefined,
    paymentStatus: row.payment_status ?? undefined,
    payerName: row.payer_name ?? undefined,
    transactionRef: row.transaction_ref ?? undefined,
    paymentDate: row.payment_date ?? undefined,
    paymentProofImage: row.payment_proof_image ?? undefined,
    paymentProofNotes: row.payment_proof_notes ?? undefined,
    paymentConfirmedAt: row.payment_confirmed_at ?? undefined,
    orderStatus: row.order_status,
    status: row.order_status,
    approvalStatus: row.approval_status ?? undefined,
    stockStatus: row.stock_status ?? undefined,
    stockDeducted: row.stock_deducted ?? false,
    adminNotes: row.admin_notes ?? undefined,
    synced: true,
    createdAt: row.created_at,
    approvedAt: row.approved_at ?? undefined,
    soldAt: row.sold_at ?? undefined,
    // Kept for components (e.g. DigitalReceipt) that still read the older
    // nested `paymentDetails` shape rather than the flat fields above.
    paymentDetails: {
      bankName: undefined,
      accountName: undefined,
      accountNumber: undefined,
      senderName: row.payer_name ?? undefined,
      transactionRef: row.transaction_ref ?? undefined,
      proofImageUrl: row.payment_proof_image ?? undefined,
      paidAmount: Number(row.total_amount) || 0,
      paidAt: row.payment_confirmed_at ?? row.created_at,
    },
  };
}

function orderToRow(order: Order): any {
  return {
    booking_code: order.bookingCode || order.bookingRef,
    customer_name: order.customerName,
    phone: order.phone,
    alt_phone: order.altPhone ?? null,
    email: order.email ?? null,
    address: order.address ?? null,
    lga: order.lga ?? null,
    fulfillment_method: order.fulfillmentMethod ?? null,
    delivery_or_pickup_location: order.deliveryOrPickupLocation ?? null,
    preferred_date: order.preferredDate ?? null,
    notes: order.notes ?? null,
    items: order.items,
    total_amount: order.totalAmount,
    payment_method: order.paymentMethod ?? 'bank_transfer',
    payment_status: order.paymentStatus ?? 'pending_transfer',
    payer_name: order.payerName ?? null,
    transaction_ref: order.transactionRef ?? null,
    payment_proof_image: order.paymentProofImage ?? null,
    payment_proof_notes: order.paymentProofNotes ?? null,
    order_status: order.orderStatus || order.status || 'pending',
    admin_notes: order.adminNotes ?? null,
  };
}

function rowToBatch(row: any): HatcheryBatch {
  return {
    id: row.id,
    title: row.title ?? undefined,
    breed: row.breed,
    deliveryDate: row.delivery_date ?? undefined,
    bookingCloses: row.booking_closes ?? undefined,
    pricePerCarton: Number(row.price_per_carton) || 0,
    availableCartons: row.available_cartons ?? undefined,
    cartonsAvailable: row.available_cartons ?? undefined,
    status: row.status,
    hatchDate: row.hatch_date ?? undefined,
    totalChicks: row.total_chicks ?? undefined,
    notes: row.notes ?? undefined,
  };
}

function batchToRow(b: HatcheryBatch): any {
  return {
    id: b.id,
    title: b.title ?? null,
    breed: b.breed,
    delivery_date: b.deliveryDate ?? null,
    booking_closes: b.bookingCloses ?? null,
    price_per_carton: b.pricePerCarton ?? 0,
    available_cartons: b.availableCartons ?? b.cartonsAvailable ?? null,
    status: b.status,
    hatch_date: b.hatchDate ?? null,
    total_chicks: b.totalChicks ?? null,
    notes: b.notes ?? null,
  };
}

function rowToSubscription(row: any): StockAlertSubscription {
  return {
    id: row.id,
    customerName: row.customer_name,
    phone: row.phone,
    email: row.email ?? undefined,
    lga: row.lga ?? undefined,
    preferredProduct: row.preferred_product ?? undefined,
    productInterest: row.product_interest ?? undefined,
    subscribedAt: row.created_at,
    createdAt: row.created_at,
  };
}

export class StorageService {
  // ---------------------------------------------------------------------
  // PRODUCTS — public read, admin write. Source of truth is Supabase; on
  // network failure we fall back to whatever was last cached so the
  // storefront still renders (e.g. on a flaky connection).
  // ---------------------------------------------------------------------
  static async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase.from('products').select('*').order('name');
    if (error) {
      console.error('Error fetching products from Supabase:', error.message);
      return this.getCachedProductsFallback();
    }
    const products = (data ?? []).map(rowToProduct);
    this.cacheProductsFallback(products);
    return products;
  }

  static async saveProducts(products: Product[]): Promise<void> {
    const rows = products.map(productToRow);
    const { error } = await supabase.from('products').upsert(rows, { onConflict: 'id' });
    if (error) {
      console.error('Error saving products to Supabase:', error.message);
      throw error;
    }
    this.cacheProductsFallback(products);
  }

  static async updateProduct(updatedProduct: Product): Promise<void> {
    const { error } = await supabase
      .from('products')
      .upsert(productToRow(updatedProduct), { onConflict: 'id' });
    if (error) {
      console.error('Error updating product in Supabase:', error.message);
      throw error;
    }
  }

  private static cacheProductsFallback(products: Product[]): void {
    try {
      localStorage.setItem('shamon_products_read_cache_v1', JSON.stringify(products));
    } catch {
      // Ignore quota errors — this is a best-effort offline fallback only.
    }
  }

  private static getCachedProductsFallback(): Product[] {
    try {
      const raw = localStorage.getItem('shamon_products_read_cache_v1');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  // ---------------------------------------------------------------------
  // ORDERS
  // getOrders() requires an authenticated admin session (enforced by Row
  // Level Security) — it's for the Admin Portal only. Customer-facing
  // lookup goes through trackOrder(), which is scoped server-side to just
  // the matching booking(s) via the track_order() RPC.
  // ---------------------------------------------------------------------
  static async getOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching orders from Supabase:', error.message);
      return [];
    }
    return (data ?? []).map(rowToOrder);
  }

  static async trackOrder(query: string): Promise<Order[]> {
    const { data, error } = await supabase.rpc('track_order', { p_query: query.trim() });
    if (error) {
      console.error('Error tracking order:', error.message);
      return [];
    }
    return (data ?? []).map(rowToOrder);
  }

  // Customers are anonymous, so this only INSERTS. It deliberately does not
  // chain .select() — reading the row back needs SELECT permission on the
  // orders table, which anonymous visitors don't (and shouldn't) have.
  // Stock is deducted later by the admin (see deductStockForOrder), because
  // writing to the products table also requires admin rights.
  static async addOrder(order: Order): Promise<Order | null> {
    const { error } = await supabase.from('orders').insert(orderToRow(order));

    if (error) {
      // 23505 = unique violation: this booking_code is already saved
      // (e.g. an offline-queued order that already synced). Treat as success
      // so it doesn't sit in the offline queue forever.
      if ((error as any).code === '23505') {
        return order;
      }
      console.error('Error saving order to Supabase — queueing offline:', error.message);
      this.addToOfflineQueue(order);
      try {
        window.dispatchEvent(new CustomEvent('shamon_order_placed', { detail: order }));
      } catch {
        // Ignore if in SSR or test
      }
      return null;
    }

    try {
      window.dispatchEvent(new CustomEvent('shamon_order_placed', { detail: order }));
    } catch {
      // Ignore if in SSR or test
    }
    return order;
  }

  // Both admin-portal call sites (booking.id, the Supabase UUID) and any
  // future caller using the human-readable booking code should work, so we
  // match on either column.
  private static orderIdentifierFilter(identifier: string): string {
    const safe = identifier.replace(/[^a-zA-Z0-9-]/g, '');
    return `id.eq.${safe},booking_code.eq.${safe}`;
  }

  static async updateOrderPaymentProof(
    orderId: string,
    proof: {
      payerName?: string;
      transactionRef?: string;
      paymentDate?: string;
      paymentProofNotes?: string;
      paymentMethod?: string;
    }
  ): Promise<Order | null> {
    const patch: Record<string, any> = {};
    if (proof.payerName !== undefined) patch.payer_name = proof.payerName;
    if (proof.transactionRef !== undefined) patch.transaction_ref = proof.transactionRef;
    if (proof.paymentDate !== undefined) patch.payment_date = proof.paymentDate;
    if (proof.paymentProofNotes !== undefined) patch.payment_proof_notes = proof.paymentProofNotes;
    if (proof.paymentMethod !== undefined) patch.payment_method = proof.paymentMethod;

    const { data, error } = await supabase
      .from('orders')
      .update(patch)
      .or(this.orderIdentifierFilter(orderId))
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating payment proof in Supabase:', error.message);
      throw error;
    }
    return data ? rowToOrder(data) : null;
  }

  static async updateOrderStatus(
    orderId: string,
    status: Order['status'],
    adminNotes?: string
  ): Promise<void> {
    const patch: Record<string, any> = { order_status: status };
    if (status === 'completed' || status === 'sold') {
      patch.payment_status = 'payment_confirmed';
      patch.sold_at = new Date().toISOString();
    }
    if (status === 'payment_verified' || status === 'approved') {
      patch.approved_at = new Date().toISOString();
    }
    if (adminNotes !== undefined) patch.admin_notes = adminNotes;

    const { error } = await supabase
      .from('orders')
      .update(patch)
      .or(this.orderIdentifierFilter(orderId));
    if (error) {
      console.error('Error updating order status in Supabase:', error.message);
      throw error;
    }

    try {
      window.dispatchEvent(new CustomEvent('shamon_order_updated', { detail: { orderId, status, adminNotes } }));
    } catch {
      // Ignore
    }
  }

  // Admin-only: called from the Admin Portal when an order is marked sold.
  static async deductStockForOrder(order: Order): Promise<void> {
    const products = await this.getProducts();
    let changed = false;
    for (const item of order.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;
      changed = true;
      if (product.isFeed && product.feedSizes && item.selectedVariant) {
        if (item.selectedVariant === '25kg' && product.feedSizes.fullBag) {
          product.feedSizes.fullBag.stockCount = Math.max(0, (product.feedSizes.fullBag.stockCount || 0) - item.quantity);
          if (product.feedSizes.fullBag.stockCount === 0) product.feedSizes.fullBag.inStock = false;
        } else if (item.selectedVariant === '12.5kg' && product.feedSizes.halfBag) {
          product.feedSizes.halfBag.stockCount = Math.max(0, (product.feedSizes.halfBag.stockCount || 0) - item.quantity);
          if (product.feedSizes.halfBag.stockCount === 0) product.feedSizes.halfBag.inStock = false;
        }
        product.stockCount = (product.feedSizes.fullBag?.stockCount || 0) + (product.feedSizes.halfBag?.stockCount || 0);
      } else if (product.category === 'birds') {
        if (item.selectedVariant === 'carton') {
          product.stockCount = Math.max(0, (product.stockCount || 0) - item.quantity);
        } else if (item.selectedVariant === 'chick') {
          const cartonsEquivalent = Math.max(1, Math.round(item.quantity / 50));
          if (item.quantity >= 25) {
            product.stockCount = Math.max(0, (product.stockCount || 0) - cartonsEquivalent);
          }
        } else {
          product.stockCount = Math.max(0, (product.stockCount || 0) - item.quantity);
        }
        if (product.stockCount === 0) product.inStock = false;
      } else {
        product.stockCount = Math.max(0, (product.stockCount || 0) - item.quantity);
        if (product.stockCount === 0) product.inStock = false;
      }
    }
    if (changed) {
      await this.saveProducts(products);
    }
  }

  // ---------------------------------------------------------------------
  // OFFLINE QUEUE — orders placed while the browser has no connection.
  // This intentionally stays in localStorage: it exists precisely for the
  // moments when Supabase is unreachable, and is drained by syncOfflineQueue()
  // once connectivity returns.
  // ---------------------------------------------------------------------
  static getOfflineQueue(): Order[] {
    try {
      const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static addToOfflineQueue(order: Order): void {
    const queue = this.getOfflineQueue();
    queue.push(order);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  }

  static clearOfflineQueue(): void {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  }

  static async syncOfflineQueue(): Promise<{ synced: number; failed: number }> {
    const queue = this.getOfflineQueue();
    if (queue.length === 0) return { synced: 0, failed: 0 };
    let synced = 0;
    let failed = 0;
    const stillQueued: Order[] = [];
    for (const order of queue) {
      const result = await this.addOrder(order);
      if (result) synced++;
      else {
        failed++;
        stillQueued.push(order);
      }
    }
    if (stillQueued.length > 0) {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(stillQueued));
    } else {
      this.clearOfflineQueue();
    }
    return { synced, failed };
  }

  // ---------------------------------------------------------------------
  // STOCK ALERT SUBSCRIPTIONS — anyone can subscribe; only admins can list.
  // ---------------------------------------------------------------------
  static async getAlertSubscriptions(): Promise<StockAlertSubscription[]> {
    const { data, error } = await supabase
      .from('alert_subscriptions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching alert subscriptions from Supabase:', error.message);
      return [];
    }
    return (data ?? []).map(rowToSubscription);
  }

  static async addAlertSubscription(sub: StockAlertSubscription): Promise<void> {
    const { error } = await supabase.from('alert_subscriptions').insert({
      customer_name: sub.customerName,
      phone: sub.phone,
      email: sub.email ?? null,
      lga: sub.lga ?? null,
      preferred_product: sub.preferredProduct ?? null,
      product_interest: sub.productInterest ?? null,
    });
    if (error) {
      console.error('Error saving alert subscription to Supabase:', error.message);
      throw error;
    }
  }

  // ---------------------------------------------------------------------
  // HATCHERY BATCHES — public read, admin write.
  // ---------------------------------------------------------------------
  static async getBatches(): Promise<HatcheryBatch[]> {
    const { data, error } = await supabase
      .from('hatchery_batches')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching batches from Supabase:', error.message);
      return [];
    }
    return (data ?? []).map(rowToBatch);
  }

  static async saveBatches(batches: HatcheryBatch[]): Promise<void> {
    const rows = batches.map(batchToRow);
    const { error } = await supabase.from('hatchery_batches').upsert(rows, { onConflict: 'id' });
    if (error) {
      console.error('Error saving batches to Supabase:', error.message);
      throw error;
    }
  }
}