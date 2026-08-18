import { create } from "zustand";
import { fetchTimezoneOptions, fetchTimeOptions, TimezoneOption, TimeOption } from "../api/meta.api";

interface MetaState {
  timezones: TimezoneOption[];
  timeOptions: TimeOption[];
  loaded: boolean;
  loading: boolean;
  loadMeta: () => Promise<void>;
}

export const useAvailabilityMetaStore = create<MetaState>((set, get) => ({
  timezones: [],
  timeOptions: [],
  loaded: false,
  loading: false,

  loadMeta: async () => {
    if (get().loaded || get().loading) return; // fetch once per session, never again
    set({ loading: true });
    try {
      const [timezones, timeOptions] = await Promise.all([
        fetchTimezoneOptions(),
        fetchTimeOptions(),
      ]);
      set({ timezones, timeOptions, loaded: true, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));