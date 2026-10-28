export type MediaType = "image" | "video" | "text";

export type MediaCategory =
  | "سحابی‌ها"
  | "کهکشان‌ها"
  | "منظومه شمسی"
  | "ماه"
  | "ویدیوها"
  | "نوشته‌ها";

export interface MediaItem {
  id: string;
  title: string;
  description: string;
  type: MediaType;
  category: MediaCategory;
  image: string;
  videoUrl?: string;
  duration?: string;
  capturedAt: string;
  views: number;
  likes: number;
  featured?: boolean;
  published: boolean;
  createdAt: string;
}

export interface NewMediaInput {
  title: string;
  description: string;
  type: MediaType;
  category: MediaCategory;
  image: string;
  videoUrl?: string;
  capturedAt: string;
  published: boolean;
}
