// SAMPLE DATA — fictional Nova Retail orders; changes remain in browser memory.
import { INITIAL_PRODUCTS } from './catalog';
import { CUSTOMERS } from './customers';
import { daysAgo } from '@/lib/dates';
import { createDemoStore } from '@/lib/demo-store';
export const fulfilments = ['Unfulfilled', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'] as const;
export const payments = ['Paid', 'Awaiting payment', 'Refunded', 'Partially refunded', 'Failed'] as const;
export type Order = { id: string; customerId: string; date: string; channel: 'Online Store' | 'POS'; payment: typeof payments[number]; fulfilment: typeof fulfilments[number]; items: { name: string; sku: string; variant: string; price: number; quantity: number }[]; discount: number; delivery: number; carrier: string; tracking: string; notes: string[]; events: { label: string; time: string; note?: string }[]; refundPending: boolean };
export function totals(o: Order) { const subtotal = o.items.reduce((n,i)=>n+i.price*i.quantity,0); const vat = Math.round((subtotal-o.discount)*0.075*100)/100; return { subtotal, vat, total: subtotal-o.discount+vat+o.delivery }; }
const initial: Order[] = Array.from({length:40}, (_,i)=> { const p=INITIAL_PRODUCTS[i%10]!; const v=p.variants[i%p.variants.length]!; const fulfilment=fulfilments[i%6]!; const payment = fulfilment==='Returned' ? (i%2 ? 'Refunded' : 'Partially refunded') : fulfilment==='Cancelled' ? 'Refunded' : i%9===0 ? 'Failed' : i%7===0 ? 'Awaiting payment' : 'Paid'; const date=daysAgo(i%35); return { id:`ORD-${1040-i}`,customerId:CUSTOMERS[i%CUSTOMERS.length]!.id,date,channel:i%3===0?'POS':'Online Store',payment,fulfilment,items:[{name:p.name,sku:v.sku,variant:v.label,price:v.price,quantity:i%3+1}],discount:i%4===0?1000:0,delivery:i%3===0?0:2500,carrier:fulfilment==='Shipped'||fulfilment==='Delivered'?'GIG Logistics':'',tracking:fulfilment==='Shipped'||fulfilment==='Delivered'?`GIG${800100+i}`:'',notes:[],events:[{label:'Order placed',time:date}, ...(fulfilment!=='Unfulfilled'?[{label:fulfilment,time:daysAgo(Math.max(0,i%35-1))}]:[])],refundPending:false }; });
export const orderStore=createDemoStore(initial);
export const useOrders=()=>orderStore.use();
