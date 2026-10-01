import { DepotInfo } from '../types';

// Depot contact & bank details are intentionally hardcoded here: this is a
// single local distributor (not a multi-tenant platform), so these values
// are effectively static configuration rather than user-generated data.
// Product catalog, stock, and orders live in Supabase — see src/lib/storage.ts
// and supabase/schema.sql.
export const DEPOT_INFO: DepotInfo = {
  name: 'shamons  Poultry & Feeds',
  address: 'Kaltungo',
  landmark: 'Kaltungo, Gombe State',
  city: 'Kaltungo',
  state: 'Gombe State',
  phones: ['+234 803 498 1726', '+234 814 620 9381'],
  whatsappNumber: '+2348034981726',
  openingHours: 'Mon – Sat: 7:30 AM – 6:30 PM | Sun: 1:00 PM – 5:30 PM',
  bankDetails: {
    bankName: 'First Bank of Nigeria',
    accountName: 'shamons  RESTURANT',
    accountNumber: '2017902276',
    branch: 'Kaltungo Branch, Gombe State',
  },
};
