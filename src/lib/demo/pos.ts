// SAMPLE DATA — Nova Retail Lekki shop sales; no provider connectivity.
import { createDemoStore } from '@/lib/demo-store';
import { daysAgo } from '@/lib/dates';
export type SaleLine={sku:string;name:string;label:string;price:number;qty:number};
export type Sale={id:string;time:string;lines:SaleLine[];subtotal:number;discount:number;vat:number;total:number;customer:string;method:'Cash'|'Bank transfer';status:'Completed'|'Awaiting confirmation'|'Failed'|'Cancelled';tendered:number};
export const salesStore=createDemoStore<Sale[]>([{id:'POS-LK-1024',time:daysAgo(0),lines:[{sku:'ZOBO-1L',name:'Zobo Hibiscus Drink 1L',label:'Default',price:2000,qty:2}],subtotal:4000,discount:0,vat:300,total:4300,customer:'Guest',method:'Cash',status:'Completed',tendered:5000}]);
