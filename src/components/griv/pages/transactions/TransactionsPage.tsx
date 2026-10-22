import { useMemo, useState } from 'react';
import { DashboardPage, MetricGrid, MetricCard, Toolbar, SearchInput, FilterSelect, DateRangeSelect, ClearFilters, ExportButton, StatusTabs, DataTable, EmptyState, StatusBadge, useDemoLoading, type Column } from '@/components/griv/kit';
import { CHANNELS, useLedger, type LedgerEntry } from '@/lib/demo/ledger';
import { CURRENCIES, formatMoney, totalsByCurrency } from '@/lib/money';
import { fmtDate, inRange, type DateRange } from '@/lib/dates';
import { exportCsv } from '@/lib/csv';
import { LedgerDetails } from './LedgerDetails';
export function TransactionsPage({ payments = false }: { payments?: boolean }) {
 const ledger = useLedger(); const loading = useDemoLoading();
 const [search,setSearch]=useState(''); const [currency,setCurrency]=useState('All'); const [status,setStatus]=useState('All'); const [type,setType]=useState('All'); const [channel,setChannel]=useState('All'); const [date,setDate]=useState<DateRange>('Last 30 days'); const [min,setMin]=useState(''); const [max,setMax]=useState(''); const [selected,setSelected]=useState<LedgerEntry>();
 const clear=()=>{setSearch('');setCurrency('All');setStatus('All');setType('All');setChannel('All');setDate('All time');setMin('');setMax('');};
 const source=useMemo(()=>ledger.filter(r=>!payments || r.type==='Payment'),[ledger,payments]);
 const scoped=useMemo(()=>source.filter(r=>(currency==='All'||r.currency===currency)&&inRange(r.date,date)),[source,currency,date]);
 const rows=useMemo(()=>scoped.filter(r=>(status==='All'||r.status===status)&&(type==='All'||r.type===type)&&(channel==='All'||r.channel===channel)&&(!min||r.amount>=Number(min))&&(!max||r.amount<=Number(max))&&`${r.id} ${r.customer} ${r.email}`.toLowerCase().includes(search.toLowerCase())),[scoped,status,type,channel,min,max,search]);
 const moneyTotals=totalsByCurrency(payments?scoped.filter(r=>r.status==='Successful'):scoped,r=>r.amount,r=>r.currency);
 const totals=Object.entries(moneyTotals).map(([c,n])=><span key={c} className="block text-lg">{formatMoney(n,c as typeof CURRENCIES[number])}</span>);
 const columns:Column<LedgerEntry>[]=[
 {key:'reference',header:payments?'Customer / reference':'Reference / party',cell:r=><button className="text-left" onClick={()=>setSelected(r)}><span className="block font-medium">{payments?r.customer:r.id}</span><span className="text-xs text-muted-foreground">{payments?r.id:r.customer}</span></button>,sort:r=>r.id},
 {key:'type',header:payments?'Channel':'Type',cell:r=>payments?r.channel:r.type,sort:r=>payments?r.channel:r.type,hideBelow:'md'},
 {key:'amount',header:'Amount',cell:r=>formatMoney(r.amount,r.currency),sort:r=>r.amount,align:'right'},
 ...(payments ? [{key:'fee',header:'Fees / net',cell:(r:LedgerEntry)=><span>{formatMoney(r.fee,r.currency)}<span className="block text-xs text-muted-foreground">Net {formatMoney(r.amount-r.fee,r.currency)}</span></span>,hideBelow:'lg' as const}] : []),
 {key:'status',header:'Status',cell:r=><StatusBadge status={r.status}/>,sort:r=>r.status},
 {key:'date',header:'Date',cell:r=>fmtDate(r.date),sort:r=>r.date,hideBelow:'lg'}];
 const successful=scoped.filter(r=>r.status==='Successful').length;
 return <DashboardPage title={payments?'Payments':'Transactions'} crumbs={[{label:payments?'Get paid':'Money'}]} description={payments?'Monitor collections, payment methods, and settlement performance.':'Every financial movement, in one clear ledger.'} actions={<ExportButton disabled={!rows.length} onClick={()=>exportCsv(payments?'payments':'transactions',rows.map(r=>({...r,net:r.amount-r.fee})))}/>}>
 <MetricGrid cols={payments?5:4}><MetricCard dark label={payments?'Successful collections':'Gross ledger volume'} value={totals.length?totals:'—'} sub="Separate totals per currency · selected period"/><MetricCard label={payments?'Total payments':'Ledger entries'} value={scoped.length} sub="Sample records"/><MetricCard label="Successful" value={successful} sub={payments?`${scoped.length?(successful/scoped.length*100).toFixed(1):0}% success rate`:'Confirmed sample entries'}/><MetricCard label="Pending" value={scoped.filter(r=>r.status.includes('pending')||r.status==='Pending').length} sub="Awaiting confirmation"/>{payments&&<MetricCard label="Failed" value={scoped.filter(r=>r.status==='Failed').length} sub="Open a payment for failure details"/>}</MetricGrid>
 {payments && <PaymentBreakdown rows={scoped}/>}
 <section className="panel overflow-hidden"><Toolbar><SearchInput value={search} onChange={setSearch} placeholder="Search reference or customer…"/><DateRangeSelect value={date} onChange={setDate}/><FilterSelect label="Currency" value={currency} onChange={setCurrency} options={['All',...CURRENCIES]}/><FilterSelect label="Channel" value={channel} onChange={setChannel} options={['All',...CHANNELS]}/>{!payments&&<FilterSelect label="Type" value={type} onChange={setType} options={['All','Payment','Transfer','Payout','Refund','Fee','Settlement','Reversal']}/>}<label className="text-xs text-muted-foreground">Min amount<input aria-label="Minimum amount" type="number" min="0" className="field h-9 w-28" value={min} onChange={e=>setMin(e.target.value)}/></label><label className="text-xs text-muted-foreground">Max amount<input aria-label="Maximum amount" type="number" min="0" className="field h-9 w-28" value={max} onChange={e=>setMax(e.target.value)}/></label><ClearFilters show onClear={clear}/></Toolbar>
 <StatusTabs value={status} onChange={setStatus} tabs={['All','Successful','Pending','Failed',...(!payments?['Refund pending','Refunded']:[])].map(value=>({value,label:value,count:value==='All'?scoped.length:scoped.filter(r=>r.status===value).length}))}/><DataTable columns={columns} rows={rows} rowKey={r=>r.id} onRowClick={setSelected} loading={loading} initialSort={{key:'date',dir:'desc'}} empty={<EmptyState title="No matching records" description="Try another date range or clear your filters." action={<button className="btn btn-outline" onClick={clear}>Clear filters</button>}/>}/></section>
 <LedgerDetails entry={selected} rows={ledger} onClose={()=>setSelected(undefined)}/></DashboardPage>;
}
import { PaymentBreakdown } from '../payments/PaymentBreakdown';
