export type MediaType = "image" | "video" | "text";

export type MediaCategory = string;

export interface ScienceQuestion {
  question: string;
  answer: string;
}

export interface ScienceReference {
  title: string;
  url: string;
}

export type VisualKind = "unspecified" | "observation" | "illustration" | "simulation" | "ai-generated";

export interface MediaSeo {
  slug: string;
  title: string;
  description: string;
  altText: string;
  shareImage: string;
  sourceUrl: string;
  indexable: boolean;
  publishedAt: string;
  /** Curated answer, not generated or inferred automatically. */
  answer: string;
  faqs: ScienceQuestion[];
  references: ScienceReference[];
  authorName: string;
  visualKind: VisualKind;
  /** Historical slugs retained for permanent redirects. */
  aliases?: string[];
}


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
  seo?: MediaSeo;
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
  seo?: MediaSeo;
}
