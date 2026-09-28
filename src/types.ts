export type BirdCategory = "day-old" | "full-breeded" | "layers";

export interface BirdAgeOption {
  ageId: string;
  ageLabel: string; // e.g. "Day-Old (DOC)", "Mature Table-Size", "Point of Lay"
  pricePerBird: number;
  pricePerCarton?: number; // 50 birds carton or 10 birds crate
  inStock: boolean;
  stockCount: number;
  soldCount?: number;
  avgWeight?: string;
}

export interface BirdProduct {
  id: string;
  name: string; // "Day-Old Broilers", "Day-Old Noilers", "Full Breeded Broilers", "Layers (Day-Old Pullets)", "Layers (Point of Lay)"
  category: BirdCategory;
  breed: string;
  description: string;
  image: string;
  ageOptions: BirdAgeOption[];
  badge?: string;
  weightInfo?: string;
}

export interface FeedProduct {
  id: string;
  brand: "Chikun" | "Ultima";
  variant: "Starter" | "Finisher";
  name: string; // e.g. "Chikun Starter", "Chikun Finisher", "Ultima Starter", "Ultima Finisher"
  pricePerBag: number; // 25kg Full Bag
  pricePerHalfBag?: number; // 12.5kg Half Bag
  weightKg: number; // 25kg
  halfBagWeightKg?: number; // 12.5kg
  description: string;
  image: string;
  inStock: boolean;
  stockBags: number;
  soldBags?: number;
}

export interface StockLog {
  id: string;
  timestamp: string;
  itemType: "bird" | "feed";
  itemName: string;
  detailLabel?: string;
  changeType: "restock" | "sold" | "adjustment" | "return";
  quantityChanged: number;
  previousStock: number;
  newStock: number;
  unitPrice?: number;
  note?: string;
}

export interface PriceChangeLog {
  id: string;
  timestamp: string;
  itemType: "bird" | "feed";
  itemName: string;
  variantLabel: string;
  oldPrice: number;
  newPrice: number;
  priceType: "unit" | "carton" | "full_bag" | "half_bag";
}

export interface RegisteredCustomer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  lga?: string;
  preferredCategory?: string;
  notifyNewStock?: boolean;
  notifyPriceUpdates?: boolean;
  registeredAt: string;
}

export interface CartItem {
  id: string;
  itemType?: "bird" | "feed";
  productId: string;
  name: string;
  detailLabel?: string; // e.g. "Day-Old Carton (50 chicks)", "25kg Full Bag", "12.5kg Half Bag"
  unit?: string;
  category?: string;
  brand?: string;
  selectedVariant?: string;
  imageUrl?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  feedUnit?: "full_bag" | "half_bag";
}

export interface BookingOrder {
  id?: string;
  bookingRef?: string;
  bookingCode?: string; // alias for bookingRef
  receiptNumber?: string;
  customerName: string;
  phone: string;
  altPhone?: string;
  email?: string;
  address?: string;
  lga?: string;
  fulfillmentMethod?: "pickup" | "delivery" | string;
  deliveryAddress?: string;
  paymentDetails?: any;
  items: CartItem[];
  totalAmount: number;
  deliveryOrPickupLocation?: string;
  preferredDate?: string;
  notes?: string;
  paymentStatus?: "pending_transfer" | "payment_confirmed" | string;
  payerName?: string;
  transactionRef?: string;
  paymentDate?: string;
  paymentMethod?: string;
  paymentProofImage?: string;
  paymentProofNotes?: string;
  paymentConfirmedAt?: string;
  orderStatus?: "pending" | "approved" | "confirmed" | "ready_for_pickup" | "sold" | "completed" | "cancelled" | "pending_verification" | "payment_verified" | string;
  status?: "pending" | "approved" | "confirmed" | "ready_for_pickup" | "sold" | "completed" | "cancelled" | "pending_verification" | "payment_verified" | string;
  approvalStatus?: "pending_approval" | "approved" | "sold" | "rejected";
  stockStatus?: "in_stock_reserved" | "sold_deducted" | "returned_to_stock";
  stockDeducted?: boolean;
  adminNotes?: string;
  synced?: boolean;
  createdAt: string;
  approvedAt?: string;
  soldAt?: string;
}

export interface InventorySummary {
  totalBirdsInStock: number;
  totalFeedBagsInStock: number;
  totalUnitsSold: number;
  pendingOrdersCount: number;
  approvedOrdersCount: number;
  soldOrdersCount: number;
  estimatedStockValue: number;
  birdsValuation?: number;
  feedsValuation?: number;
  averageBirdPrice?: number;
  averageFeedPrice?: number;
}

export interface PriceAnalyticsReport {
  totalCombinedValuation: number;
  totalBirdValuation: number;
  totalFeedValuation: number;
  totalBirdsCount: number;
  totalFeedBags: number;
  avgBirdPrice: number;
  avgFeedBagPrice: number;
  feeds: {
    id: string;
    name: string;
    brand: string;
    variant: string;
    stockBags: number;
    pricePerBag: number;
    pricePerHalfBag: number;
    weightKg: number;
    halfBagWeightKg: number;
    pricePerKgFull: number;
    pricePerKgHalf: number;
    halfBagPremiumPercent: number;
    totalValuation: number;
  }[];
  birds: {
    birdId: string;
    birdName: string;
    breed: string;
    category: BirdCategory;
    ageId: string;
    ageLabel: string;
    stockCount: number;
    pricePerBird: number;
    pricePerCarton: number;
    cartonSavingsPerUnit: number;
    cartonSavingsPercent: number;
    totalValuation: number;
  }[];
}

export interface PriceAnalyticsSummary {
  totalInventoryValuation: number;
  birdsValuation: number;
  feedsValuation: number;
  feedPriceComparison: {
    feedId: string;
    name: string;
    brand: string;
    variant: string;
    fullBagPrice: number;
    halfBagPrice: number;
    pricePerKgFull: number;
    pricePerKgHalf: number;
    stockBags: number;
    valuation: number;
  }[];
  birdPriceComparison: {
    birdId: string;
    name: string;
    breed: string;
    category: BirdCategory;
    ageLabel: string;
    pricePerBird: number;
    pricePerCarton?: number;
    stockCount: number;
    valuation: number;
  }[];
  valuationDistribution: {
    name: string;
    value: number;
    color: string;
  }[];
}

export interface BulkNotification {
  id: string;
  subject: string;
  message: string;
  audience: "all" | "stock_subscribers" | "price_subscribers";
  sentAt: string;
  recipientCount: number;
}

export interface BankAccountDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch?: string;
  instruction: string;
}

export type AppTemplateTheme = "emerald-classic" | "pure-minimal" | "fresh-mint";
export type AppTheme = "emerald" | "savannah" | "nordic" | "wholesale" | "emerald-classic" | "pure-minimal" | "fresh-mint";

// Backward compatibility types for previous modules
export type OrderStatus = "pending" | "approved" | "confirmed" | "ready_for_pickup" | "sold" | "completed" | "cancelled" | "rejected" | "pending_verification" | "payment_verified" | string;
export type Order = BookingOrder;

export interface ProductChickPricing {
  pricePerChick: number;
  pricePerCarton: number;
  chicksPerCarton: number;
}

export interface ProductFeedSizes {
  fullBag?: { price: number; weight?: string; inStock: boolean; size?: string; stockCount?: number };
  halfBag?: { price: number; weight?: string; inStock: boolean; size?: string; stockCount?: number };
}

export interface Product {
  id: string;
  name: string;
  category: string;
  subCategory?: string;
  brand?: string;
  breed?: string;
  description: string;
  basePrice: number;
  unit: string;
  minOrderQuantity?: number;
  imageUrl?: string;
  isFeed?: boolean;
  feedSizes?: ProductFeedSizes;
  chickPricing?: ProductChickPricing;
  inStock?: boolean;
  stockCount?: number;
  tags?: string[];
  hatchSchedule?: string;
  nextHatchDate?: string;
  badge?: string;
  features?: string[];
  nutritionalInfo?: any;
}

export interface DepotInfo {
  name: string;
  location?: string;
  address: string;
  landmark?: string;
  city?: string;
  state?: string;
  phone?: string;
  phones?: string[];
  whatsappNumber?: string;
  email?: string;
  operatingHours?: string;
  openingHours?: string;
  bankAccount?: BankAccountDetails;
  bankDetails?: any;
}

export interface HatcheryBatch {
  id: string;
  title?: string;
  breed: string;
  deliveryDate?: string;
  bookingCloses?: string;
  pricePerCarton: number;
  availableCartons?: number;
  cartonsAvailable?: number;
  status: "open" | "closing_soon" | "sold_out" | "booking_open" | "limited_slots" | string;
  hatchDate?: string;
  totalChicks?: number;
  notes?: string;
}

export interface StockAlertSubscription {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  lga?: string;
  preferredProduct?: string;
  productInterest?: string;
  subscribedAt?: string;
  createdAt?: string;
}

export interface ThemeOption {
  id: AppTheme;
  name: string;
  tagline: string;
  badge?: string;
  density?: string;
  primaryColor?: string;
  accentColor?: string;
  previewClass?: string;
  description: string;
  colors?: {
    primary: string;
    primaryDark?: string;
    secondary?: string;
    accent: string;
    bg: string;
    cardBg?: string;
    border?: string;
    surface?: string;
    text: string;
  };
  sampleTags?: string[];
}


