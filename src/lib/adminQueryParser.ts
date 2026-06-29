import { escapeRegExp } from '@/lib/validation';

// ─── Types ─────────────────────────────────────────────────────────────────

type SortMap = Record<string, Record<string, 1 | -1>>;

interface AdminQueryOptions {
  /** Allowed sort keys → MongoDB sort objects. Unknown keys fall back to defaultSort. */
  sortWhitelist: SortMap;
  /** Key in sortWhitelist to use when no sort param is given or the value is unknown. */
  defaultSort: string;
  /** Items per page — NEVER read from the URL. Default: 20. */
  pageLimit?: number;
  /** Maximum allowed page index (prevents absurd skip() values). Default: 9999. */
  maxPage?: number;
  /** Maximum search string length. Longer values return a 400. Default: 100. */
  maxSearchLength?: number;
}

type AdminQueryOk = {
  ok: true;
  page: number;
  limit: number;
  skip: number;
  /** Trimmed, length-validated raw search string (empty string if no search). */
  search: string;
  /** Escaped RegExp ready to use in MongoDB queries. null if no search term. */
  searchRegex: RegExp | null;
  sortOrder: Record<string, 1 | -1>;
};

type AdminQueryError = {
  ok: false;
  message: string;
  status: number;
};

export type AdminQueryResult = AdminQueryOk | AdminQueryError;

// ─── Parser ────────────────────────────────────────────────────────────────

export function parseAdminQuery(
  searchParams: URLSearchParams,
  options: AdminQueryOptions,
): AdminQueryResult {
  const {
    sortWhitelist,
    defaultSort,
    pageLimit      = 20,
    maxPage        = 9999,
    maxSearchLength = 100,
  } = options;

  // ── Pagination ────────────────────────────────────────────────────────────
  // limit is NEVER sourced from the URL — it is always the configured constant
  const limit = pageLimit;
  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const page = Math.min(Math.max(1, isNaN(rawPage) ? 1 : rawPage), maxPage);
  const skip = (page - 1) * limit;

  // ── Search ────────────────────────────────────────────────────────────────
  const rawSearch = (searchParams.get('search') ?? '').trim();

  if (rawSearch.length > maxSearchLength) {
    return {
      ok: false,
      message: `Search query is too long (max ${maxSearchLength} characters)`,
      status: 400,
    };
  }

  const search = rawSearch;
  // null = no search — callers skip $or entirely, which is faster than regex('')
  const searchRegex: RegExp | null = search.length > 0
    ? new RegExp(escapeRegExp(search), 'i')
    : null;

  // ── Sort (strict whitelist — unknown values silently fall back) ───────────
  const sortParam = searchParams.get('sort') ?? defaultSort;
  const sortOrder = sortWhitelist[sortParam] ?? sortWhitelist[defaultSort];

  return { ok: true, page, limit, skip, search, searchRegex, sortOrder };
}
