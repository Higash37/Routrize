/** クライアントサイドの教材型 (camelCase) */

export type BookSection = {
  id: string;
  title: string;
  startPage: number;
  endPage: number;
};

export type BookChapter = {
  id: string;
  title: string;
  startPage: number;
  endPage: number;
  sections: BookSection[];
};

export type BookResourceType = "video" | "link" | "file";

export type BookResource = {
  id: string;
  type: BookResourceType;
  url: string;
  title: string;
};

/**
 * ゲスト時はLocalStorageに保存、ログイン後はDBのbooksテーブルと同期。
 * DB固有フィールド (visibility, usageCount等) はオプショナル。
 */
export type RegisteredBook = {
  id: string;
  title: string;
  subject: string;
  fields: string[];
  targetGrade: string;
  tags: string[];
  totalPages: number;
  chapters: BookChapter[];
  coverImageUrl: string | null;
  description: string;
  resources: BookResource[];
  createdAt: string;

  // DB同期後に付与されるフィールド
  organizationId?: string | null;
  creatorUserId?: string | null;
  visibility?: "private" | "public";
  publishedAt?: string | null;
  usageCount?: number;
  likeCount?: number;
};
