export type GradeCategory =
  | "幼児"
  | "小学生"
  | "中学生"
  | "高校生"
  | "大学受験"
  | "その他";

export type SubjectPreset = {
  category: GradeCategory;
  subjects: string[];
};

export const GRADE_CATEGORIES: GradeCategory[] = [
  "幼児",
  "小学生",
  "中学生",
  "高校生",
  "大学受験",
  "その他",
];

export const DEFAULT_SUBJECT_PRESETS: SubjectPreset[] = [
  {
    category: "幼児",
    subjects: ["ひらがな", "カタカナ", "すうじ", "えいご"],
  },
  {
    category: "小学生",
    subjects: ["国語", "算数", "理科", "社会", "英語", "生活"],
  },
  {
    category: "中学生",
    subjects: ["国語", "数学", "英語", "理科", "社会", "音楽", "美術", "保健体育", "技術・家庭"],
  },
  {
    category: "高校生",
    subjects: [
      "現代の国語", "言語文化", "古典探究",
      "数学I", "数学II", "数学III", "数学A", "数学B", "数学C",
      "英語コミュニケーションI", "英語コミュニケーションII", "英語コミュニケーションIII", "論理・表現I", "論理・表現II", "論理・表現III",
      "物理基礎", "物理", "化学基礎", "化学", "生物基礎", "生物", "地学基礎", "地学",
      "地理総合", "地理探究", "歴史総合", "日本史探究", "世界史探究", "公共", "政治・経済", "倫理",
      "情報I",
    ],
  },
  {
    category: "大学受験",
    subjects: [
      "英語", "数学", "現代文", "古文", "漢文",
      "物理", "化学", "生物", "地学",
      "日本史", "世界史", "地理", "政治経済", "倫理",
      "小論文",
    ],
  },
  {
    category: "その他",
    subjects: ["プログラミング", "簿記", "TOEIC", "TOEFL", "英検"],
  },
];
