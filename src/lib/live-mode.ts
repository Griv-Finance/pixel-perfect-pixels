import { createDemoStore } from "./demo-store";

/** Test/Live switch shared by every dashboard page so it doesn't reset when you change page. */
const store = createDemoStore(true);
export const useLiveMode = () => store.use();
export const setLiveMode = (v: boolean) => store.set(v);
