/**
 * shamonsPoultry & Feeds - lightweight local read cache.
 *
 * Supabase (see src/lib/storage.ts) is the source of truth for products,
 * orders, and customer/alert data. This file exists only to give the Admin
 * Portal something to show if a fetch from Supabase fails (e.g. flaky
 * connection) — it caches the last successful admin read of bookings and
 * customers so the dashboard doesn't go blank.
 */

import { BookingOrder, RegisteredCustomer } from "../types";

const STORAGE_KEYS = {
  BOOKINGS: "shamon_offline_bookings",
  CUSTOMERS: "shamon_offline_customers",
};

export function getCachedBookings(): BookingOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCachedBookings(bookings: BookingOrder[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  } catch (e) {
    console.warn("Failed to cache bookings offline", e);
  }
}

export function getCachedCustomers(): RegisteredCustomer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCachedCustomers(customers: RegisteredCustomer[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  } catch (e) {
    console.warn("Failed to cache customers offline", e);
  }
}
