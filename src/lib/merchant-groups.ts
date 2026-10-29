import {
  LayoutDashboard, Wallet, ArrowLeftRight, Send, Banknote, Link2, Receipt, Landmark, CreditCard,
  Store, ShoppingBag, Package, Boxes, Monitor, Users, Truck, CalendarClock, Repeat,
  LineChart, Sparkles, Bot, Settings, UserCog, Code2, ScrollText,
} from "lucide-react";

/** Features that already exist in Griv's main menu. Previews may only use these. */
export const FEATURE_ICONS = {
  Dashboard: LayoutDashboard,
  Balances: Wallet,
  Transactions: ArrowLeftRight,
  Transfers: Send,
  Payouts: Banknote,
  "Payment Links": Link2,
  Invoices: Receipt,
  "Virtual Accounts": Landmark,
  Payments: CreditCard,
  "Online Store": Store,
  Orders: ShoppingBag,
  Products: Package,
  Inventory: Boxes,
  POS: Monitor,
  Customers: Users,
  Suppliers: Truck,
  "Scheduled Payments": CalendarClock,
  "Recurring Payments": Repeat,
  Cards: CreditCard,
  Insights: LineChart,
  Credit: Sparkles,
  AI: Bot,
  Settings: Settings,
  Team: UserCog,
  Developers: Code2,
  "Audit Logs": ScrollText,
} as const;

export type Feature = keyof typeof FEATURE_ICONS;
export type NavSection = { category: string; items: Feature[] };
export type Metric = { k: string; v: string; c: string; tone: "up" | "down" | "flag" };
export type ActivityRow = { t: string; c: string; a: number; s: string; d: string };

export type MerchantGroup = {
  slug: string;
  letter: string;
  name: string;
  description: string;
  sidebar: NavSection[];
  /** Complementary features that can be switched on for this group. */
  addOns: Feature[];
  hero: { label: string; value: string; sub: string };
  metrics: Metric[];
  chart: { title: string; a: string; b: string; baseA: number; baseB: number; unit: "₦M" | "#" };
  side: { title: string; rows: { t: string; s: string; v: string }[] };
  activityTitle: string;
  activity: ActivityRow[];
};

export const MERCHANT_GROUPS: MerchantGroup[] = [
  {
    slug: "full-business",
    letter: "A",
    name: "Full Business",
    description: "For businesses that use most or all of Griv's features.",
    sidebar: [
      { category: "Money", items: ["Balances", "Transactions", "Transfers", "Payouts"] },
      { category: "Get Paid", items: ["Payment Links", "Invoices", "Virtual Accounts", "Recurring Payments"] },
      { category: "Sell", items: ["Online Store", "POS", "Orders", "Products", "Inventory"] },
      { category: "Manage", items: ["Customers", "Suppliers"] },
      { category: "Finance", items: ["Cards"] },
      { category: "Growth", items: ["Insights", "Credit", "AI"] },
      { category: "Workspace", items: ["Team", "Developers", "Audit Logs", "Settings"] },
    ],
    addOns: [],
    hero: { label: "Available balance", value: "₦24,850,000", sub: "Across all business accounts" },
    metrics: [
      { k: "Total sales", v: "₦48.2M", c: "+18.4%", tone: "up" },
      { k: "Collections", v: "₦31.6M", c: "+11.2%", tone: "up" },
      { k: "Payouts", v: "₦14.8M", c: "+8.7%", tone: "up" },
    ],
    chart: { title: "Money movement", a: "Incoming", b: "Outgoing", baseA: 1.4, baseB: 0.6, unit: "₦M" },
    side: {
      title: "Revenue by source",
      rows: [
        { t: "Online Store", s: "642 orders", v: "₦18.4M" },
        { t: "POS", s: "1,108 sales", v: "₦12.1M" },
        { t: "Invoices", s: "48 paid", v: "₦9.6M" },
        { t: "Payment Links", s: "312 payments", v: "₦8.1M" },
      ],
    },
    activityTitle: "Recent activity",
    activity: [
      { t: "Payment received", c: "Chioma Eze", a: 185000, s: "Successful", d: "Today, 10:42" },
      { t: "Payout to supplier", c: "Lagos Textiles Co.", a: -1240000, s: "Pending", d: "Today, 09:15" },
      { t: "Invoice paid · INV-0482", c: "Bluefin Hotels", a: 920000, s: "Successful", d: "Yesterday" },
      { t: "POS sale", c: "Walk-in customer", a: 45500, s: "Successful", d: "Yesterday" },
      { t: "Bulk payout · Staff", c: "14 recipients", a: -3860000, s: "Successful", d: "Oct 5" },
    ],
  },
  {
    slug: "online-store",
    letter: "B",
    name: "Online Store",
    description: "For businesses that mainly sell products online.",
    sidebar: [
      { category: "Store", items: ["Online Store", "Products", "Inventory", "Orders"] },
      { category: "Business", items: ["Customers"] },
      { category: "Finance", items: ["Balances", "Transactions", "Payouts"] },
      { category: "Workspace", items: ["Settings"] },
    ],
    addOns: ["Payment Links", "Invoices"],
    hero: { label: "Online sales · 30 days", value: "₦18,420,000", sub: "From 1,264 orders" },
    metrics: [
      { k: "Orders", v: "1,264", c: "+14.2%", tone: "up" },
      { k: "Avg. order value", v: "₦14,570", c: "+3.1%", tone: "up" },
      { k: "Low-stock products", v: "7", c: "Restock soon", tone: "flag" },
    ],
    chart: { title: "Online sales", a: "This period", b: "Last period", baseA: 0.62, baseB: 0.5, unit: "₦M" },
    side: {
      title: "Top products",
      rows: [
        { t: "Ankara Tote Bag", s: "214 sold · 38 in stock", v: "₦3.2M" },
        { t: "Shea Body Butter", s: "486 sold · 12 in stock", v: "₦2.4M" },
        { t: "Adire Throw Pillow", s: "132 sold · 54 in stock", v: "₦1.9M" },
        { t: "Leather Sandals", s: "98 sold · 4 in stock", v: "₦1.7M" },
      ],
    },
    activityTitle: "Recent orders",
    activity: [
      { t: "Order #10482", c: "Ngozi Adeyemi", a: 42500, s: "Paid", d: "Today, 11:05" },
      { t: "Order #10481", c: "Ibrahim Musa", a: 18900, s: "Processing", d: "Today, 10:18" },
      { t: "Order #10480", c: "Kemi Ajayi", a: 66000, s: "Fulfilled", d: "Today, 08:47" },
      { t: "Order #10479", c: "Emeka Obi", a: 12500, s: "Failed", d: "Yesterday" },
      { t: "Settlement to bank", c: "GTBank ••4821", a: -2860000, s: "Completed", d: "Yesterday" },
    ],
  },
  {
    slug: "in-store-retail",
    letter: "C",
    name: "In-Store Retail (POS)",
    description: "For businesses that mainly sell at a physical counter.",
    sidebar: [
      { category: "Retail", items: ["POS", "Orders", "Products", "Inventory", "Customers", "Suppliers"] },
      { category: "Payments", items: ["Transactions", "Balances", "Payouts"] },
      { category: "Workspace", items: ["Settings"] },
    ],
    addOns: ["Payment Links"],
    hero: { label: "POS sales · today", value: "₦1,286,400", sub: "From 94 sales across 2 tills" },
    metrics: [
      { k: "POS sales · 30 days", v: "₦31.4M", c: "+9.6%", tone: "up" },
      { k: "Transactions", v: "2,318", c: "+6.2%", tone: "up" },
      { k: "Items to reorder", v: "12", c: "Below minimum", tone: "flag" },
    ],
    chart: { title: "POS sales", a: "Card & transfer", b: "Cash", baseA: 0.8, baseB: 0.3, unit: "₦M" },
    side: {
      title: "Sales by till",
      rows: [
        { t: "Till 1 · Front counter", s: "58 sales today", v: "₦812,300" },
        { t: "Till 2 · Express", s: "36 sales today", v: "₦474,100" },
        { t: "Top item: Peak Milk 400g", s: "86 sold today", v: "₦215,000" },
        { t: "Supplier delivery due", s: "Dangote Foods · Fri", v: "42 cartons" },
      ],
    },
    activityTitle: "Recent sales",
    activity: [
      { t: "POS sale · Till 1", c: "Walk-in customer", a: 23400, s: "Successful", d: "Today, 12:02" },
      { t: "POS sale · Till 2", c: "Funmi Bello", a: 8750, s: "Successful", d: "Today, 11:56" },
      { t: "Refund · Till 1", c: "Walk-in customer", a: -4200, s: "Completed", d: "Today, 11:31" },
      { t: "POS sale · Till 1", c: "Walk-in customer", a: 15600, s: "Failed", d: "Today, 11:12" },
      { t: "Payout to supplier", c: "Dangote Foods", a: -980000, s: "Pending", d: "Yesterday" },
    ],
  },
  {
    slug: "online-store-pos",
    letter: "D",
    name: "Online Store + POS",
    description: "For businesses selling both online and in a physical shop.",
    sidebar: [
      { category: "Sales Channels", items: ["Online Store", "POS"] },
      { category: "Commerce", items: ["Orders", "Products", "Inventory", "Customers", "Suppliers"] },
      { category: "Payments", items: ["Transactions", "Balances", "Payouts"] },
      { category: "Workspace", items: ["Settings"] },
    ],
    addOns: ["Payment Links", "Invoices"],
    hero: { label: "Total sales · 30 days", value: "₦30,540,000", sub: "Online and in-store combined" },
    metrics: [
      { k: "Online sales", v: "₦18.4M", c: "+14.2%", tone: "up" },
      { k: "In-store sales", v: "₦12.1M", c: "+5.8%", tone: "up" },
      { k: "Orders", v: "2,372", c: "+10.4%", tone: "up" },
    ],
    chart: { title: "Sales by channel", a: "Online Store", b: "POS", baseA: 0.62, baseB: 0.42, unit: "₦M" },
    side: {
      title: "Channel breakdown",
      rows: [
        { t: "Online Store", s: "1,264 orders · 60% of sales", v: "₦18.4M" },
        { t: "POS", s: "1,108 sales · 40% of sales", v: "₦12.1M" },
        { t: "Shared inventory", s: "342 products synced", v: "7 low" },
        { t: "Returning customers", s: "Bought in both channels", v: "418" },
      ],
    },
    activityTitle: "Recent sales",
    activity: [
      { t: "Online order #10482", c: "Ngozi Adeyemi", a: 42500, s: "Paid", d: "Today, 11:05" },
      { t: "POS sale · Lekki shop", c: "Walk-in customer", a: 23400, s: "Successful", d: "Today, 10:52" },
      { t: "Online order #10481", c: "Ibrahim Musa", a: 18900, s: "Processing", d: "Today, 10:18" },
      { t: "POS sale · Lekki shop", c: "Tola Martins", a: 61000, s: "Successful", d: "Today, 09:40" },
      { t: "Settlement to bank", c: "GTBank ••4821", a: -4120000, s: "Completed", d: "Yesterday" },
    ],
  },
  {
    slug: "payments-collections",
    letter: "E",
    name: "Payments & Collections",
    description: "For businesses that mainly collect payments through Griv.",
    sidebar: [
      { category: "Collect Payments", items: ["Payment Links", "Invoices", "Virtual Accounts", "Recurring Payments"] },
      { category: "Activity", items: ["Transactions", "Customers"] },
      { category: "Finance", items: ["Balances", "Payouts"] },
      { category: "Workspace", items: ["Settings", "Developers"] },
    ],
    addOns: [],
    hero: { label: "Collected · 30 days", value: "₦36,910,000", sub: "From 2,604 successful payments" },
    metrics: [
      { k: "Success rate", v: "96.8%", c: "+1.2 pts", tone: "up" },
      { k: "Pending payments", v: "₦4.2M", c: "38 open", tone: "flag" },
      { k: "Failed payments", v: "86", c: "−14%", tone: "up" },
    ],
    chart: { title: "Collections", a: "Successful", b: "Pending", baseA: 1.2, baseB: 0.2, unit: "₦M" },
    side: {
      title: "Collections by method",
      rows: [
        { t: "Virtual Accounts", s: "1,120 transfers", v: "₦15.8M" },
        { t: "Payment Links", s: "842 payments", v: "₦10.4M" },
        { t: "Invoices", s: "164 paid", v: "₦7.9M" },
        { t: "Recurring Payments", s: "478 charges", v: "₦2.8M" },
      ],
    },
    activityTitle: "Recent collections",
    activity: [
      { t: "Virtual account transfer", c: "Amaka Stores", a: 310000, s: "Successful", d: "Today, 11:48" },
      { t: "Payment link · Event tickets", c: "Segun Ade", a: 25000, s: "Successful", d: "Today, 11:20" },
      { t: "Invoice · INV-0519", c: "Bluefin Hotels", a: 920000, s: "Pending", d: "Today, 09:03" },
      { t: "Recurring charge", c: "Halima Yusuf", a: 15000, s: "Failed", d: "Yesterday" },
      { t: "Payout to bank", c: "Access ••1290", a: -6500000, s: "Completed", d: "Yesterday" },
    ],
  },
  {
    slug: "service-business",
    letter: "F",
    name: "Service Business",
    description: "For businesses that sell services instead of products.",
    sidebar: [
      { category: "Get Paid", items: ["Invoices", "Payment Links", "Recurring Payments"] },
      { category: "Clients", items: ["Customers"] },
      { category: "Finance", items: ["Transactions", "Balances", "Payouts"] },
      { category: "Workspace", items: ["Settings"] },
    ],
    addOns: [],
    hero: { label: "Revenue · 30 days", value: "₦12,640,000", sub: "From 42 clients" },
    metrics: [
      { k: "Invoices sent", v: "58", c: "+9 this month", tone: "up" },
      { k: "Outstanding", v: "₦3.8M", c: "11 unpaid", tone: "flag" },
      { k: "Overdue", v: "₦940K", c: "3 invoices", tone: "down" },
    ],
    chart: { title: "Revenue", a: "Paid", b: "Invoiced", baseA: 0.42, baseB: 0.5, unit: "₦M" },
    side: {
      title: "Outstanding invoices",
      rows: [
        { t: "INV-0231 · Zenith Events", s: "Due in 3 days", v: "₦1,450,000" },
        { t: "INV-0228 · Kola Law Firm", s: "Due in 6 days", v: "₦820,000" },
        { t: "INV-0219 · Pearl Clinic", s: "Overdue by 4 days", v: "₦540,000" },
        { t: "INV-0214 · Ayo Studios", s: "Overdue by 9 days", v: "₦400,000" },
      ],
    },
    activityTitle: "Recent client activity",
    activity: [
      { t: "Invoice paid · INV-0230", c: "Greenfield Schools", a: 1200000, s: "Paid", d: "Today, 10:14" },
      { t: "Invoice sent · INV-0231", c: "Zenith Events", a: 1450000, s: "Due", d: "Today, 09:30" },
      { t: "Retainer charge", c: "Kola Law Firm", a: 350000, s: "Successful", d: "Yesterday" },
      { t: "Payment link · Consultation", c: "Bisi Ogun", a: 50000, s: "Successful", d: "Oct 6" },
      { t: "Payout to bank", c: "UBA ••7712", a: -2400000, s: "Completed", d: "Oct 5" },
    ],
  },
  {
    slug: "wholesale-distribution",
    letter: "G",
    name: "Wholesale & Distribution",
    description: "For businesses handling bulk orders, stock and suppliers.",
    sidebar: [
      { category: "Sales", items: ["Orders", "Invoices", "Customers"] },
      { category: "Inventory", items: ["Products", "Inventory", "Suppliers"] },
      { category: "Finance", items: ["Transactions", "Balances", "Payouts"] },
      { category: "Workspace", items: ["Settings"] },
    ],
    addOns: ["Payment Links"],
    hero: { label: "Wholesale sales · 30 days", value: "₦86,300,000", sub: "From 412 bulk orders" },
    metrics: [
      { k: "Bulk orders", v: "412", c: "+7.9%", tone: "up" },
      { k: "Stock value", v: "₦142M", c: "18,420 units", tone: "up" },
      { k: "Supplier payments due", v: "₦21.5M", c: "5 this week", tone: "flag" },
    ],
    chart: { title: "Order volume", a: "Sales", b: "Supplier payments", baseA: 3.1, baseB: 1.8, unit: "₦M" },
    side: {
      title: "Stock levels",
      rows: [
        { t: "Golden Penny Flour 50kg", s: "1,240 bags", v: "Healthy" },
        { t: "Power Oil 25L", s: "310 kegs", v: "Healthy" },
        { t: "Indomie Carton (40)", s: "86 cartons", v: "Low" },
        { t: "Peak Milk Carton", s: "42 cartons", v: "Reorder" },
      ],
    },
    activityTitle: "Recent orders and suppliers",
    activity: [
      { t: "Bulk order #W-2210", c: "Kano Mart Ltd.", a: 4850000, s: "Paid", d: "Today, 10:40" },
      { t: "Invoice · INV-W-118", c: "Abuja Retail Hub", a: 3200000, s: "Due", d: "Today, 09:12" },
      { t: "Supplier payment", c: "Flour Mills of Nigeria", a: -8600000, s: "Pending", d: "Yesterday" },
      { t: "Bulk order #W-2209", c: "Onitsha Traders", a: 2150000, s: "Fulfilled", d: "Yesterday" },
      { t: "Settlement to bank", c: "First Bank ••3304", a: -12000000, s: "Completed", d: "Oct 5" },
    ],
  },
  {
    slug: "ecommerce-marketplace",
    letter: "H",
    name: "E-commerce & Marketplace",
    description: "For online businesses with larger order and stock needs.",
    sidebar: [
      { category: "Commerce", items: ["Online Store", "Orders", "Products", "Inventory", "Customers", "Suppliers"] },
      { category: "Payments", items: ["Transactions", "Balances", "Payouts", "Payment Links"] },
      { category: "Growth", items: ["Insights"] },
      { category: "Workspace", items: ["Settings", "Developers"] },
    ],
    addOns: ["Invoices"],
    hero: { label: "Online sales · 30 days", value: "₦64,780,000", sub: "From 4,912 orders" },
    metrics: [
      { k: "Orders", v: "4,912", c: "+21.3%", tone: "up" },
      { k: "Fulfilment rate", v: "97.4%", c: "+0.8 pts", tone: "up" },
      { k: "Products listed", v: "1,836", c: "24 out of stock", tone: "flag" },
    ],
    chart: { title: "Order performance", a: "Revenue", b: "Refunds", baseA: 2.2, baseB: 0.18, unit: "₦M" },
    side: {
      title: "Top categories",
      rows: [
        { t: "Fashion", s: "1,820 orders", v: "₦22.1M" },
        { t: "Beauty", s: "1,204 orders", v: "₦14.6M" },
        { t: "Home & Living", s: "862 orders", v: "₦12.9M" },
        { t: "Electronics", s: "418 orders", v: "₦10.3M" },
      ],
    },
    activityTitle: "Recent orders",
    activity: [
      { t: "Order #58210", c: "Adaeze Nnamdi", a: 128000, s: "Paid", d: "Today, 11:58" },
      { t: "Order #58209", c: "Yusuf Bello", a: 34500, s: "Processing", d: "Today, 11:41" },
      { t: "Refund · Order #58102", c: "Grace Okon", a: -22000, s: "Completed", d: "Today, 10:03" },
      { t: "Order #58208", c: "Femi Coker", a: 71200, s: "Fulfilled", d: "Today, 09:26" },
      { t: "Settlement to bank", c: "GTBank ••4821", a: -18400000, s: "Completed", d: "Yesterday" },
    ],
  },
  {
    slug: "payouts-transfers",
    letter: "I",
    name: "Payouts & Transfers",
    description: "For businesses that mainly use Griv to move and send money.",
    sidebar: [
      { category: "Money Movement", items: ["Transfers", "Payouts"] },
      { category: "Activity", items: ["Transactions"] },
      { category: "Finance", items: ["Balances"] },
      { category: "Workspace", items: ["Settings", "Developers"] },
    ],
    addOns: [],
    hero: { label: "Available balance", value: "₦58,200,000", sub: "Ready to send" },
    metrics: [
      { k: "Payouts · 30 days", v: "₦112.4M", c: "3,208 payouts", tone: "up" },
      { k: "Transfers · 30 days", v: "₦48.9M", c: "+12.6%", tone: "up" },
      { k: "Awaiting approval", v: "₦6.4M", c: "9 payouts", tone: "flag" },
    ],
    chart: { title: "Money sent", a: "Payouts", b: "Transfers", baseA: 3.7, baseB: 1.6, unit: "₦M" },
    side: {
      title: "Payout batches",
      rows: [
        { t: "Staff salaries · October", s: "84 recipients · Oct 25", v: "₦28.6M" },
        { t: "Vendor payments", s: "22 recipients · Oct 12", v: "₦9.4M" },
        { t: "Agent commissions", s: "140 recipients · Weekly", v: "₦4.1M" },
        { t: "Refund batch", s: "31 recipients · Today", v: "₦620K" },
      ],
    },
    activityTitle: "Recent money movement",
    activity: [
      { t: "Bulk payout · Agents", c: "140 recipients", a: -4100000, s: "Successful", d: "Today, 10:00" },
      { t: "Transfer to bank", c: "Zenith ••5520", a: -1500000, s: "Successful", d: "Today, 09:22" },
      { t: "Wallet top-up", c: "Access ••1290", a: 20000000, s: "Completed", d: "Yesterday" },
      { t: "Payout to vendor", c: "Prime Logistics", a: -860000, s: "Pending", d: "Yesterday" },
      { t: "Transfer to bank", c: "Opay ••9031", a: -45000, s: "Failed", d: "Oct 6" },
    ],
  },
  {
    slug: "subscriptions-recurring",
    letter: "J",
    name: "Subscriptions & Recurring Payments",
    description: "For businesses collecting repeat payments from customers.",
    sidebar: [
      { category: "Billing", items: ["Recurring Payments", "Scheduled Payments", "Payment Links", "Invoices"] },
      { category: "Customers", items: ["Customers"] },
      { category: "Finance", items: ["Transactions", "Balances", "Payouts"] },
      { category: "Workspace", items: ["Settings"] },
    ],
    addOns: [],
    hero: { label: "Monthly recurring revenue", value: "₦9,480,000", sub: "From 1,264 active subscriptions" },
    metrics: [
      { k: "Active subscriptions", v: "1,264", c: "+86 this month", tone: "up" },
      { k: "Payment success", v: "94.2%", c: "+2.1 pts", tone: "up" },
      { k: "Upcoming · 7 days", v: "₦2.6M", c: "348 charges", tone: "flag" },
    ],
    chart: { title: "Recurring revenue", a: "Collected", b: "Retried", baseA: 0.31, baseB: 0.04, unit: "₦M" },
    side: {
      title: "Upcoming collections",
      rows: [
        { t: "Gym membership · Monthly", s: "212 customers · Oct 24", v: "₦3.2M" },
        { t: "Meal plan · Weekly", s: "96 customers · Oct 21", v: "₦1.4M" },
        { t: "School fees · Termly", s: "48 customers · Nov 3", v: "₦7.2M" },
        { t: "Failed charges to retry", s: "22 customers · Tomorrow", v: "₦310K" },
      ],
    },
    activityTitle: "Recent billing activity",
    activity: [
      { t: "Recurring charge · Gym", c: "Tobi Ade", a: 15000, s: "Successful", d: "Today, 08:00" },
      { t: "Recurring charge · Meal plan", c: "Zainab Umar", a: 14500, s: "Successful", d: "Today, 08:00" },
      { t: "Recurring charge · Gym", c: "Kunle Ojo", a: 15000, s: "Failed", d: "Today, 08:00" },
      { t: "New subscription", c: "Ifeoma Chukwu", a: 15000, s: "Active", d: "Yesterday" },
      { t: "Scheduled charge · School fees", c: "Okafor family", a: 150000, s: "Scheduled", d: "Nov 3" },
    ],
  },
];

export const getGroup = (slug: string) => MERCHANT_GROUPS.find((g) => g.slug === slug);

/** All features a group shows, in menu order (Dashboard first). */
export const groupFeatures = (g: MerchantGroup): Feature[] => ["Dashboard", ...g.sidebar.flatMap((s) => s.items)];

/** Which category a feature sits under for a group: category name, "Add-on", or null. */
export function featurePlacement(g: MerchantGroup, f: Feature): string | null {
  if (f === "Dashboard") return "Top level";
  const s = g.sidebar.find((x) => x.items.includes(f));
  if (s) return s.category;
  return g.addOns.includes(f) ? "Add-on" : null;
}

/** Deterministic 30-day chart data so previews look realistic without randomness. */
export function chartSeries(seed: number, baseA: number, baseB: number) {
  return Array.from({ length: 30 }, (_, i) => {
    const a = baseA * (0.8 + Math.sin((i + seed) / 3) * 0.18 + (i / 30) * 0.35 + (((i + seed) * 7) % 5) * 0.03);
    const b = baseB * (0.85 + Math.cos((i + seed) / 4) * 0.15 + (((i + seed) * 3) % 4) * 0.04);
    const day = i + 9 > 30 ? `Oct ${i - 21}` : `Sep ${i + 9}`;
    return { d: day, a: +a.toFixed(2), b: +b.toFixed(2) };
  });
}

export const naira = (n: number) => `${n < 0 ? "−" : ""}₦${Math.abs(n).toLocaleString("en-NG")}`;
