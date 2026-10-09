/**
 * Shared primitives. The book's own shapes live in `core/model.ts`. IDs are
 * client-generated strings for now; swap for server IDs once the API exists.
 */

export type Id = string;

/** A single line written on one of the sheets (Values, Anti-goals, …). */
export interface SheetLine {
  id: Id;
  text: string;
}

/** Local calendar day as an ISO `YYYY-MM-DD` string. */
export type ISODate = string;

/** Minutes after midnight, e.g. 6:30 AM = 390. */
export type ClockTime = number;
