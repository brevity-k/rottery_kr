/**
 * App-wide constants. Single source of truth for values used across components.
 */

/** Site configuration */
export const SITE_URL = "https://lottery.io.kr";
export const SITE_NAME = "로또리";
export const OWNER_EMAIL = "brevity1s.wos@gmail.com";

/** Google Analytics 4 measurement ID */
export const GA4_MEASUREMENT_ID = "G-TCRP4JXV63";

/** Kakao JavaScript SDK app key (registered at developers.kakao.com) */
export const KAKAO_APP_KEY = "accfcea8c90806c685d4321fa93a4501";

/** Lottery number configuration */
export const LOTTO_MIN_NUMBER = 1;
export const LOTTO_MAX_NUMBER = 45;
export const LOTTO_NUMBERS_PER_SET = 6;
export const LOTTO_HIGH_LOW_THRESHOLD = 22;
export const LOTTO_TICKET_PRICE = 1_000;
export const LOTTO_FIRST_DRAW_DATE = "2002-12-07";

/** Number section boundaries for balanced recommendations */
export const LOTTO_SECTIONS: readonly [number, number][] = [
  [1, 9],
  [10, 18],
  [19, 27],
  [28, 36],
  [37, 45],
];

/** Saturday draw time in KST */
export const LOTTO_DRAW_HOUR = 20;
export const LOTTO_DRAW_MINUTE = 45;

/** Approximate delay (minutes) after Sunday 00:00 KST for results to be available */
export const LOTTO_RESULTS_DELAY_MINUTES = 15;

/** Default counts for data queries */
export const DEFAULT_RECENT_DRAWS = 20;
export const DEFAULT_RECENT_RESULTS = 10;
