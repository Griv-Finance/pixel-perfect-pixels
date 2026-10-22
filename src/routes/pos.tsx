import { createFileRoute } from '@tanstack/react-router';
import { POSPage } from '@/components/griv/pages/pos/POSPage';
export const Route = createFileRoute('/pos')({
 head: () => ({ meta: [{title: 'POS — Griv Finance'}, {name:'description',content:'Manage pos for Nova Retail on Griv.'}, {property:'og:title',content:'POS — Griv Finance'}, {property:'og:description',content:'Manage pos for Nova Retail on Griv.'}, {property:'og:type',content:'website'}, {name:'twitter:card',content:'summary_large_image'}] }),
 component: POSPage,
});
