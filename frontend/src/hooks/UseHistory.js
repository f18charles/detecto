import { useQuery } from '@tanstack/react-query';
import { history } from '../api/Client';

export const historyQueryKey = ['history'];
const CACHE_KEY = 'detecto_history_cache';

export const getCachedHistory = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const setCachedHistory = (data) => {
  try {
    if (Array.isArray(data)) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    }
  } catch {
    // Ignore storage quota errors
  }
};

export const useHistory = (params) => {
  return useQuery({
    queryKey: params ? [...historyQueryKey, params] : historyQueryKey,
    queryFn: async () => {
      try {
        const data = await history(params);
        if (!params && Array.isArray(data)) {
          setCachedHistory(data);
        }
        return data;
      } catch (err) {
        const cached = getCachedHistory();
        if (cached && cached.length > 0) {
          return cached;
        }
        throw err;
      }
    },
  });
};