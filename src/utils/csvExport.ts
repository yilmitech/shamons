import { BirdProduct, FeedProduct, BookingOrder, InventorySummary } from "../types";

/**
 * Escapes a field for safe CSV output (handles quotes, commas, newlines).
 */
function escapeCSV(field: any): string {
  if (field === null || field === undefined) return '""';
  const str = String(field);
  // If field contains quotes, commas, or newlines, wrap in quotes and double up internal quotes
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Triggers browser download of a CSV string with UTF-8 BOM for Excel compatibility.
 */
export function downloadCSVFile(csvContent: string, filename: string) {
  // \uFEFF is the UTF-8 Byte Order Mark (BOM) to ensure Nigerian Naira symbols and formatting open correctly in Excel
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads a Complete Comprehensive Farm Report CSV:
 * Includes Inventory Summary, Live Bird Stocks, Feed Stocks, and Pending / All Bookings.
 */
export function exportConsolidatedReportCSV(
  birds: BirdProduct[],
  feeds: FeedProduct[],
  bookings: BookingOrder[],
  summary: InventorySummary | null
) {
  const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);
  const dateSlug = new Date().toISOString().substring(0, 10);
  const rows: string[] = [];

  // ================= 1. HEADER & SUMMARY =================
  rows.push("SHAMON POULTRY & FEEDS - COMPREHENSIVE DEPOT REPORT");
  rows.push(`"Location:","Kaltungo, Gombe State, Nigeria"`);
  rows.push(`"Generated At:",${escapeCSV(timestamp)}`);
  rows.push("");
  rows.push("--- EXECUTIVE INVENTORY SUMMARY ---");
  rows.push("Metric,Value,Unit");

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

  const totalBirds = birds.reduce(
    (acc, b) => acc + b.ageOptions.reduce((a, opt) => a + (opt.stockCount || 0), 0),
    0
  );
  const totalFeeds = feeds.reduce((acc, f) => acc + (f.stockBags || 0), 0);
  const totalSold =
    birds.reduce((acc, b) => acc + b.ageOptions.reduce((a, opt) => a + (opt.soldCount || 0), 0), 0) +
    feeds.reduce((acc, f) => acc + (f.soldBags || 0), 0) +
    bookings.reduce((sum, b) => {
      const st = (b.orderStatus || b.status || "").toLowerCase();
      if (st === "cancelled") return sum;
      return sum + (b.items || []).reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
    }, 0);

  const pendingOrders = bookings.filter(isPendingOrder);
  const approvedOrders = bookings.filter(isApprovedOrder);
  const soldOrders = bookings.filter(isSoldOrder);

  rows.push(`"Total Birds in Pens",${totalBirds},"birds"`);
  rows.push(`"Total Feed in Store",${totalFeeds},"25kg bags"`);
  rows.push(`"Total Units Sold",${totalSold},"units"`);
  rows.push(`"Pending Booking Requests",${pendingOrders.length},"orders"`);
  rows.push(`"Approved / Reserved Orders",${approvedOrders.length},"orders"`);
  rows.push(`"Fulfilled (Sold) Orders",${soldOrders.length},"orders"`);

  if (summary?.estimatedStockValue) {
    rows.push(`"Estimated Stock Valuation", ₦${summary.estimatedStockValue.toLocaleString()},"NGN"`);
  }
  rows.push("");

  // ================= 2. LIVE POULTRY INVENTORY =================
  rows.push("--- CURRENT LIVE POULTRY INVENTORY ---");
  rows.push(
    "Category,Breed / Bird Name,Option / Age Label,Stock Count (Birds),Total Sold,Status,Price Per Bird (NGN),Price Per Carton (NGN),Avg Weight,Estimated Stock Value (NGN)"
  );
  birds.forEach((bird) => {
    bird.ageOptions.forEach((opt) => {
      const catLabel =
        bird.category === "day-old"
          ? "Day-Old (DOC)"
          : bird.category === "full-breeded"
          ? "Full Breeded"
          : "Layers";
      const status = !opt.inStock || opt.stockCount <= 0
        ? "Out of Stock"
        : opt.stockCount < 30
        ? "Low Stock"
        : "In Stock";
      const val = (opt.stockCount || 0) * (opt.pricePerBird || 0);
      rows.push(
        [
          escapeCSV(catLabel),
          escapeCSV(bird.name),
          escapeCSV(opt.ageLabel),
          opt.stockCount || 0,
          opt.soldCount || 0,
          escapeCSV(status),
          opt.pricePerBird || 0,
          opt.pricePerCarton || "N/A",
          escapeCSV(opt.avgWeight || "N/A"),
          val,
        ].join(",")
      );
    });
  });
  rows.push("");

  // ================= 3. POULTRY FEEDS INVENTORY =================
  rows.push("--- CURRENT POULTRY FEEDS INVENTORY ---");
  rows.push(
    "Brand,Feed Name,Variant,Stock Bags (25kg),Bags Sold,Status,Full Bag Price (NGN),Half Bag Price (NGN),Price Per KG (Full),Price Per KG (Half),Target Birds / Description,Estimated Stock Value (NGN)"
  );
  feeds.forEach((feed) => {
    const status = !feed.inStock || feed.stockBags <= 0
      ? "Out of Stock"
      : feed.stockBags < 10
      ? "Low Stock"
      : "In Stock";
    const val = (feed.stockBags || 0) * (feed.pricePerBag || 0);
    const halfBagPrice = feed.pricePerHalfBag || Math.round(feed.pricePerBag / 2 + 250);
    const pricePerKgFull = Math.round(feed.pricePerBag / (feed.weightKg || 25));
    const pricePerKgHalf = Math.round(halfBagPrice / (feed.halfBagWeightKg || 12.5));
    rows.push(
      [
        escapeCSV(feed.brand),
        escapeCSV(feed.name),
        escapeCSV(feed.variant),
        feed.stockBags || 0,
        feed.soldBags || 0,
        escapeCSV(status),
        feed.pricePerBag || 0,
        halfBagPrice,
        pricePerKgFull,
        pricePerKgHalf,
        escapeCSV(feed.description),
        val,
      ].join(",")
    );
  });
  rows.push("");

  // ================= 4. PENDING BOOKING REQUESTS =================
  rows.push("--- PENDING BOOKING REQUESTS (Awaiting Admin Approval) ---");
  rows.push(
    "Booking Ref,Customer Name,Phone,Email,Fulfillment Type,Delivery Address / Pickup Point,Items Ordered Summary,Total Amount (NGN),Preferred Date,Payment Status,Order Status,Submitted At,Admin Notes"
  );
  if (pendingOrders.length === 0) {
    rows.push('"No pending booking requests currently. All orders are processed.",,,,,,,,,,,,');
  } else {
    pendingOrders.forEach((b) => {
      const itemsSummary = b.items
        .map((i) => `${i.quantity}x ${i.name} (${i.detailLabel}) - ₦${i.subtotal.toLocaleString()}`)
        .join(" | ");
      rows.push(
        [
          escapeCSV(b.bookingRef),
          escapeCSV(b.customerName),
          escapeCSV(b.phone),
          escapeCSV(b.email || "N/A"),
          escapeCSV("Kaltungo Pickup / Delivery"),
          escapeCSV(b.deliveryOrPickupLocation || "Store Pickup"),
          escapeCSV(itemsSummary),
          b.totalAmount,
          escapeCSV(b.preferredDate),
          escapeCSV(b.paymentStatus === "payment_confirmed" ? "Payment Confirmed" : "Pending Proof / Transfer"),
          escapeCSV("Pending Admin Approval"),
          escapeCSV(b.createdAt),
          escapeCSV(b.adminNotes || "None"),
        ].join(",")
      );
    });
  }
  rows.push("");

  // ================= 5. APPROVED & SOLD ORDERS =================
  rows.push("--- APPROVED, SOLD & PROCESSED ORDERS LIST ---");
  rows.push(
    "Booking Ref,Customer Name,Phone,Order Status,Stock Action,Items Ordered,Total Amount (NGN),Preferred Date,Processed Date,Admin Notes"
  );
  const processedOrders = bookings.filter((b) => b.orderStatus !== "pending");
  if (processedOrders.length === 0) {
    rows.push('"No processed orders recorded yet.",,,,,,,,,');
  } else {
    processedOrders.forEach((b) => {
      const itemsSummary = b.items
        .map((i) => `${i.quantity}x ${i.name} (${i.detailLabel})`)
        .join(" | ");
      const stockAction =
        b.orderStatus === "sold" || b.orderStatus === "completed"
          ? "Stock Deducted"
          : b.orderStatus === "approved" || b.orderStatus === "confirmed"
          ? "Stock Reserved in Pen"
          : "Cancelled / Returned";
      rows.push(
        [
          escapeCSV(b.bookingRef),
          escapeCSV(b.customerName),
          escapeCSV(b.phone),
          escapeCSV(b.orderStatus.toUpperCase()),
          escapeCSV(stockAction),
          escapeCSV(itemsSummary),
          b.totalAmount,
          escapeCSV(b.preferredDate),
          escapeCSV(b.soldAt || b.approvedAt || b.createdAt),
          escapeCSV(b.adminNotes || "None"),
        ].join(",")
      );
    });
  }

  const csvString = rows.join("\r\n");
  downloadCSVFile(csvString, `shamon-depot-complete-report-${dateSlug}.csv`);
}

/**
 * Generates and downloads a dedicated Current Inventory CSV:
 * Combines Live Birds and Poultry Feeds with unit counts, sold numbers, unit prices and total values.
 */
export function exportCurrentInventoryCSV(birds: BirdProduct[], feeds: FeedProduct[]) {
  const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);
  const dateSlug = new Date().toISOString().substring(0, 10);
  const rows: string[] = [];

  rows.push("SHAMON POULTRY & FEEDS - CURRENT INVENTORY REPORT");
  rows.push(`"Generated At:",${escapeCSV(timestamp)}`);
  rows.push("");
  rows.push("Item Type,Category / Brand,Product Name,Age / Variant,Available Stock,Units Sold,Status,Full Unit Price (NGN),Half Unit Price (NGN),Carton Price (NGN),Avg Weight / Specs,Estimated Value (NGN)");

  let grandTotalUnits = 0;
  let grandTotalSold = 0;
  let grandTotalValue = 0;

  birds.forEach((bird) => {
    bird.ageOptions.forEach((opt) => {
      const catLabel =
        bird.category === "day-old"
          ? "Day-Old (DOC)"
          : bird.category === "full-breeded"
          ? "Full Breeded"
          : "Layers";
      const status = !opt.inStock || opt.stockCount <= 0
        ? "Out of Stock"
        : opt.stockCount < 30
        ? "Low Stock"
        : "In Stock";
      const stock = opt.stockCount || 0;
      const sold = opt.soldCount || 0;
      const val = stock * (opt.pricePerBird || 0);
      grandTotalUnits += stock;
      grandTotalSold += sold;
      grandTotalValue += val;
      rows.push(
        [
          "Live Poultry",
          escapeCSV(catLabel),
          escapeCSV(bird.name),
          escapeCSV(opt.ageLabel),
          stock,
          sold,
          escapeCSV(status),
          opt.pricePerBird || 0,
          "N/A",
          opt.pricePerCarton || "N/A",
          escapeCSV(opt.avgWeight || "N/A"),
          val,
        ].join(",")
      );
    });
  });

  feeds.forEach((feed) => {
    const status = !feed.inStock || feed.stockBags <= 0
      ? "Out of Stock"
      : feed.stockBags < 10
      ? "Low Stock"
      : "In Stock";
    const stock = feed.stockBags || 0;
    const sold = feed.soldBags || 0;
    const val = stock * (feed.pricePerBag || 0);
    const halfBagPrice = feed.pricePerHalfBag || Math.round(feed.pricePerBag / 2 + 250);
    grandTotalUnits += stock;
    grandTotalSold += sold;
    grandTotalValue += val;
    rows.push(
      [
        "Poultry Feed",
        escapeCSV(feed.brand),
        escapeCSV(feed.name),
        escapeCSV(feed.variant + " (25kg)"),
        stock,
        sold,
        escapeCSV(status),
        feed.pricePerBag || 0,
        halfBagPrice,
        "N/A",
        escapeCSV(feed.description),
        val,
      ].join(",")
    );
  });

  rows.push("");
  rows.push(`"GRAND TOTAL",,,,"${grandTotalUnits} units","${grandTotalSold} units",,,,,"Estimated Value:",${grandTotalValue}`);

  const csvString = rows.join("\r\n");
  downloadCSVFile(csvString, `shamon-current-inventory-${dateSlug}.csv`);
}

/**
 * Generates and downloads a dedicated Price Analytics and Valuation Matrix CSV.
 */
export function exportPriceAnalyticsCSV(birds: BirdProduct[], feeds: FeedProduct[]) {
  const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);
  const dateSlug = new Date().toISOString().substring(0, 10);
  const rows: string[] = [];

  rows.push("SHAMON POULTRY & FEEDS - PRICE ANALYTICS & VALUATION MATRIX");
  rows.push(`"Generated At:",${escapeCSV(timestamp)}`);
  rows.push("");
  rows.push("--- FEED PRICING & WEIGHT ANALYTICS ---");
  rows.push("Feed Product,Brand,Variant,Stock Bags (25kg),25kg Full Bag Price (NGN),12.5kg Half Bag Price (NGN),Price per KG (Full),Price per KG (Half),Half-Bag Premium %,Inventory Value (NGN)");

  let totalFeedValuation = 0;
  feeds.forEach((feed) => {
    const full = feed.pricePerBag || 0;
    const half = feed.pricePerHalfBag || Math.round(full / 2 + 250);
    const perKgFull = Math.round(full / 25);
    const perKgHalf = Math.round(half / 12.5);
    const premiumPercent = full > 0 ? (((half * 2) - full) / full * 100).toFixed(1) : "0";
    const val = (feed.stockBags || 0) * full;
    totalFeedValuation += val;
    rows.push([
      escapeCSV(feed.name),
      escapeCSV(feed.brand),
      escapeCSV(feed.variant),
      feed.stockBags || 0,
      full,
      half,
      perKgFull,
      perKgHalf,
      `${premiumPercent}%`,
      val,
    ].join(","));
  });
  rows.push(`"Total Feed Inventory Value",,,,,,,,,${totalFeedValuation}`);
  rows.push("");

  rows.push("--- LIVE POULTRY PRICING & VALUATION MATRIX ---");
  rows.push("Breed / Category,Product Name,Age Option,Stock Count,Price per Bird (NGN),Carton Price (50-chick NGN),Per-Unit Carton Savings (NGN),Stock Valuation (NGN)");

  let totalBirdValuation = 0;
  birds.forEach((bird) => {
    bird.ageOptions.forEach((opt) => {
      const stock = opt.stockCount || 0;
      const unitPrice = opt.pricePerBird || 0;
      const cartonPrice = opt.pricePerCarton || 0;
      const unitEquivalentInCarton = cartonPrice > 0 ? Math.round(cartonPrice / 50) : unitPrice;
      const cartonSavings = cartonPrice > 0 ? unitPrice - unitEquivalentInCarton : 0;
      const val = stock * unitPrice;
      totalBirdValuation += val;
      rows.push([
        escapeCSV(bird.category.toUpperCase()),
        escapeCSV(bird.name),
        escapeCSV(opt.ageLabel),
        stock,
        unitPrice,
        cartonPrice || "N/A",
        cartonSavings > 0 ? cartonSavings : "N/A",
        val,
      ].join(","));
    });
  });
  rows.push(`"Total Birds Inventory Value",,,,,,,${totalBirdValuation}`);
  rows.push("");
  rows.push(`"TOTAL INVENTORY VALUATION (COMBINED)",,,,,,,${totalFeedValuation + totalBirdValuation}`);

  const csvString = rows.join("\r\n");
  downloadCSVFile(csvString, `shamon-price-analytics-${dateSlug}.csv`);
}

/**
 * Generates and downloads a dedicated Bookings list CSV (supports filtering by pending or exporting all).
 */
export function exportBookingsListCSV(
  bookings: BookingOrder[],
  filterMode: "all" | "pending" | "approved" | "sold" = "pending"
) {
  const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);
  const dateSlug = new Date().toISOString().substring(0, 10);
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

  const filtered = bookings.filter((b) => {
    if (filterMode === "pending") return isPendingOrder(b);
    if (filterMode === "approved") return isApprovedOrder(b);
    if (filterMode === "sold") return isSoldOrder(b);
    return true;
  });

  const title =
    filterMode === "pending"
      ? "PENDING BOOKING REQUESTS"
      : filterMode === "approved"
      ? "APPROVED & RESERVED BOOKINGS"
      : filterMode === "sold"
      ? "SOLD & FULFILLED ORDERS"
      : "ALL BOOKINGS & ORDERS";

  const rows: string[] = [];
  rows.push(`SHAMON POULTRY & FEEDS - ${title}`);
  rows.push(`"Generated At:",${escapeCSV(timestamp)}`);
  rows.push(`"Total Records:",${filtered.length}`);
  rows.push("");
  rows.push(
    "Booking Ref,Customer Name,Phone Number,Email,Delivery / Pickup,Address,Items Ordered,Total Amount (NGN),Preferred Date,Payment Status,Order Status,Stock Status,Date Created,Admin Notes"
  );

  let totalRevenue = 0;
  filtered.forEach((b) => {
    const itemsSummary = b.items
      .map((i) => `${i.quantity}x ${i.name} (${i.detailLabel}) - ₦${i.subtotal.toLocaleString()}`)
      .join(" | ");
    totalRevenue += b.totalAmount;
    rows.push(
      [
        escapeCSV(b.bookingRef),
        escapeCSV(b.customerName),
        escapeCSV(b.phone),
        escapeCSV(b.email || "N/A"),
        escapeCSV("Kaltungo Pickup / Delivery"),
        escapeCSV(b.deliveryOrPickupLocation || "Pickup Point"),
        escapeCSV(itemsSummary),
        b.totalAmount,
        escapeCSV(b.preferredDate),
        escapeCSV(b.paymentStatus === "payment_confirmed" ? "Payment Confirmed" : "Pending Payment Proof"),
        escapeCSV(b.orderStatus.toUpperCase()),
        escapeCSV(b.stockStatus || (b.stockDeducted ? "Sold / Deducted" : "Reserved")),
        escapeCSV(b.createdAt),
        escapeCSV(b.adminNotes || "None"),
      ].join(",")
    );
  });

  rows.push("");
  rows.push(`"TOTAL VALUE",,,,,,,${totalRevenue}`);

  const csvString = rows.join("\r\n");
  downloadCSVFile(
    csvString,
    `shamon-${filterMode === "all" ? "all-orders" : filterMode + "-bookings"}-${dateSlug}.csv`
  );
}
