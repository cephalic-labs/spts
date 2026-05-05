import { useState, useEffect, useCallback } from "react";

export function usePaginatedData(fetchFn, deps, itemsPerPage = 50) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const load = useCallback(async (page = currentPage) => {
    setLoading(true);
    try {
      const offset = (page - 1) * itemsPerPage;
      const res = await fetchFn(offset, itemsPerPage);
      setData(res.documents || []);
      setTotal(res.total || 0);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, currentPage, itemsPerPage]);

  useEffect(() => { 
    setCurrentPage(1); 
    load(1); 
  }, deps);

  useEffect(() => { 
    load(); 
  }, [currentPage, load]);

  return { data, total, loading, currentPage, setCurrentPage, reload: load };
}
