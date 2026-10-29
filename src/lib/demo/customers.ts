import { createDemoStore } from "@/lib/demo-store";
/** SAMPLE DATA — fictional customers. Not real people. */
export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  country: "Nigeria" | "Ghana" | "Kenya" | "South Africa" | "United States" | "United Kingdom";
  /** Individual person or registered organisation. */
  kind: "user" | "org";
  /** Street address for billing, when known. */
  address?: string;
  /** Optional business details for organisations. */
  registrationNumber?: string;
  taxId?: string;
};

export const CUSTOMER_COUNTRIES: Customer["country"][] = ["Nigeria", "Ghana", "Kenya", "South Africa", "United States", "United Kingdom"];

export const CUSTOMERS: Customer[] = [
  { id: "cus_01", name: "Chioma Eze", email: "chioma.eze@example.com", phone: "+234 803 412 7781", city: "Lagos", country: "Nigeria", kind: "user" },
  { id: "cus_02", name: "Bluefin Hotels Ltd.", email: "accounts@bluefinhotels.example", phone: "+234 809 220 1145", city: "Lagos", country: "Nigeria", kind: "org" },
  { id: "cus_03", name: "Tunde Bakare", email: "tunde.b@example.com", phone: "+234 802 671 9903", city: "Ibadan", country: "Nigeria", kind: "user" },
  { id: "cus_04", name: "Amaka Stores", email: "hello@amakastores.example", phone: "+234 816 300 4471", city: "Onitsha", country: "Nigeria", kind: "org" },
  { id: "cus_05", name: "Ngozi Adeyemi", email: "ngozi.adeyemi@example.com", phone: "+234 805 118 2290", city: "Abuja", country: "Nigeria", kind: "user" },
  { id: "cus_06", name: "Ibrahim Musa", email: "ibrahim.musa@example.com", phone: "+234 703 554 8812", city: "Kano", country: "Nigeria", kind: "user" },
  { id: "cus_07", name: "Kemi Ajayi", email: "kemi.ajayi@example.com", phone: "+234 810 442 0017", city: "Lagos", country: "Nigeria", kind: "user" },
  { id: "cus_08", name: "Emeka Obi", email: "emeka.obi@example.com", phone: "+234 806 993 3104", city: "Enugu", country: "Nigeria", kind: "user" },
  { id: "cus_09", name: "Greenfield Schools", email: "bursar@greenfield.example", phone: "+234 908 210 7765", city: "Port Harcourt", country: "Nigeria", kind: "org" },
  { id: "cus_10", name: "Zenith Events Co.", email: "finance@zenithevents.example", phone: "+234 813 776 2201", city: "Lagos", country: "Nigeria", kind: "org" },
  { id: "cus_11", name: "Funmi Bello", email: "funmi.bello@example.com", phone: "+234 802 330 6618", city: "Lagos", country: "Nigeria", kind: "user" },
  { id: "cus_12", name: "Halima Yusuf", email: "halima.y@example.com", phone: "+234 701 228 4490", city: "Kaduna", country: "Nigeria", kind: "user" },
  { id: "cus_13", name: "Segun Adeleke", email: "segun.adeleke@example.com", phone: "+234 807 665 1123", city: "Abeokuta", country: "Nigeria", kind: "user" },
  { id: "cus_14", name: "Pearl Clinic", email: "billing@pearlclinic.example", phone: "+234 909 118 5540", city: "Abuja", country: "Nigeria", kind: "org" },
  { id: "cus_15", name: "Tola Martins", email: "tola.martins@example.com", phone: "+234 812 904 7720", city: "Lagos", country: "Nigeria", kind: "user" },
  { id: "cus_16", name: "Adaeze Nnamdi", email: "adaeze.n@example.com", phone: "+234 806 501 3398", city: "Owerri", country: "Nigeria", kind: "user" },
  { id: "cus_17", name: "Kwame Mensah", email: "kwame.mensah@example.com", phone: "+233 24 410 7721", city: "Accra", country: "Ghana", kind: "user" },
  { id: "cus_18", name: "Akosua Boateng", email: "akosua.b@example.com", phone: "+233 20 655 1180", city: "Kumasi", country: "Ghana", kind: "user" },
  { id: "cus_19", name: "Wanjiru Kamau", email: "wanjiru.k@example.com", phone: "+254 712 330 448", city: "Nairobi", country: "Kenya", kind: "user" },
  { id: "cus_20", name: "Otieno Ochieng", email: "otieno.o@example.com", phone: "+254 722 901 116", city: "Mombasa", country: "Kenya", kind: "user" },
  { id: "cus_21", name: "Kola Law Firm", email: "accounts@kolalaw.example", phone: "+234 814 220 9076", city: "Lagos", country: "Nigeria", kind: "org" },
  { id: "cus_22", name: "Grace Okon", email: "grace.okon@example.com", phone: "+234 803 778 2215", city: "Uyo", country: "Nigeria", kind: "user" },
  { id: "cus_23", name: "Yusuf Bello", email: "yusuf.bello@example.com", phone: "+234 705 330 1879", city: "Ilorin", country: "Nigeria", kind: "user" },
  { id: "cus_24", name: "Femi Coker", email: "femi.coker@example.com", phone: "+234 802 115 6604", city: "Lagos", country: "Nigeria", kind: "user" },
];

/** Shared customer store so customers created from the invoice editor show up everywhere. */
export const customersStore = createDemoStore<Customer[]>(CUSTOMERS);
export const useCustomers = () => customersStore.use();
export const getCustomer = (id: string) => customersStore.get().find((c) => c.id === id);
export const customerByName = (name: string) => customersStore.get().find((c) => c.name === name);

export function addCustomer(input: Omit<Customer, "id">): Customer {
  const c: Customer = { ...input, id: `cus_${Date.now().toString(36)}` };
  customersStore.set((all) => [c, ...all]);
  return c;
}

export function updateCustomer(id: string, patch: Partial<Omit<Customer, "id">>) {
  customersStore.set((all) => all.map((c) => (c.id === id ? { ...c, ...patch } : c)));
}
