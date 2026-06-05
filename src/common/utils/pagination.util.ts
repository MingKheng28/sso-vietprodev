export interface PageQuery { limit?: number; offset?: number; }
export const normalizePage = (query: PageQuery) => ({ limit: Math.min(Number(query.limit ?? 50), 200), offset: Math.max(Number(query.offset ?? 0), 0) });
