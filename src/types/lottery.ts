export interface LottoResult {
  drwNo: number;
  drwNoDate: string;
  drwtNo1: number;
  drwtNo2: number;
  drwtNo3: number;
  drwtNo4: number;
  drwtNo5: number;
  drwtNo6: number;
  bnusNo: number;
  firstWinamnt: number;
  firstPrzwnerCo: number;
  totSellamnt: number;
  returnValue: string;
}

export interface LottoNumbers {
  numbers: number[];
  bonusNumber: number;
}

export interface RecommendedSet {
  label: string;
  numbers: number[];
}

export type RecommendMethod =
  | "random"
  | "statistics"
  | "hot"
  | "cold"
  | "balanced"
  | "ai";

export interface NumberFrequency {
  number: number;
  count: number;
  percentage: number;
}

export interface LottoStats {
  totalDraws: number;
  frequencies: NumberFrequency[];
  recentFrequencies: NumberFrequency[];
  oddEvenRatio: { odd: number; even: number };
  highLowRatio: { high: number; low: number };
  mostCommon: number[];
  leastCommon: number[];
  hottestNumbers: number[];
  coldestNumbers: number[];
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  content: string;
  date: string;
  category: string;
  tags: string[];
}
