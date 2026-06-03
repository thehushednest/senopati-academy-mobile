/**
 * Query hooks — wrap API calls dengan TanStack Query supaya dapet cache,
 * dedupe, loading state, dan offline persistence otomatis.
 */
import { useQuery } from "@tanstack/react-query";
import { fetchModul, fetchModulList, LAUNCH_MODULES } from "./api";

export function useModulList() {
  return useQuery({
    queryKey: ["modul-list"],
    queryFn: async () => {
      const res = await fetchModulList();
      return res.items;
    },
    // Kalau API fail (offline first time), pakai fallback hard-coded.
    placeholderData: LAUNCH_MODULES,
  });
}

export function useModul(slug: string | undefined) {
  return useQuery({
    queryKey: ["modul", slug],
    queryFn: async () => {
      if (!slug) throw new Error("Missing slug");
      const res = await fetchModul(slug);
      return res.course;
    },
    enabled: !!slug,
  });
}
