// SAMPLE DATA — indicative historical balances and expected settlement batches, not bank confirmations.
import { daysAgo } from '@/lib/dates';
export const settlementBatches = [
 { id: 'STL-NG-2201', accountId: 'acc_ngn_main', amount: 2120000, date: daysAgo(-1) },
 { id: 'STL-NG-2202', accountId: 'acc_ngn_main', amount: 1000000, date: daysAgo(-2) },
 { id: 'STL-US-2201', accountId: 'acc_usd', amount: 2140, date: daysAgo(-1) },
 { id: 'STL-GH-2201', accountId: 'acc_ghs', amount: 12450, date: daysAgo(-1) },
 { id: 'STL-KE-2201', accountId: 'acc_kes', amount: 38000, date: daysAgo(-2) },
];
export const movementFactors = [.72, .78, .74, .86, .82, .94, 1];
