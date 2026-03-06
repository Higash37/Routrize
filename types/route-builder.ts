import type { BookChapter } from "@/types/book";

export type { BookChapter };
export type { BookSection } from "@/types/book";

export type SubTaskSize = "sm" | "md" | "lg";

export type SubTask = {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
};

/** サブタスクの期間からサイズを自動判定 */
export function getSubTaskSize(startDate: string, endDate: string): SubTaskSize {
  const days = Math.round(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (days <= 14) return "sm";
  if (days <= 30) return "md";
  return "lg";
}

export type RouteItemState = {
  id: string;
  bookId: string;
  title: string;
  subject: string;
  fields: string[];
  color: string;
  targetGrade: string;
  tags: string[];
  difficulty: number;
  importance: number;
  memo: string;
  totalPages: number;
  chapters: BookChapter[];
  targetRounds: number;
  subtasks: SubTask[];
  coverImageUrl: string | null;
  sortIndex: number;
  startDate: string;
  endDate: string;
};

export type RouteState = {
  title: string;
  startDate: string;
  months: number;
  items: RouteItemState[];
  selectedItemId: string | null;
};

export type RouteItemUpdatable = Partial<Pick<RouteItemState, "startDate" | "endDate" | "sortIndex" | "coverImageUrl" | "subject" | "fields" | "color" | "targetGrade" | "tags" | "difficulty" | "importance" | "memo" | "totalPages" | "chapters" | "targetRounds" | "subtasks">>;

export type RouteAction =
  | { type: "SET_TITLE"; title: string }
  | { type: "SET_START_DATE"; date: string }
  | { type: "SET_MONTHS"; months: number }
  | { type: "ADD_ITEM"; item: RouteItemState }
  | { type: "REMOVE_ITEM"; itemId: string }
  | { type: "UPDATE_ITEM"; itemId: string; changes: RouteItemUpdatable }
  | { type: "REORDER_ITEMS"; itemIds: string[] }
  | { type: "SELECT_ITEM"; itemId: string | null }
  | { type: "LOAD_ROUTE"; state: RouteState };

export type MockBook = {
  id: string;
  title: string;
  subject: string;
  coverImageUrl: string | null;
  level: "basic" | "standard" | "advanced";
};
