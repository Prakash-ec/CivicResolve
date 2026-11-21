import { useState, useEffect, useCallback } from 'react';
import { citizenService } from '../services/api.js';

export interface OfflineDraft {
  id: string;
  idempotencyKey: string;
  title: string;
  description: string;
  category: string;
  location?: {
    lat: number;
    lng: number;
    addressText: string;
    ward?: string;
  };
  createdAt: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  errorMessage?: string;
}

const STORAGE_KEY = 'civicresolve_offline_drafts_v1';

export function useOfflineDrafts() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [drafts, setDrafts] = useState<OfflineDraft[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Sync state to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
    } catch (e) {
      console.warn('Failed to persist offline drafts:', e);
    }
  }, [drafts]);

  // Network online/offline listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const saveDraft = useCallback(
    (draft: Omit<OfflineDraft, 'id' | 'idempotencyKey' | 'createdAt' | 'status'>) => {
      const newDraft: OfflineDraft = {
        ...draft,
        id: `draft_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        idempotencyKey: `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        createdAt: new Date().toISOString(),
        status: 'pending',
      };
      setDrafts((prev) => [newDraft, ...prev]);
      return newDraft;
    },
    []
  );

  const removeDraft = useCallback((draftId: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== draftId));
  }, []);

  const syncDrafts = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;

    const pending = drafts.filter((d) => d.status === 'pending' || d.status === 'failed');
    if (pending.length === 0) return;

    setIsSyncing(true);

    for (const draft of pending) {
      try {
        // Mark syncing
        setDrafts((prev) =>
          prev.map((d) => (d.id === draft.id ? { ...d, status: 'syncing' } : d))
        );

        // Submit to backend with stable idempotencyKey
        await citizenService.submitComplaint({
          idempotencyKey: draft.idempotencyKey,
          clientDraftId: draft.id,
          title: draft.title,
          description: draft.description,
          userCategory: draft.category,
          latitude: draft.location?.lat,
          longitude: draft.location?.lng,
          addressText: draft.location?.addressText,
          ward: draft.location?.ward,
        });

        // Successfully synced — remove from offline queue
        setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
      } catch (err: any) {
        // Record error and keep in storage for retry
        setDrafts((prev) =>
          prev.map((d) =>
            d.id === draft.id
              ? { ...d, status: 'failed', errorMessage: err.message || 'Sync failed' }
              : d
          )
        );
      }
    }

    setIsSyncing(false);
  }, [drafts, isSyncing]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && drafts.some((d) => d.status === 'pending' || d.status === 'failed')) {
      syncDrafts();
    }
  }, [isOnline, drafts, syncDrafts]);

  const pendingCount = drafts.filter((d) => d.status === 'pending' || d.status === 'failed').length;

  return {
    isOnline,
    drafts,
    pendingCount,
    isSyncing,
    saveDraft,
    removeDraft,
    syncDrafts,
  };
}
