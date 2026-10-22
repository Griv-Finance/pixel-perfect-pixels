// SAMPLE DATA — Lekki shop stock movement audit; resets on reload.
import { createDemoStore, makeRef } from '@/lib/demo-store';
import { adjustStock, findVariant } from './catalog';
import { daysAgo } from '@/lib/dates';
export type Movement = { id:string; sku:string; type:string; delta:number; before:number; after:number; reason:string; notes:string; user:string; time:string };
export const movementStore = createDemoStore<Movement[]>([
 {id:'MOV-SAMPLE-1',sku:'SHEA-250',type:'Receive stock',delta:20,before:0,after:20,reason:'Supplier delivery',notes:'October restock',user:'Adaeze O.',time:daysAgo(3)},
 {id:'MOV-SAMPLE-2',sku:'SHEA-250',type:'POS sale',delta:-8,before:20,after:12,reason:'Sale',notes:'Sample historical sales',user:'Adaeze O.',time:daysAgo(1)},
]);
export function recordAdjustment(sku:string,delta:number,type:string,reason:string,notes:string){
 const match=findVariant(sku); if(!match||!Number.isInteger(delta)||match.variant.available+delta<0)throw new Error('Stock changed. Review the available quantity.');
 const before=match.variant.available;adjustStock(sku,delta);
 movementStore.set(ms=>[{id:makeRef('MOV'),sku,type,delta,before,after:before+delta,reason,notes,user:'Adaeze O.',time:new Date().toISOString()},...ms]);
}
export type CountRow = {sku:string;before:number;count:number;delta:number};
export function parseCounts(text:string):CountRow[]{
 const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell='';}else cell+=c;}
 if(quoted)throw new Error('Unclosed quote in CSV.'); row.push(cell);if(row.some(x=>x.trim()))rows.push(row);
 const header=rows.shift()?.map(x=>x.trim().toLowerCase().replace(/^\uFEFF/,''))??[];const si=header.indexOf('sku'),qi=header.indexOf('available');if(si<0||qi<0)throw new Error('CSV must contain sku and available columns.');
 const seen=new Set<string>();if(!rows.length)throw new Error('No stock counts found.');
 return rows.map((r,i)=>{const sku=r[si]?.trim()??'',raw=r[qi]?.trim()??'',count=Number(raw),match=findVariant(sku);if(!match||match.product.type!=='Physical')throw new Error(`Row ${i+2}: unknown or untracked SKU ${sku}.`);if(!raw||!Number.isSafeInteger(count)||count<0)throw new Error(`Row ${i+2}: count must be a non-negative integer.`);if(seen.has(sku))throw new Error(`Duplicate SKU ${sku}.`);seen.add(sku);return {sku,before:match.variant.available,count,delta:count-match.variant.available};});
}
