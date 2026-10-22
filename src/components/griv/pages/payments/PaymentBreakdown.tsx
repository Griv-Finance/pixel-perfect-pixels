import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CHANNELS, type LedgerEntry } from '@/lib/demo/ledger';
export function PaymentBreakdown({rows}:{rows:LedgerEntry[]}) {
 const data=CHANNELS.map(channel=>({channel,payments:rows.filter(r=>r.channel===channel).length}));
 return <section className="panel mb-6 p-5"><h2 className="font-semibold">Collection channels</h2><p className="mb-4 text-sm text-muted-foreground">Payment count by method · all statuses in the selected period</p><div className="h-52" role="img" aria-label="Payment count by collection channel"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{left:-20,right:10}}><XAxis dataKey="channel" tick={{fontSize:10}} interval={0}/><YAxis allowDecimals={false} tick={{fontSize:11}}/><Tooltip/><Bar dataKey="payments" fill="var(--chart-1)" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></section>;
}
