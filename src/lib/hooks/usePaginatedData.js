import { useState, useEffect, useCallback, useRef } from "react";

export function usePaginatedData(fetchFn, deps, itemsPerPage = 50) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Each fetch gets a unique incrementing ID. Only the latest fetch may update state,
  // preventing stale/out-of-order responses from overwriting fresh results.
  const fetchIdRef = useRef(0);

  // NOTE: currentPage is intentionally NOT in load's deps.
  // Page is always passed explicitly, so we don't recreate load on every page change
  // (which would cause the second useEffect to double-fire alongside the first).
  const load = useCallback(async (page) => {
    const fetchId = ++fetchIdRef.current;
    setLoading(true);
    try {
      const offset = ((page ?? 1) - 1) * itemsPerPage;
      const res = await fetchFn(offset, itemsPerPage);
      // Discard results from superseded fetches (race condition guard)
      if (fetchId !== fetchIdRef.current) return;
      setData(res.documents || []);
      setTotal(res.total || 0);
    } finally {
      if (fetchId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, [fetchFn, itemsPerPage]); // eslint-disable-line react-hooks/exhaustive-deps

  // When filter/fetchFn changes: reset to page 1 and reload
  useEffect(() => {
    setCurrentPage(1);
    load(1);
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  // When user manually changes page (and load hasn't already changed)
  useEffect(() => {
    load(currentPage);
  }, [currentPage, load]);

  return { data, total, loading, currentPage, setCurrentPage, reload: () => load(currentPage) };
}
