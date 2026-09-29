import React, { useState, useEffect } from "react";
import {
  X,
  Lock,
  DollarSign,
  Users,
  FileText,
  Send,
  Building2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Package,
  RefreshCw,
  Edit2,
  Save,
  Check,
  Search,
  Filter,
  PlusCircle,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  History,
  Tag,
  Download,
  FileSpreadsheet,
  ChevronDown,
  FileCheck2,
  Printer,
  CreditCard,
  BarChart2,
  LayoutGrid,
  ShoppingBag,
  UserPlus,
  RotateCcw,
} from "lucide-react";
import {
  BirdProduct,
  FeedProduct,
  BookingOrder,
  RegisteredCustomer,
  BulkNotification,
  BankAccountDetails,
  StockLog,
  InventorySummary,
  PriceAnalyticsReport,
  Product,
  BirdCategory,
  ProductChickPricing,
} from "../types";
import { DEPOT_INFO } from "../data/initialData";
import { StorageService } from "../lib/storage";
import { supabase } from "../lib/supabaseClient";
import {
  exportConsolidatedReportCSV,
  exportCurrentInventoryCSV,
  exportBookingsListCSV,
  exportPriceAnalyticsCSV,
} from "../utils/csvExport";
import { VirtualReceiptModal } from "./VirtualReceiptModal";
import {
  getCachedBookings,
  saveCachedBookings,
  getCachedCustomers,
  saveCachedCustomers,
} from "../utils/offlineStorage";

// Default carton size used whenever a product doesn't yet have chickPricing
// set. Adjust chicksPerCarton if your real default (e.g. Day-Old cartons)
// differs — this is only used as a fallback base, never overwrites an
// explicit value the admin enters.
const DEFAULT_CHICK_PRICING: ProductChickPricing = {
  pricePerChick: 0,
  pricePerCarton: 0,
  chicksPerCarton: 50,
};

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
  birds?: BirdProduct[];
  feeds?: FeedProduct[];
  products?: Product[];
  onUpdateProducts?: (products: Product[]) => void;
  bankDetails?: BankAccountDetails;
  onRefreshCatalog?: () => void;
  isStandalone?: boolean;
  isLoggedIn?: boolean;
  setIsLoggedIn?: (val: boolean) => void;
  onViewReceipt?: (order: BookingOrder) => void;
  onNavigateHome?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  isOpen,
  onClose,
  birds: rawBirds,
  feeds: rawFeeds,
  products,
  onUpdateProducts,
  bankDetails: rawBankDetails,
  onRefreshCatalog,
  isLoggedIn,
  setIsLoggedIn,
  onViewReceipt,
  onNavigateHome,
}) => {
  const birds: BirdProduct[] = React.useMemo(() => {
    if (rawBirds && rawBirds.length > 0) return rawBirds;
    if (!products) return [];
    return products
      .filter((p) => !p.isFeed)
      .map((p) => ({
        id: p.id,
        name: p.name,
        category: (p.subCategory === 'doc' ? 'day-old' : p.subCategory === 'pol' ? 'layers' : 'full-breeded') as BirdCategory,
        breed: p.breed || p.name,
        description: p.description,
        image: p.imageUrl || '',
        badge: p.badge,
        weightInfo: p.unit,
        ageOptions: [
          {
            ageId: p.id,
            ageLabel: p.unit,
            pricePerBird: p.basePrice,
            pricePerCarton: p.subCategory === 'doc' ? p.basePrice : undefined,
            inStock: p.inStock ?? true,
            stockCount: p.stockCount ?? 0,
            soldCount: 0,
          },
        ],
      }));
  }, [rawBirds, products]);

  const feeds: FeedProduct[] = React.useMemo(() => {
    if (rawFeeds && rawFeeds.length > 0) return rawFeeds;
    if (!products) return [];
    return products
      .filter((p) => p.isFeed)
      .map((p) => ({
        id: p.id,
        brand: (p.brand === 'Ultima' ? 'Ultima' : 'Chikun') as 'Chikun' | 'Ultima',
        variant: (p.name.toLowerCase().includes('starter') ? 'Starter' : 'Finisher') as 'Starter' | 'Finisher',
        name: p.name,
        pricePerBag: p.feedSizes?.fullBag?.price || p.basePrice,
        pricePerHalfBag: p.feedSizes?.halfBag?.price || Math.round(p.basePrice / 2 + 250),
        weightKg: 25,
        halfBagWeightKg: 12.5,
        description: p.description,
        image: p.imageUrl || '',
        inStock: p.inStock ?? true,
        stockBags: p.feedSizes?.fullBag?.stockCount?? p.stockCount?? 0,
        soldBags: 0,
      }));
  }, [rawFeeds, products]);

  const bankDetails: BankAccountDetails = rawBankDetails || DEPOT_INFO.bankDetails;

  const [isAuthenticated, setIsAuthenticated] = useState(isLoggedIn ?? false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (isLoggedIn !== undefined) {
      setIsAuthenticated(isLoggedIn);
    }
  }, [isLoggedIn]);

  // On mount, check whether there's already a valid admin session (e.g. the
  // page was refreshed) so staff aren't forced to log in again every time.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id;
      if (uid) {
        const { data: adminRow } = await supabase
          .from("admin_users")
          .select("id")
          .eq("id", uid)
          .maybeSingle();
        if (!cancelled && adminRow) {
          setAuthSuccess(true);
        }
      }
      if (!cancelled) setCheckingSession(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setAuthSuccess = (val: boolean) => {
    setIsAuthenticated(val);
    if (setIsLoggedIn) setIsLoggedIn(val);
  };

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<
    "overview" | "inventory" | "analytics" | "bookings" | "prices" | "customers" | "broadcast" | "bank"
  >("overview");

  // Admin Data
  const [bookings, setBookings] = useState<BookingOrder[]>([]);
  const [customers, setCustomers] = useState<RegisteredCustomer[]>([]);
  const [notifications, setNotifications] = useState<BulkNotification[]>([]);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [priceAnalytics, setPriceAnalytics] = useState<PriceAnalyticsReport | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  // Restock Batch Form State
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockItemType, setRestockItemType] = useState<"bird" | "feed">("bird");
  const [restockProductId, setRestockProductId] = useState<string>("");
  const [restockAgeId, setRestockAgeId] = useState<string>("");
  const [restockQty, setRestockQty] = useState<number | "">("");
  const [restockBatchNote, setRestockBatchNote] = useState<string>("");
  const [restockBirdPrice, setRestockBirdPrice] = useState<number | "">("");
  const [restockCartonPrice, setRestockCartonPrice] = useState<number | "">("");
  const [restockFeedPrice, setRestockFeedPrice] = useState<number | "">("");
  const [restockHalfBagPrice, setRestockHalfBagPrice] = useState<number | "">("");
  const [restockingLoading, setRestockingLoading] = useState(false);

  // Quick Direct Stock Adjust
  const [editingStockState, setEditingStockState] = useState<{
    [key: string]: {
      stockCount: number;
      soldCount: number;
      inStock: boolean;
      pricePerBird?: number;
      pricePerCarton?: number;
      pricePerBag?: number;
      pricePerHalfBag?: number;
    };
  }>({});

  // Bulk Notification Form
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastAudience, setBroadcastAudience] = useState<"all" | "stock_subscribers" | "price_subscribers">("all");
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);

  // Editable Bird & Feed Prices State
  const [editingBirdPrices, setEditingBirdPrices] = useState<{
    [key: string]: { pricePerBird: number; pricePerCarton: number; inStock: boolean };
  }>({});
  const [editingFeedPrices, setEditingFeedPrices] = useState<{
    [feedId: string]: { pricePerBag: number; pricePerHalfBag: number; inStock: boolean };
  }>({});
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Bank Info Editing
  const [editBank, setEditBank] = useState<BankAccountDetails>(bankDetails);

  // Filter for bookings
  const [bookingFilterStatus, setBookingFilterStatus] = useState<string>("all");
  const [bookingSearch, setBookingSearch] = useState<string>("");

  // Virtual Receipt State for Admin
  const [adminReceiptBooking, setAdminReceiptBooking] = useState<BookingOrder | null>(null);

  // Download Report Modal State
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadReportType, setDownloadReportType] = useState<
    "consolidated" | "inventory" | "price_analytics" | "pending" | "all_orders"
  >("consolidated");

  const handleDownloadReport = (
    type: "consolidated" | "inventory" | "price_analytics" | "pending" | "all_orders" = downloadReportType
  ) => {
    try {
      if (type === "consolidated") {
        exportConsolidatedReportCSV(birds, feeds, bookings, summary);
        setSaveStatus("✓ Downloaded Farm Report: Inventory & Pending Orders (CSV)");
      } else if (type === "inventory") {
        exportCurrentInventoryCSV(birds, feeds);
        setSaveStatus("✓ Downloaded Current Inventory Stock Report (CSV)");
      } else if (type === "price_analytics") {
        exportPriceAnalyticsCSV(birds, feeds);
        setSaveStatus("✓ Downloaded Price Analytics & Valuation Matrix (CSV)");
      } else if (type === "pending") {
        exportBookingsListCSV(bookings, "pending");
        setSaveStatus("✓ Downloaded Pending Booking Requests List (CSV)");
      } else if (type === "all_orders") {
        exportBookingsListCSV(bookings, "all");
        setSaveStatus("✓ Downloaded All Orders & Booking History (CSV)");
      }
      setShowDownloadModal(false);
      setTimeout(() => setSaveStatus(null), 3500);
    } catch (err: any) {
      alert("Failed to export CSV: " + (err?.message || "Unknown error"));
    }
  };

  useEffect(() => {
    setEditBank(bankDetails);
  }, [bankDetails]);

  useEffect(() => {
    if (birds.length > 0 && !restockProductId) {
      setRestockProductId(birds[0].id);
      setRestockAgeId(birds[0].ageOptions[0]?.ageId || "");
    }
  }, [birds, restockProductId]);

  useEffect(() => {
    if (restockItemType === "bird") {
      const b = birds.find((x) => x.id === restockProductId) || birds[0];
      if (b) {
        const opt = b.ageOptions.find((a) => a.ageId === restockAgeId) || b.ageOptions[0];
        if (opt) {
          setRestockBirdPrice(opt.pricePerBird ?? "");
          setRestockCartonPrice(opt.pricePerCarton ?? "");
        }
      }
    } else {
      const f = feeds.find((x) => x.id === restockProductId) || feeds[0];
      if (f) {
        setRestockFeedPrice(f.pricePerBag ?? "");
        setRestockHalfBagPrice(f.pricePerHalfBag ?? Math.round((f.pricePerBag || 0) / 2 + 250));
      }
    }
  }, [restockItemType, restockProductId, restockAgeId, birds, feeds, showRestockModal]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!navigator.onLine) {
      setAuthError("You're offline — an internet connection is required to sign in.");
      return;
    }

    setAuthLoading(true);
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: adminEmail.trim(),
        password: adminPassword,
      });
      if (signInError || !signInData.user) {
        throw new Error(signInError?.message || "Invalid email or password.");
      }

      // Being a valid Supabase Auth user is not enough on its own — they
      // must also be listed in admin_users to actually get admin rights.
      const { data: adminRow, error: adminCheckError } = await supabase
        .from("admin_users")
        .select("id")
        .eq("id", signInData.user.id)
        .maybeSingle();

      if (adminCheckError || !adminRow) {
        await supabase.auth.signOut();
        throw new Error("This account is not authorized for admin access.");
      }

      setAdminPassword("");
      setAuthSuccess(true);
      fetchAdminData();
    } catch (err: any) {
      setAuthError(err.message || "Failed to authenticate.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdminLogout = async () => {
    await supabase.auth.signOut();
    setAuthSuccess(false);
  };

  const computeLocalPriceAnalytics = (birdsData: BirdProduct[], feedsData: FeedProduct[]): PriceAnalyticsReport => {
    let totalFeedValuation = 0;
    let totalBirdValuation = 0;
    let totalFeedBags = 0;
    let totalBirdsCount = 0;
    let totalBirdSumPrices = 0;
    let birdOptionsCount = 0;
    let totalFeedSumPrices = 0;

    const feedsAnalytics = feedsData.map((feed) => {
      const fullBagPrice = feed.pricePerBag || 0;
      const halfBagPrice = feed.pricePerHalfBag || Math.round(fullBagPrice / 2 + 250);
      const weightKg = feed.weightKg || 25;
      const halfBagWeightKg = feed.halfBagWeightKg || 12.5;
      const pricePerKgFull = Math.round(fullBagPrice / weightKg);
      const pricePerKgHalf = Math.round(halfBagPrice / halfBagWeightKg);
      const halfBagPremiumPercent = fullBagPrice > 0
        ? Number((((halfBagPrice * 2) - fullBagPrice) / fullBagPrice * 100).toFixed(1))
        : 0;
      const totalValuation = (feed.stockBags || 0) * fullBagPrice;
      totalFeedValuation += totalValuation;
      totalFeedBags += (feed.stockBags || 0);
      totalFeedSumPrices += fullBagPrice;

      return {
        id: feed.id,
        name: feed.name,
        brand: feed.brand,
        variant: feed.variant,
        stockBags: feed.stockBags || 0,
        pricePerBag: fullBagPrice,
        pricePerHalfBag: halfBagPrice,
        weightKg,
        halfBagWeightKg,
        pricePerKgFull,
        pricePerKgHalf,
        halfBagPremiumPercent,
        totalValuation,
      };
    });

    const birdsAnalytics: any[] = [];
    birdsData.forEach((bird) => {
      bird.ageOptions.forEach((opt) => {
        const stock = opt.stockCount || 0;
        const unitPrice = opt.pricePerBird || 0;
        const cartonPrice = opt.pricePerCarton || 0;
        const unitEquivalent = cartonPrice > 0 ? Math.round(cartonPrice / (bird.category === "day-old" ? 50 : 10)) : unitPrice;
        const cartonSavingsPerUnit = cartonPrice > 0 ? unitPrice - unitEquivalent : 0;
        const cartonSavingsPercent = unitPrice > 0 && cartonPrice > 0
          ? Number(((cartonSavingsPerUnit / unitPrice) * 100).toFixed(1))
          : 0;
        const totalValuation = stock * unitPrice;
        totalBirdValuation += totalValuation;
        totalBirdsCount += stock;
        totalBirdSumPrices += unitPrice;
        birdOptionsCount++;

        birdsAnalytics.push({
          birdId: bird.id,
          birdName: bird.name,
          breed: bird.breed,
          category: bird.category,
          ageId: opt.ageId,
          ageLabel: opt.ageLabel,
          stockCount: stock,
          pricePerBird: unitPrice,
          pricePerCarton: cartonPrice,
          cartonSavingsPerUnit,
          cartonSavingsPercent,
          totalValuation,
        });
      });
    });

    return {
      totalCombinedValuation: totalFeedValuation + totalBirdValuation,
      totalFeedValuation,
      totalBirdValuation,
      totalBirdsCount,
      totalFeedBags,
      avgBirdPrice: birdOptionsCount > 0 ? Math.round(totalBirdSumPrices / birdOptionsCount) : 0,
      avgFeedBagPrice: feedsData.length > 0 ? Math.round(totalFeedSumPrices / feedsData.length) : 0,
      feeds: feedsAnalytics,
      birds: birdsAnalytics,
    };
  };

  const isPendingOrder = (b: BookingOrder) => {
    const st = (b.orderStatus || b.status || "").toLowerCase();
    return st === "pending" || st === "pending_verification" || st === "pending_transfer" || st === "";
  };

  const isApprovedOrder = (b: BookingOrder) => {
    const st = (b.orderStatus || b.status || "").toLowerCase();
    return st === "approved" || st === "confirmed" || st === "ready_for_pickup" || st === "payment_verified";
  };

  const isSoldOrder = (b: BookingOrder) => {
    const st = (b.orderStatus || b.status || "").toLowerCase();
    return st === "sold" || st === "completed";
  };

  const isCancelledOrder = (b: BookingOrder) => {
    const st = (b.orderStatus || b.status || "").toLowerCase();
    return st === "cancelled";
  };

  // Overview dashboard: last-7-days vs prior-7-days deltas computed from
  // real order/customer data (no placeholder numbers).
  const overviewStats = React.useMemo(() => {
    const DAY_MS = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const startOfDay = (t: number) => {
      const d = new Date(t);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    };
    const todayStart = startOfDay(now);
    const last7Start = todayStart - 6 * DAY_MS; // includes today = 7 days
    const prev7Start = last7Start - 7 * DAY_MS;
    const prev7End = last7Start;

    const revenueOf = (b: BookingOrder) =>
      (isSoldOrder(b) || isApprovedOrder(b)) ? Number((b as any).totalAmount || 0) : 0;

    const inRange = (b: BookingOrder, start: number, end: number) => {
      const t = new Date((b as any).createdAt || 0).getTime();
      return t >= start && t < end;
    };

    const thisWeekOrders = bookings.filter((b) => inRange(b, last7Start, now + DAY_MS));
    const prevWeekOrders = bookings.filter((b) => inRange(b, prev7Start, prev7End));

    const revenueThis = thisWeekOrders.reduce((sum, b) => sum + revenueOf(b), 0);
    const revenuePrev = prevWeekOrders.reduce((sum, b) => sum + revenueOf(b), 0);

    const ordersThis = thisWeekOrders.length;
    const ordersPrev = prevWeekOrders.length;

    const customersThis = customers.filter((c) =>
      inRange({ createdAt: c.registeredAt } as any, last7Start, now + DAY_MS)
    ).length;
    const customersPrev = customers.filter((c) =>
      inRange({ createdAt: c.registeredAt } as any, prev7Start, prev7End)
    ).length;

    const cancelledThis = thisWeekOrders.filter(isCancelledOrder).length;
    const cancelledPrev = prevWeekOrders.filter(isCancelledOrder).length;
    const refundRateThis = ordersThis > 0 ? (cancelledThis / ordersThis) * 100 : 0;
    const refundRatePrev = ordersPrev > 0 ? (cancelledPrev / ordersPrev) * 100 : 0;

    const pctChange = (curr: number, prev: number): number | null => {
      if (prev === 0) return curr > 0 ? 100 : null;
      return ((curr - prev) / prev) * 100;
    };

    // Weekly sales chart: revenue per day for the last 7 days, oldest first.
    const weeklySales: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = todayStart - i * DAY_MS;
      const dayEnd = dayStart + DAY_MS;
      const dayRevenue = bookings
        .filter((b) => inRange(b, dayStart, dayEnd))
        .reduce((sum, b) => sum + revenueOf(b), 0);
      weeklySales.push({
        label: new Date(dayStart).toLocaleDateString("en-US", { weekday: "short" }),
        value: dayRevenue,
      });
    }

    return {
      revenueThis,
      revenueChange: pctChange(revenueThis, revenuePrev),
      ordersThis,
      ordersChange: pctChange(ordersThis, ordersPrev),
      customersThis,
      customersChange: pctChange(customersThis, customersPrev),
      refundRateThis,
      refundRateChange: pctChange(refundRateThis, refundRatePrev),
      weeklySales,
    };
  }, [bookings, customers]);


  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchAdminData();
    }
  }, [isOpen, isAuthenticated]);

  useEffect(() => {
    const handleSync = () => {
      fetchAdminData();
    };
    window.addEventListener("shamon_order_placed", handleSync);
    window.addEventListener("shamon_order_updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("shamon_order_placed", handleSync);
      window.removeEventListener("shamon_order_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const fetchAdminData = async () => {
    setLoadingData(true);
    if (onRefreshCatalog) {
      onRefreshCatalog();
    }
    try {
      // 1. Load real orders from Supabase (requires an authenticated admin
      // session — enforced by the orders table's Row Level Security policy).
      const allBookings = await StorageService.getOrders();
      saveCachedBookings(allBookings); // keep an offline fallback cache
      setBookings(allBookings);

      // Compute live inventory summary from real store data
      const pendingList = allBookings.filter(isPendingOrder);
      const approvedOrSoldList = allBookings.filter((b) => isSoldOrder(b) || isApprovedOrder(b));
      const totalSoldFromBookings = approvedOrSoldList.reduce(
        (sum, b) => sum + (b.items || []).reduce((acc, it) => acc + (Number(it.quantity) || 1), 0),
        0
      );
      const directSoldBirds = birds.reduce(
        (acc, b) => acc + b.ageOptions.reduce((a, opt) => a + (opt.soldCount || 0), 0),
        0
      );
      const directSoldFeeds = feeds.reduce((acc, f) => acc + (f.soldBags || 0), 0);

      setSummary({
        totalBirdsInStock: birds.reduce(
          (acc, b) => acc + b.ageOptions.reduce((a, opt) => a + (opt.stockCount || 0), 0),
          0
        ),
        totalFeedBagsInStock: feeds.reduce((acc, f) => acc + (f.stockBags || 0), 0),
        totalPendingRequests: pendingList.length,
        totalUnitsSold: totalSoldFromBookings + directSoldBirds + directSoldFeeds,
      } as any);

      // 2. Load customers — alert subscribers double as a lightweight CRM
      // list until there's a dedicated customers table.
      const alertSubs = await StorageService.getAlertSubscriptions();
      const offlineCustomers = getCachedCustomers();
      const custMap = new Map<string, RegisteredCustomer>();
      for (const c of offlineCustomers) {
        if (c.phone) custMap.set(c.phone, c);
      }
      for (const sub of alertSubs) {
        if (sub.phone && !custMap.has(sub.phone)) {
          custMap.set(sub.phone, {
            id: sub.id,
            name: sub.customerName,
            phone: sub.phone,
            email: '',
            lga: sub.lga || 'Kaltungo',
            address: `${sub.lga || 'Kaltungo'}, Gombe State`,
            preferredCategory: sub.productInterest || 'All Stock',
            registeredAt: sub.createdAt || new Date().toISOString(),
          });
        }
      }
      setCustomers(Array.from(custMap.values()));
      saveCachedCustomers(Array.from(custMap.values()));
      setPriceAnalytics(computeLocalPriceAnalytics(birds, feeds));
    } catch (err) {
      console.error("Failed to load admin data from Supabase, falling back to offline cache:", err);
      const cached = getCachedBookings();
      setBookings(cached);
      setCustomers(getCachedCustomers());
      setPriceAnalytics(computeLocalPriceAnalytics(birds, feeds));
    } finally {
      setLoadingData(false);
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockQty || Number(restockQty) <= 0) return;
    if (!restockProductId) {
      alert("Please select which product this stock batch belongs to.");
      return;
    }
    setRestockingLoading(true);
    try {
      // Persist directly to Supabase
      const allProds = await StorageService.getProducts();
      const targetProdIndex = allProds.findIndex((p) => p.id === restockProductId);
      if (targetProdIndex === -1) {
        alert(
          "Could not find the selected product to restock. Please pick a product from the dropdown and try again."
        );
        setRestockingLoading(false);
        return;
      }
      const prod = { ...allProds[targetProdIndex] };
      prod.stockCount = (prod.stockCount || 0) + Number(restockQty);
      prod.inStock = true;
      if (restockBirdPrice !== "") prod.basePrice = Number(restockBirdPrice);
      if (!prod.isFeed && (restockBirdPrice !== "" || restockCartonPrice !== "")) {
        // Keep chickPricing in sync — the storefront reads this field first.
        // Resolve a complete, non-optional base first so every property in
        // the result is a definite `number` (never `undefined`), matching
        // the required fields on ProductChickPricing.
        const base = prod.chickPricing ?? DEFAULT_CHICK_PRICING;
        prod.chickPricing = {
          pricePerChick: restockBirdPrice !== "" ? Number(restockBirdPrice) : base.pricePerChick,
          pricePerCarton: restockCartonPrice !== "" ? Number(restockCartonPrice) : base.pricePerCarton,
          chicksPerCarton: base.chicksPerCarton,
        };
      }
      if (prod.isFeed) {
        if (!prod.feedSizes) {
          prod.feedSizes = {
            fullBag: { price: prod.basePrice, inStock: true, stockCount: prod.stockCount },
            halfBag: { price: Math.round(prod.basePrice / 2 + 250), inStock: true, stockCount: (prod.stockCount || 0) * 2 },
          };
        }
        if (restockFeedPrice !== "") {
          prod.feedSizes.fullBag = {
            price: Number(restockFeedPrice),
            inStock: true,
            stockCount: (prod.feedSizes.fullBag?.stockCount || 0) + Number(restockQty),
          };
          prod.basePrice = Number(restockFeedPrice);
        }
        if (restockHalfBagPrice !== "") {
          prod.feedSizes.halfBag = {
            price: Number(restockHalfBagPrice),
            inStock: true,
            stockCount: prod.feedSizes.halfBag?.stockCount || (((prod.feedSizes.fullBag?.stockCount || 0) + Number(restockQty)) * 2),
          };
        }
      }
      allProds[targetProdIndex] = prod;
      await StorageService.saveProducts(allProds);
      if (onUpdateProducts) onUpdateProducts(allProds);

      window.dispatchEvent(new CustomEvent("shamon_price_updated"));

      setSaveStatus("New stock & price recorded successfully!");
      setShowRestockModal(false);
      setRestockQty("");
      setRestockBatchNote("");
      setRestockBirdPrice("");
      setRestockCartonPrice("");
      setRestockFeedPrice("");
      setRestockHalfBagPrice("");
      if (onRefreshCatalog) onRefreshCatalog();
      fetchAdminData();
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to restock.");
    } finally {
      setRestockingLoading(false);
    }
  };

  const handleDirectStockAdjust = async (
    itemType: "bird" | "feed",
    productId: string,
    ageId?: string,
    currentStock?: number,
    currentSold?: number,
    currentInStock?: boolean,
    priceBird?: number,
    priceCarton?: number,
    priceBag?: number,
    priceHalf?: number
  ) => {
    const key = `${productId}-${ageId || "feed"}`;
    const vals = editingStockState[key] || {
      stockCount: currentStock || 0,
      soldCount: currentSold || 0,
      inStock: currentInStock ?? true,
      pricePerBird: priceBird,
      pricePerCarton: priceCarton,
      pricePerBag: priceBag,
      pricePerHalfBag: priceHalf,
    };

    // Persist directly to Supabase
    const allProds = await StorageService.getProducts();
    const targetProdIndex = allProds.findIndex((p) => p.id === productId);
    if (targetProdIndex !== -1) {
      const prod = { ...allProds[targetProdIndex] };
      prod.stockCount = vals.stockCount;
      prod.inStock = vals.inStock;
      if (vals.pricePerBird !== undefined) prod.basePrice = vals.pricePerBird;
      if (vals.pricePerCarton !== undefined) prod.basePrice = vals.pricePerCarton;
      if (!prod.isFeed && (vals.pricePerBird !== undefined || vals.pricePerCarton !== undefined)) {
        // Keep chickPricing in sync — the storefront reads this field first.
        // Resolve a complete, non-optional base first (see note above).
        const base = prod.chickPricing ?? DEFAULT_CHICK_PRICING;
        prod.chickPricing = {
          pricePerChick: vals.pricePerBird ?? base.pricePerChick,
          pricePerCarton: vals.pricePerCarton ?? base.pricePerCarton,
          chicksPerCarton: base.chicksPerCarton,
        };
      }
      if (prod.isFeed) {
        if (!prod.feedSizes) {
          prod.feedSizes = {
            fullBag: { price: prod.basePrice, inStock: vals.inStock ?? true, stockCount: prod.stockCount },
            halfBag: { price: Math.round(prod.basePrice / 2 + 250), inStock: vals.inStock ?? true, stockCount: (prod.stockCount || 0) * 2 },
          };
        }
        if (vals.pricePerBag !== undefined) {
          prod.feedSizes.fullBag = { price: vals.pricePerBag, inStock: vals.inStock ?? true, stockCount: vals.stockCount };
          prod.basePrice = vals.pricePerBag;
        }
        if (vals.pricePerHalfBag !== undefined) {
          prod.feedSizes.halfBag = { price: vals.pricePerHalfBag, inStock: vals.inStock ?? true, stockCount: vals.stockCount * 2 };
        }
      }
      allProds[targetProdIndex] = prod;
      try {
        await StorageService.saveProducts(allProds);
        if (onUpdateProducts) onUpdateProducts(allProds);
        window.dispatchEvent(new CustomEvent("shamon_price_updated"));
        setSaveStatus(`Stock & prices updated.`);
        if (onRefreshCatalog) onRefreshCatalog();
        fetchAdminData();
        setTimeout(() => setSaveStatus(null), 2500);
      } catch (err) {
        console.error(err);
        alert("Failed to save stock/price changes. Please check your connection and try again.");
      }
    } else {
      alert("Could not find this product in the catalog. Try refreshing the page and updating again.");
    }
  };

  const handleApproveBooking = async (bookingId: string) => {
    try {
      await StorageService.updateOrderStatus(bookingId, "payment_verified", "Approved by Admin - Reserved in pen/store.");
      setSaveStatus("Booking approved and marked in stock.");
      await fetchAdminData();
      if (onRefreshCatalog) onRefreshCatalog();
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to approve booking. Please check your connection and try again.");
    }
  };

  const handleMarkAsSold = async (bookingId: string) => {
    if (!window.confirm("Confirm marking this request as SOLD? This will deduct the units from live stock.")) {
      return;
    }
    try {
      await StorageService.updateOrderStatus(bookingId, "completed", "Sold and handed over to customer. Payment confirmed.");
      const targetOrder = bookings.find((b) => b.id === bookingId || b.bookingRef === bookingId || b.bookingCode === bookingId);
      if (targetOrder) {
        await StorageService.deductStockForOrder(targetOrder as any);
      }
      setSaveStatus("Order marked as SOLD and stock deducted.");
      await fetchAdminData();
      if (onRefreshCatalog) onRefreshCatalog();
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to mark order as sold. Please check your connection and try again.");
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await StorageService.updateOrderStatus(bookingId, "cancelled", "Cancelled by Admin.");
      setSaveStatus("Booking cancelled.");
      await fetchAdminData();
      if (onRefreshCatalog) onRefreshCatalog();
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to cancel booking. Please check your connection and try again.");
    }
  };

  const handleAdminConfirmPayment = async (bookingId: string) => {
    try {
      await StorageService.updateOrderStatus(bookingId, "payment_verified", "Payment confirmed by shamonsStore Audit.");
      const foundBooking = bookings.find((b) => b.id === bookingId || b.bookingRef === bookingId || b.bookingCode === bookingId);
      if (foundBooking) {
        setAdminReceiptBooking({ ...foundBooking, paymentStatus: "payment_confirmed" as any, status: "payment_verified" as any });
      }
      setSaveStatus("Payment confirmed.");
      await fetchAdminData();
      if (onRefreshCatalog) onRefreshCatalog();
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to confirm payment. Please check your connection and try again.");
    }
  };

  const handleSaveBirdPrice = async (birdId: string, ageId: string) => {
    const key = `${birdId}-${ageId}`;
    const vals = editingBirdPrices[key];
    if (!vals) return;

    const allProds = await StorageService.getProducts();
    const targetIdx = allProds.findIndex((p) => p.id === birdId);
    if (targetIdx !== -1) {
      const prod = { ...allProds[targetIdx] };
      if (vals.pricePerCarton && vals.pricePerCarton > 0) {
        prod.basePrice = vals.pricePerCarton;
      } else if (vals.pricePerBird && vals.pricePerBird > 0) {
        prod.basePrice = vals.pricePerBird;
      }
      // The storefront cart (App.tsx handleAddToCart) reads
      // product.chickPricing.pricePerCarton / pricePerChick FIRST, only
      // falling back to basePrice if those are unset. Previously this
      // function only updated basePrice, so the customer-facing price
      // never changed even though the database was updated correctly.
      // Resolve a complete, non-optional base first (see note above).
      const base = prod.chickPricing ?? DEFAULT_CHICK_PRICING;
      prod.chickPricing = {
        pricePerChick: vals.pricePerBird && vals.pricePerBird > 0 ? vals.pricePerBird : base.pricePerChick,
        pricePerCarton: vals.pricePerCarton && vals.pricePerCarton > 0 ? vals.pricePerCarton : base.pricePerCarton,
        chicksPerCarton: base.chicksPerCarton,
      };
      prod.inStock = vals.inStock;
      allProds[targetIdx] = prod;
      try {
        await StorageService.saveProducts(allProds);
        if (onUpdateProducts) onUpdateProducts(allProds);
        window.dispatchEvent(new CustomEvent("shamon_price_updated"));
        setSaveStatus(`Saved price for ${birdId} (${ageId})`);
        if (onRefreshCatalog) onRefreshCatalog();
        fetchAdminData();
        setTimeout(() => setSaveStatus(null), 2500);
      } catch (err) {
        console.error(err);
        alert("Failed to save price. Please check your connection and try again.");
      }
    }
  };

  const handleSaveFeedPrice = async (feedId: string) => {
    const vals = editingFeedPrices[feedId];
    if (!vals) return;

    const allProds = await StorageService.getProducts();
    const targetIdx = allProds.findIndex((p) => p.id === feedId);
    if (targetIdx !== -1) {
      const prod = { ...allProds[targetIdx] };
      prod.basePrice = vals.pricePerBag;
      prod.inStock = vals.inStock;
      if (!prod.feedSizes) {
        prod.feedSizes = {
          fullBag: { price: vals.pricePerBag, inStock: vals.inStock ?? true, stockCount: prod.stockCount || 50 },
          halfBag: { price: vals.pricePerHalfBag, inStock: vals.inStock ?? true, stockCount: (prod.stockCount || 50) * 2 },
        };
      } else {
        prod.feedSizes.fullBag = {
          ...prod.feedSizes.fullBag,
          price: vals.pricePerBag,
          inStock: vals.inStock ?? true,
        };
        prod.feedSizes.halfBag = {
          ...prod.feedSizes.halfBag,
          price: vals.pricePerHalfBag,
          inStock: vals.inStock ?? true,
        };
      }
      allProds[targetIdx] = prod;
      try {
        await StorageService.saveProducts(allProds);
        if (onUpdateProducts) onUpdateProducts(allProds);
        window.dispatchEvent(new CustomEvent("shamon_price_updated"));
        setSaveStatus(`Saved price for ${feedId}`);
        if (onRefreshCatalog) onRefreshCatalog();
        fetchAdminData();
        setTimeout(() => setSaveStatus(null), 2500);
      } catch (err) {
        console.error(err);
        alert("Failed to save price. Please check your connection and try again.");
      }
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) return;
    setSendingBroadcast(true);
    setBroadcastSuccess(null);

    try {
      localStorage.setItem(
        "shamon_poultry_latest_broadcast",
        JSON.stringify({
          subject: broadcastSubject.trim(),
          message: broadcastMessage.trim(),
          audience: broadcastAudience,
          timestamp: new Date().toISOString(),
        })
      );
      window.dispatchEvent(new CustomEvent("shamon_price_updated"));

      // NOTE: this records the broadcast locally but does not actually send
      // email/SMS/WhatsApp — that requires wiring a real delivery provider
      // (e.g. a Supabase Edge Function calling an email/SMS API) which isn't
      // set up yet. Wire that up before relying on this to reach customers.
      setBroadcastSuccess(`Broadcast saved. Recipients: ${customers.length} customers on file.`);
      setBroadcastSubject("");
      setBroadcastMessage("");
    } catch (err: any) {
      alert(err.message || "Failed to save broadcast.");
    } finally {
      setSendingBroadcast(false);
    }
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    // Bank details are intentionally static store configuration (see
    // src/data/initialData.ts) rather than admin-editable Supabase data —
    // this local edit is a working draft for this session only. To make it
    // stick across reloads/devices, wire editBank up to a small "settings"
    // table or update DEPOT_INFO in the source and redeploy.
    setSaveStatus("Bank details updated for this session.");
    setTimeout(() => setSaveStatus(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl border border-emerald-100 overflow-hidden my-2 sm:my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-emerald-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center text-emerald-200 shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">SHAMONS Admin Portal</h3>
                <span className="bg-emerald-800 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Kaltungo
                </span>
              </div>
              <p className="text-xs text-emerald-300">
                Inventory Tracking • Stock Requests • Live Prices • Orders
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={handleAdminLogout}
                className="flex items-center gap-1.5 text-emerald-300 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-800 hover:border-emerald-700 transition cursor-pointer"
                title="Sign out of admin"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-emerald-400 hover:text-white p-1.5 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* If Not Authenticated -> Login Form */}
        {!isAuthenticated ? (
          <div className="p-6 sm:p-10 max-w-md mx-auto text-center w-full">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7" />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-1">Admin Sign In</h4>
            <p className="text-xs text-gray-500 mb-6">
              Sign in with your shamonsstaff account to manage stock inventory, customer requests, and prices.
            </p>
            {checkingSession ? (
              <p className="text-xs text-gray-400">Checking session…</p>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                {authError && (
                  <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200 text-left">
                    {authError}
                  </div>
                )}
                <input
                  type="email"
                  required
                  autoFocus
                  autoComplete="username"
                  placeholder="Admin email address"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-4 py-3 text-sm border border-gray-300 bg-white text-gray-950 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden placeholder:text-gray-400 shadow-inner"
                />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="Password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-4 py-3 text-sm border border-gray-300 bg-white text-gray-950 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden placeholder:text-gray-400 shadow-inner"
                />
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-xs transition cursor-pointer"
                >
                  {authLoading ? "Signing in…" : "Access Admin Dashboard"}
                </button>
                <div className="text-[11px] text-gray-400">
                  @Yilmitech
                </div>
              </form>
            )}
          </div>
        ) : (
          /* Authenticated Admin Dashboard */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Save Status Toast */}
            {saveStatus && (
              <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 text-center animate-fade-in flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{saveStatus}</span>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="bg-gray-100 px-3 sm:px-4 py-2 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "overview"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-gray-700 hover:text-gray-900 bg-white"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Overview</span>
                </button>
                <button
                  onClick={() => setActiveTab("inventory")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "inventory"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-gray-700 hover:text-gray-900 bg-white"
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Inventory Tracking</span>
                </button>
                <button
                  onClick={() => setActiveTab("analytics")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "analytics"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-gray-700 hover:text-gray-900 bg-white"
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Price Analytics</span>
                </button>
                <button
                  onClick={() => setActiveTab("bookings")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 relative ${
                    activeTab === "bookings"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-gray-700 hover:text-gray-900 bg-white"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Requests &amp; Orders ({bookings.length})</span>
                  {bookings.filter(isPendingOrder).length > 0 && (
                    <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                      {bookings.filter(isPendingOrder).length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("prices")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "prices"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-gray-700 hover:text-gray-900 bg-white"
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Price Manager</span>
                </button>
                <button
                  onClick={() => setActiveTab("customers")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "customers"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-gray-700 hover:text-gray-900 bg-white"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Customers ({customers.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab("broadcast")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "broadcast"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-gray-700 hover:text-gray-900 bg-white"
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Bulk Alerts</span>
                </button>
                <button
                  onClick={() => setActiveTab("bank")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "bank"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-gray-700 hover:text-gray-900 bg-white"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Bank Info</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDownloadModal(true)}
                  className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-100 hover:text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1.5 border border-emerald-800 cursor-pointer"
                  title="Download Current Inventory & Pending Bookings Report (CSV)"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download Report</span>
                </button>
                <button
                  onClick={() => setShowRestockModal(true)}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ New Stock Batch</span>
                </button>
                <button
                  onClick={fetchAdminData}
                  className="p-1.5 text-gray-500 hover:text-emerald-700 rounded-md bg-white border border-gray-200 cursor-pointer"
                  title="Refresh Data"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingData ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* TAB CONTENTS */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50">
              {/* TAB 0: CLEAN OVERVIEW DASHBOARD */}
              {activeTab === "overview" && (
                <div className="space-y-6 max-w-5xl">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Overview</h3>
                    <p className="text-sm text-gray-500">
                      {new Date().toLocaleDateString("en-US", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                  </div>

                  {/* Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      {
                        label: "Total Revenue",
                        icon: <DollarSign className="w-5 h-5 text-indigo-600" />,
                        iconBg: "bg-indigo-100",
                        value: `₦${Math.round(overviewStats.revenueThis).toLocaleString()}`,
                        change: overviewStats.revenueChange,
                        goodDirection: "up" as const,
                      },
                      {
                        label: "Orders",
                        icon: <ShoppingBag className="w-5 h-5 text-amber-600" />,
                        iconBg: "bg-amber-100",
                        value: overviewStats.ordersThis.toLocaleString(),
                        change: overviewStats.ordersChange,
                        goodDirection: "up" as const,
                      },
                      {
                        label: "New Customers",
                        icon: <UserPlus className="w-5 h-5 text-teal-600" />,
                        iconBg: "bg-teal-100",
                        value: overviewStats.customersThis.toLocaleString(),
                        change: overviewStats.customersChange,
                        goodDirection: "up" as const,
                      },
                      {
                        label: "Cancellation Rate",
                        icon: <RotateCcw className="w-5 h-5 text-rose-600" />,
                        iconBg: "bg-rose-100",
                        value: `${overviewStats.refundRateThis.toFixed(1)}%`,
                        change: overviewStats.refundRateChange,
                        goodDirection: "down" as const,
                      },
                    ].map((card) => {
                      const isGood =
                        card.change === null
                          ? null
                          : card.goodDirection === "up"
                          ? card.change >= 0
                          : card.change <= 0;
                      return (
                        <div
                          key={card.label}
                          className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                              {card.icon}
                            </div>
                            {card.change !== null && (
                              <span
                                className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-0.5 ${
                                  isGood
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-rose-50 text-rose-600"
                                }`}
                              >
                                {card.change >= 0 ? (
                                  <ArrowUpRight className="w-3 h-3" />
                                ) : (
                                  <ArrowDownRight className="w-3 h-3" />
                                )}
                                {Math.abs(card.change).toFixed(1)}%
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 mb-0.5">{card.label}</div>
                          <div className="text-2xl font-black text-gray-900 tracking-tight">{card.value}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Weekly Sales Chart */}
                  <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-xs">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="font-bold text-gray-900">Weekly sales</h4>
                      <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                        Last 7 days
                      </span>
                    </div>
                    {(() => {
                      const values = overviewStats.weeklySales.map((d) => d.value);
                      const max = Math.max(1, ...values);
                      return (
                        <div className="flex items-end justify-between gap-2 sm:gap-4 h-48">
                          {overviewStats.weeklySales.map((day, i) => {
                            const heightPct = Math.max(4, (day.value / max) * 100);
                            const isTopHalf = day.value >= max * 0.5;
                            return (
                              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                                <div
                                  className={`w-full max-w-10 rounded-t-lg transition-all ${
                                    isTopHalf ? "bg-emerald-600" : "bg-emerald-200"
                                  }`}
                                  style={{ height: `${heightPct}%` }}
                                  title={`₦${Math.round(day.value).toLocaleString()}`}
                                />
                                <span className="text-xs text-gray-500 font-medium">{day.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                    {overviewStats.weeklySales.every((d) => d.value === 0) && (
                      <p className="text-xs text-gray-400 text-center mt-4">
                        No completed sales in the last 7 days yet — this fills in as orders are approved/sold.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 1: INVENTORY TRACKING */}
              {activeTab === "inventory" && (
                <div className="space-y-6">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-emerald-100 shadow-xs overflow-hidden">
                      <div className="text-xs font-bold text-gray-500 flex items-center gap-1 mb-1">
                        <Package className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">Birds in Pens</span>
                      </div>
                      <div className="text-lg sm:text-2xl font-black text-emerald-950 truncate tracking-tight">
                        {birds.reduce(
                          (acc, b) => acc + b.ageOptions.reduce((a, opt) => a + (opt.stockCount || 0), 0),
                          0
                        )}{" "}
                        <span className="text-xs text-gray-500 font-medium">birds</span>
                      </div>
                      <div className="text-[10px] text-emerald-700 mt-1 font-semibold truncate">
                        Day-Old DOC, Full Breeded &amp; Layers
                      </div>
                    </div>
                    <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-emerald-100 shadow-xs overflow-hidden">
                      <div className="text-xs font-bold text-gray-500 flex items-center gap-1 mb-1">
                        <Package className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">Feed in Stock</span>
                      </div>
                      <div className="text-lg sm:text-2xl font-black text-emerald-950 truncate tracking-tight">
                        {feeds.reduce((acc, f) => acc + (f.stockBags || 0), 0)}{" "}
                        <span className="text-xs text-gray-500 font-medium">bags</span>
                      </div>
                      <div className="text-[10px] text-amber-700 mt-1 font-semibold truncate">
                        Chikun &amp; Ultima (25kg bags)
                      </div>
                    </div>
                    <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-emerald-100 shadow-xs overflow-hidden">
                      <div className="text-xs font-bold text-gray-500 flex items-center gap-1 mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">Total Sold Units</span>
                      </div>
                      <div className="text-lg sm:text-2xl font-black text-blue-950 truncate tracking-tight">
                        {summary?.totalUnitsSold ??
                          (bookings.reduce((sum, b) => {
                            if (isCancelledOrder(b)) return sum;
                            if (isSoldOrder(b) || isApprovedOrder(b)) {
                              return (
                                sum +
                                (b.items || []).reduce((acc, it) => acc + (Number(it.quantity) || 1), 0)
                              );
                            }
                            return sum;
                          }, 0) +
                            birds.reduce(
                              (acc, b) => acc + b.ageOptions.reduce((a, opt) => a + (opt.soldCount || 0), 0),
                              0
                            ) +
                            feeds.reduce((acc, f) => acc + (f.soldBags || 0), 0))}{" "}
                        <span className="text-xs text-gray-500 font-medium">units</span>
                      </div>
                      <div className="text-[10px] text-blue-700 mt-1 font-semibold truncate">
                        {bookings.filter((b) => isSoldOrder(b) || isApprovedOrder(b)).length} active / fulfilled orders
                      </div>
                    </div>
                    <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-emerald-100 shadow-xs overflow-hidden">
                      <div className="text-xs font-bold text-gray-500 flex items-center gap-1 mb-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">Pending Requests</span>
                      </div>
                      <div className="text-lg sm:text-2xl font-black text-amber-900 truncate tracking-tight">
                        {(summary as any)?.totalPendingRequests ?? bookings.filter(isPendingOrder).length}
                      </div>
                      <div className="text-[10px] text-amber-600 mt-1 font-semibold truncate">
                        Awaiting Admin Approval
                      </div>
                    </div>
                  </div>

                  {/* Stock Management Cards per Product */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                          <Package className="w-4 h-4 text-emerald-600" />
                          Live Bird Stocks (Day-Old DOC, Full Breeded, Layers)
                        </h4>
                        <p className="text-xs text-gray-500">
                          Track pen counts, update new batch quantities, and mark in-stock / out-of-stock.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownloadReport("inventory")}
                          className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-lg border border-gray-300 flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Export Full Inventory (Birds & Feeds) as CSV"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Export Inventory CSV</span>
                        </button>
                        <button
                          onClick={() => {
                            setRestockItemType("bird");
                            setShowRestockModal(true);
                          }}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200 flex items-center gap-1 cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>+ Restock Birds</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {birds.map((bird) => (
                        <div
                          key={bird.id}
                          className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-3"
                        >
                          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <div>
                              <span className="font-bold text-gray-900 text-sm">{bird.name}</span>
                              <div className="text-[11px] text-gray-500">{bird.breed}</div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md border border-emerald-100">
                              {bird.category === "day-old"
                                ? "Day-Old (DOC)"
                                : bird.category === "full-breeded"
                                ? "Full Breeded"
                                : "Layers"}
                            </span>
                          </div>

                          <div className="space-y-3">
                            {bird.ageOptions.map((opt) => {
                              const key = `${bird.id}-${opt.ageId}`;
                              const currentVal = editingStockState[key] || {
                                stockCount: opt.stockCount || 0,
                                soldCount: opt.soldCount || 0,
                                inStock: opt.inStock,
                              };
                              const isLowStock = currentVal.stockCount < 30 && currentVal.stockCount > 0;
                              const isOutOfStock = currentVal.stockCount <= 0 || !currentVal.inStock;

                              return (
                                <div
                                  key={opt.ageId}
                                  className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2 text-xs"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-gray-800">{opt.ageLabel}</span>
                                    <div className="flex items-center gap-1">
                                      {isOutOfStock ? (
                                        <span className="bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                          Out of Stock
                                        </span>
                                      ) : isLowStock ? (
                                        <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                          <AlertTriangle className="w-3 h-3" /> Low Stock
                                        </span>
                                      ) : (
                                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                          In Stock (Healthy)
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-[10px] text-gray-500 font-semibold block mb-0.5">
                                        Current Stock (Birds):
                                      </label>
                                      <input
                                        type="number"
                                        min={0}
                                        value={currentVal.stockCount}
                                        onChange={(e) => {
                                          const val = Math.max(0, parseInt(e.target.value) || 0);
                                          setEditingStockState((prev) => ({
                                            ...prev,
                                            [key]: {
                                              ...currentVal,
                                              stockCount: val,
                                              inStock: val > 0,
                                            },
                                          }));
                                        }}
                                        className="w-full p-1.5 bg-white border border-gray-300 rounded-md font-bold text-emerald-950 text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-gray-500 font-semibold block mb-0.5">
                                        Total Sold (Fulfilled):
                                      </label>
                                      <input
                                        type="number"
                                        min={0}
                                        value={currentVal.soldCount}
                                        onChange={(e) => {
                                          const val = Math.max(0, parseInt(e.target.value) || 0);
                                          setEditingStockState((prev) => ({
                                            ...prev,
                                            [key]: {
                                              ...currentVal,
                                              soldCount: val,
                                            },
                                          }));
                                        }}
                                        className="w-full p-1.5 bg-white border border-gray-300 rounded-md font-bold text-blue-950 text-sm"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between pt-1">
                                    <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={currentVal.inStock}
                                        onChange={(e) =>
                                          setEditingStockState((prev) => ({
                                            ...prev,
                                            [key]: { ...currentVal, inStock: e.target.checked },
                                          }))
                                        }
                                        className="text-emerald-600 rounded-sm cursor-pointer"
                                      />
                                      <span className="font-semibold text-gray-700">Available to Order</span>
                                    </label>

                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setRestockItemType("bird");
                                          setRestockProductId(bird.id);
                                          setRestockAgeId(opt.ageId);
                                          setShowRestockModal(true);
                                        }}
                                        className="px-2 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer border border-emerald-200"
                                      >
                                        <PlusCircle className="w-3 h-3 text-emerald-600" />
                                        <span>+ Add Batch</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDirectStockAdjust(
                                            "bird",
                                            bird.id,
                                            opt.ageId,
                                            opt.stockCount,
                                            opt.soldCount,
                                            opt.inStock
                                          )
                                        }
                                        className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer shadow-xs"
                                      >
                                        <Save className="w-3 h-3" />
                                        <span>Update</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Feed Stocks Management */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                          <Package className="w-4 h-4 text-amber-600" />
                          Poultry Feeds Inventory (Chikun &amp; Ultima)
                        </h4>
                        <p className="text-xs text-gray-500">
                          Track warehouse 25kg bags, update restocks, and monitor sales.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setRestockItemType("feed");
                          setShowRestockModal(true);
                        }}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-lg border border-amber-200 flex items-center gap-1 cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>+ Restock Feeds</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {feeds.map((feed) => {
                        const key = `${feed.id}-feed`;
                        const currentVal = editingStockState[key] || {
                          stockCount: feed.stockBags || 0,
                          soldCount: feed.soldBags || 0,
                          inStock: feed.inStock,
                        };
                        const isLowStock = currentVal.stockCount < 10 && currentVal.stockCount > 0;
                        const isOutOfStock = currentVal.stockCount <= 0 || !currentVal.inStock;

                        return (
                          <div
                            key={feed.id}
                            className="bg-white rounded-xl border border-gray-200 p-3 shadow-xs space-y-2.5 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-gray-900">{feed.name}</span>
                              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-sm font-bold">
                                {feed.brand}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-[11px] text-gray-500 font-medium">Status:</span>
                              {isOutOfStock ? (
                                <span className="bg-red-100 text-red-800 text-[10px] px-1.5 py-0.5 rounded-sm font-bold">
                                  Out of Stock
                                </span>
                              ) : isLowStock ? (
                                <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-sm font-bold">
                                  Low Stock
                                </span>
                              ) : (
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded-sm font-bold">
                                  In Stock
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-1.5">
                              <div>
                                <label className="text-[10px] text-gray-500 font-semibold block mb-0.5">
                                  Bags in Store:
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  value={currentVal.stockCount}
                                  onChange={(e) => {
                                    const val = Math.max(0, parseInt(e.target.value) || 0);
                                    setEditingStockState((prev) => ({
                                      ...prev,
                                      [key]: {
                                        ...currentVal,
                                        stockCount: val,
                                        inStock: val > 0,
                                      },
                                    }));
                                  }}
                                  className="w-full p-1.5 bg-white border border-gray-300 rounded-md font-bold text-emerald-950 text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-500 font-semibold block mb-0.5">
                                  Bags Sold:
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  value={currentVal.soldCount}
                                  onChange={(e) => {
                                    const val = Math.max(0, parseInt(e.target.value) || 0);
                                    setEditingStockState((prev) => ({
                                      ...prev,
                                      [key]: {
                                        ...currentVal,
                                        soldCount: val,
                                      },
                                    }));
                                  }}
                                  className="w-full p-1.5 bg-white border border-gray-300 rounded-md font-bold text-blue-950 text-xs"
                                />
                              </div>
                            </div>

                            <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                              <input
                                type="checkbox"
                                checked={currentVal.inStock}
                                onChange={(e) =>
                                  setEditingStockState((prev) => ({
                                    ...prev,
                                    [key]: { ...currentVal, inStock: e.target.checked },
                                  }))
                                }
                                className="text-emerald-600 rounded-sm cursor-pointer"
                              />
                              <span className="font-semibold text-gray-700">Available to Order</span>
                            </label>

                            <button
                              type="button"
                              onClick={() =>
                                handleDirectStockAdjust(
                                  "feed",
                                  feed.id,
                                  undefined,
                                  feed.stockBags,
                                  feed.soldBags,
                                  feed.inStock
                                )
                              }
                              className="w-full py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-md text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Save className="w-3 h-3" />
                              <span>Update Feed Stock</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stock Movement History & Restock Logs */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-emerald-600" />
                        <h4 className="text-sm font-bold text-gray-900">
                          Stock Movement &amp; Restock History Log
                        </h4>
                      </div>
                      <span className="text-xs text-gray-500 font-medium">
                        {stockLogs.length} logged movements
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                          <tr>
                            <th className="p-2.5">Date / Time</th>
                            <th className="p-2.5">Item</th>
                            <th className="p-2.5">Type</th>
                            <th className="p-2.5">Change</th>
                            <th className="p-2.5">Stock After</th>
                            <th className="p-2.5">Details / Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {stockLogs.slice(0, 10).map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                              <td className="p-2.5 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                                {log.timestamp}
                              </td>
                              <td className="p-2.5 font-bold text-gray-900 whitespace-nowrap">
                                {log.itemName}
                                {log.detailLabel && (
                                  <span className="block text-[10px] text-gray-500 font-normal">
                                    {log.detailLabel}
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                    log.changeType === "restock"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : log.changeType === "sold"
                                      ? "bg-blue-100 text-blue-800"
                                      : log.changeType === "return"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {log.changeType}
                                </span>
                              </td>
                              <td className="p-2.5 font-bold whitespace-nowrap">
                                {log.quantityChanged > 0 ? (
                                  <span className="text-emerald-600 flex items-center gap-0.5">
                                    <ArrowUpRight className="w-3 h-3" /> +{log.quantityChanged}
                                  </span>
                                ) : (
                                  <span className="text-red-600 flex items-center gap-0.5">
                                    <ArrowDownRight className="w-3 h-3" /> {log.quantityChanged}
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 font-mono font-bold text-gray-900">
                                {log.newStock}
                              </td>
                              <td className="p-2.5 text-gray-600 text-[11px] max-w-xs truncate">
                                {log.note || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PRICE & VALUATION ANALYTICS */}
              {activeTab === "analytics" && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                    <div>
                      <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                        <span>Farm Inventory &amp; Price Analytics</span>
                      </h4>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Live stock capital valuation, half-bag vs. full-bag margin metrics, and carton savings analysis.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadReport("price_analytics")}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Export Price Analytics (CSV)</span>
                      </button>
                    </div>
                  </div>

                  {/* Top KPI Cards */}
                  {priceAnalytics && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                      <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs overflow-hidden">
                        <div className="text-xs font-bold text-gray-500 flex items-center gap-1.5 mb-1">
                          <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="truncate">Total Stock Valuation</span>
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-emerald-950 tracking-tight break-words">
                          ₦{priceAnalytics.totalCombinedValuation.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-1">
                          Live poultry + Feed warehouse assets
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-xs overflow-hidden">
                        <div className="text-xs font-bold text-gray-500 flex items-center gap-1.5 mb-1">
                          <Package className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="truncate">Live Birds Capital</span>
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-emerald-900 tracking-tight break-words">
                          ₦{priceAnalytics.totalBirdValuation.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-emerald-700 mt-1 font-semibold">
                          Across {priceAnalytics.totalBirdsCount.toLocaleString()} birds in pens
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-xs overflow-hidden">
                        <div className="text-xs font-bold text-gray-500 flex items-center gap-1.5 mb-1">
                          <Package className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="truncate">Feed Bags Capital</span>
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-amber-950 tracking-tight break-words">
                          ₦{priceAnalytics.totalFeedValuation.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-amber-800 mt-1 font-semibold">
                          Across {priceAnalytics.totalFeedBags.toLocaleString()} bags in store
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-xs overflow-hidden">
                        <div className="text-xs font-bold text-gray-500 flex items-center gap-1.5 mb-1">
                          <BarChart2 className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="truncate">Average Rates</span>
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-xs sm:text-sm font-black text-gray-900 truncate">
                            DOC/Bird: <span className="text-emerald-700">₦{priceAnalytics.avgBirdPrice.toLocaleString()}</span>
                          </div>
                          <div className="text-xs sm:text-sm font-black text-gray-900 truncate">
                            Feed/Bag: <span className="text-amber-800">₦{priceAnalytics.avgFeedBagPrice.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5 font-medium truncate">
                          Depot standard prices in Kaltungo
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section 1: Poultry Feeds Margin Analytics */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-amber-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h5 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                          <Package className="w-4 h-4 text-amber-600" />
                          <span>Poultry Feeds: 25kg Full Bag vs. 12.5kg Half-Bag Margin Analytics</span>
                        </h5>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Compare per-kg retail rates and margin gains when customers buy half bags.
                        </p>
                      </div>
                      <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-full w-fit">
                        {feeds.length} Feed Products
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                          <tr>
                            <th className="p-3">Feed Product &amp; Brand</th>
                            <th className="p-3 text-center">Stock</th>
                            <th className="p-3 text-right">Full 25kg Bag</th>
                            <th className="p-3 text-right">Half 12.5kg Bag</th>
                            <th className="p-3 text-right">Rate / KG (Full)</th>
                            <th className="p-3 text-right">Rate / KG (Half)</th>
                            <th className="p-3 text-center">Half-Bag Margin</th>
                            <th className="p-3 text-right">Total Valuation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {priceAnalytics?.feeds.map((feed) => {
                            const fullBag = feed.pricePerBag;
                            const halfBag = feed.pricePerHalfBag;
                            const fullKgRate = feed.pricePerKgFull;
                            const halfKgRate = feed.pricePerKgHalf;
                            const premiumPercent = feed.halfBagPremiumPercent;
                            const premiumNaira = halfBag * 2 - fullBag;

                            return (
                              <tr key={feed.id} className="hover:bg-amber-50/30 transition">
                                <td className="p-3">
                                  <div className="font-bold text-gray-900 text-sm">{feed.name}</div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded-sm">
                                      {feed.brand}
                                    </span>
                                    <span className="text-[11px] text-gray-500">{feed.variant}</span>
                                  </div>
                                </td>
                                <td className="p-3 text-center">
                                  <span className="font-black text-gray-900">{feed.stockBags}</span>
                                  <span className="text-gray-500 text-[10px] block font-medium">
                                    ({feed.stockBags * (feed.weightKg || 25)} kg)
                                  </span>
                                </td>
                                <td className="p-3 text-right font-mono font-bold text-gray-900 text-sm">
                                  ₦{fullBag.toLocaleString()}
                                </td>
                                <td className="p-3 text-right font-mono font-bold text-emerald-800 text-sm">
                                  ₦{halfBag.toLocaleString()}
                                </td>
                                <td className="p-3 text-right font-mono text-gray-600">
                                  ₦{fullKgRate}/kg
                                </td>
                                <td className="p-3 text-right font-mono text-emerald-700 font-bold">
                                  ₦{halfKgRate}/kg
                                </td>
                                <td className="p-3 text-center">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                                    +{premiumPercent}% (+₦{premiumNaira.toLocaleString()})
                                  </span>
                                </td>
                                <td className="p-3 text-right font-mono font-black text-gray-900 text-sm">
                                  ₦{feed.totalValuation.toLocaleString()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: REQUESTS & ORDERS */}
              {activeTab === "bookings" && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 flex-1 max-w-sm">
                      <Search className="w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search ref, customer name, phone..."
                        value={bookingSearch}
                        onChange={(e) => setBookingSearch(e.target.value)}
                        className="w-full text-xs border-none focus:outline-hidden text-gray-900 placeholder:text-gray-400 bg-transparent font-medium"
                      />
                    </div>
                    <div className="flex items-center gap-1 text-xs overflow-x-auto">
                      <button
                        onClick={() => setBookingFilterStatus("all")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                          bookingFilterStatus === "all"
                            ? "bg-emerald-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        All ({bookings.length})
                      </button>
                      <button
                        onClick={() => setBookingFilterStatus("pending")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                          bookingFilterStatus === "pending"
                            ? "bg-amber-600 text-white"
                            : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                        }`}
                      >
                        Pending ({bookings.filter(isPendingOrder).length})
                      </button>
                      <button
                        onClick={() => setBookingFilterStatus("approved")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                          bookingFilterStatus === "approved" || bookingFilterStatus === "confirmed"
                            ? "bg-emerald-700 text-white"
                            : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                        }`}
                      >
                        Approved ({bookings.filter(isApprovedOrder).length})
                      </button>
                      <button
                        onClick={() => setBookingFilterStatus("sold")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                          bookingFilterStatus === "sold" || bookingFilterStatus === "completed"
                            ? "bg-blue-600 text-white"
                            : "bg-blue-50 text-blue-800 hover:bg-blue-100"
                        }`}
                      >
                        Sold ({bookings.filter(isSoldOrder).length})
                      </button>
                      <div className="h-4 w-px bg-gray-300 mx-1" />
                      <button
                        onClick={() =>
                          handleDownloadReport(
                            bookingFilterStatus === "pending"
                              ? "pending"
                              : bookingFilterStatus === "all"
                              ? "consolidated"
                              : "all_orders"
                          )
                        }
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200 flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Export CSV</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {bookings
                      .filter((b) => {
                        if (bookingFilterStatus === "pending") {
                          if (!isPendingOrder(b)) return false;
                        } else if (bookingFilterStatus === "approved") {
                          if (!isApprovedOrder(b)) return false;
                        } else if (bookingFilterStatus === "sold") {
                          if (!isSoldOrder(b)) return false;
                        }
                        if (bookingSearch) {
                          const s = bookingSearch.toLowerCase();
                          return (
                            (b.bookingRef || "").toLowerCase().includes(s) ||
                            (b.customerName || "").toLowerCase().includes(s) ||
                            (b.phone || "").includes(s)
                          );
                        }
                        return true;
                      })
                      .map((booking) => {
                        const isPending = isPendingOrder(booking);
                        const isApproved = isApprovedOrder(booking);
                        const isSold = isSoldOrder(booking);
                        const isCancelled = isCancelledOrder(booking);

                        return (
                          <div
                            key={booking.id}
                            className={`bg-white rounded-xl border p-4 shadow-xs space-y-3 text-xs transition ${
                              isPending
                                ? "border-amber-300 ring-1 ring-amber-100"
                                : isApproved
                                ? "border-emerald-300"
                                : isSold
                                ? "border-blue-200 bg-slate-50/50"
                                : "border-gray-200 opacity-75"
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-emerald-950 text-sm bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-mono">
                                  {booking.bookingRef}
                                </span>
                                <span className="text-gray-500 text-[11px]">{booking.createdAt}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {isPending && (
                                  <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full font-bold text-[11px] flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-amber-600" /> Pending Approval
                                  </span>
                                )}
                                {isApproved && (
                                  <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-full font-bold text-[11px] flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approved • In Stock
                                  </span>
                                )}
                                {isSold && (
                                  <span className="bg-blue-100 text-blue-900 border border-blue-300 px-2.5 py-0.5 rounded-full font-bold text-[11px] flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3 text-blue-600" /> Sold &amp; Fulfilled
                                  </span>
                                )}
                                {isCancelled && (
                                  <span className="bg-red-100 text-red-900 border border-red-200 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                                    Cancelled
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-700">
                              <div>
                                <div><strong>Customer:</strong> {booking.customerName}</div>
                                <div><strong>Phone:</strong> {booking.phone}</div>
                              </div>
                              <div>
                                <div><strong>Location:</strong> {booking.deliveryOrPickupLocation}</div>
                                <div><strong>Date:</strong> {booking.preferredDate}</div>
                              </div>
                            </div>

                            <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 space-y-1">
                              {booking.items.map((it, idx) => (
                                <div key={idx} className="flex justify-between text-gray-800">
                                  <span><strong>{it.quantity}x</strong> {it.name} ({it.detailLabel})</span>
                                  <span className="font-semibold text-emerald-950">₦{it.subtotal.toLocaleString()}</span>
                                </div>
                              ))}
                              <div className="border-t border-gray-200 mt-1.5 pt-1.5 flex justify-between font-black text-emerald-950 text-sm">
                                <span>Total Booking:</span>
                                <span>₦{booking.totalAmount.toLocaleString()}</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setAdminReceiptBooking(booking)}
                                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition border border-emerald-200"
                                >
                                  <FileCheck2 className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>Receipt</span>
                                </button>
                                {booking.paymentStatus !== "payment_confirmed" && !isCancelled && (
                                  <button
                                    type="button"
                                    onClick={() => handleAdminConfirmPayment(booking.id || booking.bookingRef || booking.bookingCode || "")}
                                    className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition shadow-2xs"
                                  >
                                    <CreditCard className="w-3.5 h-3.5" />
                                    <span>Verify Payment</span>
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {isPending && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleApproveBooking(booking.id || booking.bookingRef || booking.bookingCode || "")}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Approve</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMarkAsSold(booking.id || booking.bookingRef || booking.bookingCode || "")}
                                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                                    >
                                      <ShieldCheck className="w-3.5 h-3.5" />
                                      <span>Mark Sold</span>
                                    </button>
                                  </>
                                )}
                                {isApproved && (
                                  <button
                                    type="button"
                                    onClick={() => handleMarkAsSold(booking.id || booking.bookingRef || booking.bookingCode || "")}
                                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span>Complete Sale</span>
                                  </button>
                                )}
                                {!isCancelled && !isSold && (
                                  <button
                                    type="button"
                                    onClick={() => handleCancelBooking(booking.id || booking.bookingRef || booking.bookingCode || "")}
                                    className="px-2.5 py-1.5 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-700 font-semibold rounded-lg text-xs cursor-pointer transition border border-gray-200"
                                  >
                                    Reject
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* TAB 4: PRICE MANAGER */}
              {activeTab === "prices" && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      Live Bird Prices (Day-Old DOC, Full Breeded, Layers)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {birds.map((bird) => (
                        <div key={bird.id} className="bg-white rounded-xl border border-emerald-100 p-4 shadow-xs space-y-3">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <span className="font-bold text-gray-900 text-base">{bird.name}</span>
                            <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-md">
                              {bird.breed}
                            </span>
                          </div>
                          <div className="space-y-3">
                            {bird.ageOptions.map((opt) => {
                              const key = `${bird.id}-${opt.ageId}`;
                              const currentVal = editingBirdPrices[key] || {
                                pricePerBird: opt.pricePerBird,
                                pricePerCarton: opt.pricePerCarton || 0,
                                inStock: opt.inStock,
                              };
                              return (
                                <div key={opt.ageId} className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2 text-xs">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-gray-800">{opt.ageLabel}</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-[10px] text-gray-500 block mb-0.5 font-semibold">
                                        Price / Bird (₦)
                                      </label>
                                      <input
                                        type="number"
                                        value={currentVal.pricePerBird}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value) || 0;
                                          setEditingBirdPrices((prev) => ({
                                            ...prev,
                                            [key]: { ...currentVal, pricePerBird: val },
                                          }));
                                        }}
                                        className="w-full p-1.5 bg-white border border-gray-300 rounded-md font-bold text-emerald-900"
                                      />
                                    </div>
                                    {opt.pricePerCarton !== undefined && (
                                      <div>
                                        <label className="text-[10px] text-gray-500 block mb-0.5 font-semibold">
                                          Price / Carton (₦)
                                        </label>
                                        <input
                                          type="number"
                                          value={currentVal.pricePerCarton}
                                          onChange={(e) => {
                                            const val = parseInt(e.target.value) || 0;
                                            setEditingBirdPrices((prev) => ({
                                              ...prev,
                                              [key]: { ...currentVal, pricePerCarton: val },
                                            }));
                                          }}
                                          className="w-full p-1.5 bg-white border border-gray-300 rounded-md font-bold text-emerald-900"
                                        />
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveBirdPrice(bird.id, opt.ageId)}
                                    className="w-full py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-md text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <Save className="w-3 h-3" />
                                    <span>Save Bird Price</span>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      Poultry Feeds Price Matrix (Full 25kg &amp; Half 12.5kg Bags)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                      {feeds.map((feed) => {
                        const currentVal = editingFeedPrices[feed.id] || {
                          pricePerBag: feed.pricePerBag,
                          pricePerHalfBag: feed.pricePerHalfBag || Math.round(feed.pricePerBag / 2 + 250),
                          inStock: feed.inStock,
                        };
                        return (
                          <div key={feed.id} className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-xs space-y-3 text-xs">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                              <div>
                                <span className="font-bold text-gray-900 text-sm">{feed.name}</span>
                                <div className="text-[10px] text-gray-500">{feed.variant}</div>
                              </div>
                              <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-sm font-bold">
                                {feed.brand}
                              </span>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <label className="text-[10px] text-gray-500 font-semibold block mb-0.5">
                                  25kg Full Bag (₦):
                                </label>
                                <input
                                  type="number"
                                  value={currentVal.pricePerBag}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    setEditingFeedPrices((prev) => ({
                                      ...prev,
                                      [feed.id]: {
                                        ...currentVal,
                                        pricePerBag: val,
                                        pricePerHalfBag: currentVal.pricePerHalfBag || Math.round(val / 2 + 250),
                                      },
                                    }));
                                  }}
                                  className="w-full p-1.5 bg-white border border-gray-300 rounded-md font-bold text-emerald-900 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-emerald-800 font-semibold block mb-0.5">
                                  12.5kg Half Bag (₦):
                                </label>
                                <input
                                  type="number"
                                  value={currentVal.pricePerHalfBag}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    setEditingFeedPrices((prev) => ({
                                      ...prev,
                                      [feed.id]: { ...currentVal, pricePerHalfBag: val },
                                    }));
                                  }}
                                  className="w-full p-1.5 bg-white border border-gray-300 rounded-md font-bold text-emerald-900 text-sm"
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSaveFeedPrice(feed.id)}
                              className="w-full py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-md text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition shadow-2xs"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Save Feed Prices</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: REGISTERED CUSTOMERS */}
              {activeTab === "customers" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        Registered Customers in Kaltungo ({customers.length})
                      </h4>
                      <p className="text-xs text-gray-500">
                        Customers opted-in for new batch alerts and price changes.
                      </p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                          <tr>
                            <th className="p-3">Customer Name</th>
                            <th className="p-3">Phone</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Area / Address</th>
                            <th className="p-3">Preferences</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {customers.map((c) => (
                            <tr key={c.id} className="hover:bg-gray-50">
                              <td className="p-3 font-semibold text-gray-900">{c.name}</td>
                              <td className="p-3 font-mono font-bold text-gray-900 text-xs">{c.phone}</td>
                              <td className="p-3 text-gray-700">{c.email || "-"}</td>
                              <td className="p-3 text-gray-700">{c.address || "Kaltungo"}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-1.5">
                                  {c.notifyNewStock && (
                                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded-sm font-semibold">
                                      Stock Alerts
                                    </span>
                                  )}
                                  {c.notifyPriceUpdates && (
                                    <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded-sm font-semibold">
                                      Price Alerts
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: BULK ALERTS */}
              {activeTab === "broadcast" && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl border border-emerald-100 p-5 shadow-xs">
                    <div className="flex items-center gap-2 font-bold text-gray-900 text-sm mb-1">
                      <Send className="w-4 h-4 text-emerald-600" />
                      <span>Compose Bulk Announcement</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">
                      Send bulk notifications/email updates to all registered customers in Kaltungo.
                    </p>
                    {broadcastSuccess && (
                      <div className="mb-4 bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-200 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{broadcastSuccess}</span>
                      </div>
                    )}
                    <form onSubmit={handleSendBroadcast} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Target Audience:
                        </label>
                        <select
                          value={broadcastAudience}
                          onChange={(e: any) => setBroadcastAudience(e.target.value)}
                          className="w-full text-xs p-2.5 bg-white text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden shadow-2xs"
                        >
                          <option value="all">All Registered Customers ({customers.length})</option>
                          <option value="stock_subscribers">
                            Stock Alert Subscribers Only ({customers.filter((c) => c.notifyNewStock).length})
                          </option>
                          <option value="price_subscribers">
                            Price Update Subscribers Only ({customers.filter((c) => c.notifyPriceUpdates).length})
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Notification / Email Subject:
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. New batch of Broilers now available at Shamon!"
                          value={broadcastSubject}
                          onChange={(e) => setBroadcastSubject(e.target.value)}
                          className="w-full text-xs p-2.5 bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden shadow-2xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Message Body:
                        </label>
                        <textarea
                          rows={4}
                          required
                          placeholder="Write your announcement here..."
                          value={broadcastMessage}
                          onChange={(e) => setBroadcastMessage(e.target.value)}
                          className="w-full text-xs p-2.5 bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden shadow-2xs font-medium"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={sendingBroadcast}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{sendingBroadcast ? "Sending..." : "Send Bulk Notification"}</span>
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 7: BANK DETAILS */}
              {activeTab === "bank" && (
                <div className="bg-white rounded-xl border border-emerald-100 p-5 shadow-xs max-w-lg">
                  <h4 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    shamonsBank Account Settings
                  </h4>
                  <p className="text-xs text-gray-500 mb-4">
                    Account details shown to customers during transfer checkout.
                  </p>
                  <form onSubmit={handleSaveBank} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={editBank.bankName}
                        onChange={(e) => setEditBank({ ...editBank, bankName: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">Account Number</label>
                      <input
                        type="text"
                        value={editBank.accountNumber}
                        onChange={(e) => setEditBank({ ...editBank, accountNumber: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg font-mono font-bold text-gray-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">Account Name</label>
                      <input
                        type="text"
                        value={editBank.accountName}
                        onChange={(e) => setEditBank({ ...editBank, accountName: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">Branch / Location</label>
                      <input
                        type="text"
                        value={editBank.branch || ""}
                        onChange={(e) => setEditBank({ ...editBank, branch: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white font-medium"
                      />
                    </div>
                    <button
                      type="submit"
                      className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
                    >
                      Save Bank Details
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* DOWNLOAD REPORT / CSV EXPORT MODAL */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-emerald-100 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base">Download Farm Report (CSV)</h4>
                  <p className="text-[11px] text-gray-500">
                    Export live inventory &amp; customer booking lists for Excel / Sheets
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDownloadModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <label
                onClick={() => setDownloadReportType("consolidated")}
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                  downloadReportType === "consolidated"
                    ? "bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-500/20"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="reportType"
                  checked={downloadReportType === "consolidated"}
                  onChange={() => setDownloadReportType("consolidated")}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 text-sm">
                      Complete Farm Report (Consolidated)
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Combines executive summary, live birds stock counts, feed bags inventory, and all
                    pending booking requests in one organized spreadsheet.
                  </p>
                </div>
              </label>

              <label
                onClick={() => setDownloadReportType("inventory")}
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                  downloadReportType === "inventory"
                    ? "bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-500/20"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="reportType"
                  checked={downloadReportType === "inventory"}
                  onChange={() => setDownloadReportType("inventory")}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex-1 space-y-1">
                  <span className="font-bold text-gray-900 text-sm block">
                    Current Live Inventory Report
                  </span>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Product-by-product breakdown of Day-Old chicks, full-breeded broilers, layers,
                    and feed bags in warehouse, unit prices, sold counts, and stock valuations.
                  </p>
                </div>
              </label>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowDownloadModal(false)}
                className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDownloadReport(downloadReportType)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Report (CSV)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESTOCK / NEW BATCH ARRIVAL MODAL */}
      {showRestockModal && (
        <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-emerald-100 space-y-4 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-gray-900 text-base">Record New Stock &amp; Update Prices</h4>
              </div>
              <button
                onClick={() => setShowRestockModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRestockSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Category:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRestockItemType("bird");
                      if (birds.length > 0) {
                        setRestockProductId(birds[0].id);
                        setRestockAgeId(birds[0].ageOptions[0]?.ageId || "");
                      } else {
                        setRestockProductId("");
                      }
                    }}
                    className={`p-2 rounded-lg font-bold border text-center cursor-pointer transition ${
                      restockItemType === "bird"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-900"
                        : "bg-gray-50 border-gray-200 text-gray-600"
                    }`}
                  >
                    Live Birds (Chicks/Layers)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRestockItemType("feed");
                      if (feeds.length > 0) {
                        setRestockProductId(feeds[0].id);
                        setRestockAgeId("");
                      } else {
                        setRestockProductId("");
                      }
                    }}
                    className={`p-2 rounded-lg font-bold border text-center cursor-pointer transition ${
                      restockItemType === "feed"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-900"
                        : "bg-gray-50 border-gray-200 text-gray-600"
                    }`}
                  >
                    Poultry Feeds (Bags)
                  </button>
                </div>
              </div>

              {/* Explicit product picker — this is what makes restockProductId
                  reliable. Previously this was only ever set implicitly by a
                  useEffect default, so submitting here could silently save
                  nothing if that default hadn't been set correctly. */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Which product is this batch for?
                </label>
                {restockItemType === "bird" ? (
                  birds.length === 0 ? (
                    <p className="text-red-600 text-[11px]">
                      No bird products found in the catalog yet.
                    </p>
                  ) : (
                    <select
                      required
                      value={restockProductId}
                      onChange={(e) => {
                        const bird = birds.find((b) => b.id === e.target.value);
                        setRestockProductId(e.target.value);
                        setRestockAgeId(bird?.ageOptions[0]?.ageId || "");
                      }}
                      className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 font-semibold"
                    >
                      <option value="" disabled>
                        Select a bird product…
                      </option>
                      {birds.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.breed})
                        </option>
                      ))}
                    </select>
                  )
                ) : feeds.length === 0 ? (
                  <p className="text-red-600 text-[11px]">
                    No feed products found in the catalog yet.
                  </p>
                ) : (
                  <select
                    required
                    value={restockProductId}
                    onChange={(e) => setRestockProductId(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 font-semibold"
                  >
                    <option value="" disabled>
                      Select a feed product…
                    </option>
                    {feeds.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.brand})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Quantity to Add ({restockItemType === "bird" ? "Chicks / Birds" : "25kg Bags"}):
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  placeholder={restockItemType === "bird" ? "e.g. 500" : "e.g. 50"}
                  value={restockQty}
                  onChange={(e) =>
                    setRestockQty(e.target.value ? parseInt(e.target.value, 10) : "")
                  }
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-base font-bold text-emerald-950"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Batch / Hatch Details (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Direct hatchery shipment batch #CB-500"
                  value={restockBatchNote}
                  onChange={(e) => setRestockBatchNote(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRestockModal(false)}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={restockingLoading || !restockQty || !restockProductId}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{restockingLoading ? "Saving..." : "Confirm & Update Stock"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Virtual Receipt Modal for Admin */}
      {adminReceiptBooking && (
        <VirtualReceiptModal
          isOpen={!!adminReceiptBooking}
          onClose={() => setAdminReceiptBooking(null)}
          booking={adminReceiptBooking}
          bankDetails={bankDetails}
          onPaymentSubmitted={(updated) => {
            setAdminReceiptBooking(updated);
            setBookings((prev) =>
              prev.map((b) => (b.id === updated.id ? updated : b)) 
            );
          }}
        />
      )}
    </div>
  );
};
