"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { initialMedia } from "@/data/media";
import type { MediaItem, NewMediaInput } from "@/types/media";

const STORAGE_KEY = "soha-media-library-v1";

export function useMediaLibrary() {
  const [items, setItems] = useState<MediaItem[]>(initialMedia);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let parsedItems: MediaItem[] | null = null;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as MediaItem[];
        if (Array.isArray(parsed)) parsedItems = parsed;
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }

    const hydrationTimer = window.setTimeout(() => {
      if (parsedItems) setItems(parsedItems);
      setIsReady(true);
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage may be full or disabled. The in-memory session still works.
    }
  }, [isReady, items]);

  const addItem = useCallback((input: NewMediaInput) => {
    const newItem: MediaItem = {
      ...input,
      id: crypto.randomUUID(),
      views: 0,
      likes: 0,
      createdAt: new Date().toISOString(),
    };
    setItems((current) => [newItem, ...current]);
    return newItem;
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const togglePublished = useCallback((id: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, published: !item.published } : item,
      ),
    );
  }, []);

  const likeItem = useCallback((id: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, likes: item.likes + 1 } : item,
      ),
    );
  }, []);

  const publishedItems = useMemo(
    () => items.filter((item) => item.published),
    [items],
  );

  return {
    items,
    publishedItems,
    addItem,
    removeItem,
    togglePublished,
    likeItem,
  };
}
