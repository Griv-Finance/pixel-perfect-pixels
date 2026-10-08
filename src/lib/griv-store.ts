import { useSyncExternalStore } from "react";

export type GrivState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  businessName: string;
  country: string;
  businessType: string;
  state: string;
  city: string;
  address: string;
  industry: string;
  description: string;
  website: string;
  customerPay: string[];
  payOthers: string[];
  capabilities: string[];
  getPaid: string[];
  onboarded: boolean;
};

const initial: GrivState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  businessName: "",
  country: "Nigeria",
  businessType: "",
  state: "",
  city: "",
  address: "",
  industry: "",
  description: "",
  website: "",
  customerPay: [],
  payOthers: [],
  capabilities: [],
  getPaid: [],
  onboarded: false,
};

const KEY = "griv-demo-state";
let state: GrivState = initial;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (raw) state = { ...initial, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
}

export function setGriv(patch: Partial<GrivState>) {
  load();
  state = { ...state, ...patch };
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function useGriv(): GrivState {
  return useSyncExternalStore(
    (cb) => {
      load();
      listeners.add(cb);
      cb();
      return () => listeners.delete(cb);
    },
    () => state,
    () => initial,
  );
}

export function toggleIn(list: string[], v: string) {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}
