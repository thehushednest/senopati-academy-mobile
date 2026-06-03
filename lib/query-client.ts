/**
 * TanStack Query client + AsyncStorage persistence supaya data terakhir
 * tetap muncul instant saat reload / offline.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 menit — data fresh selama 1 menit
      gcTime: 24 * 60 * 60 * 1000, // 24 jam di-keep cache offline
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "senopati.query-cache",
  throttleTime: 1000,
});
