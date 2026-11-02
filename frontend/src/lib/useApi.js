import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";

// Small data-fetching hook: { data, error, loading, reload }.
// Previous data stays on screen while a reload is in flight.
export function useApi(path, { skip = false } = {}) {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState({ key: null, data: null, error: "" });
  const key = skip || !path ? null : `${path}#${tick}`;

  useEffect(() => {
    if (!key) return undefined;
    let ignore = false;
    api
      .get(path)
      .then((res) => !ignore && setState({ key, data: res.data, error: "" }))
      .catch((err) => !ignore && setState((prev) => ({ key, data: prev.data, error: err.message })));
    return () => {
      ignore = true;
    };
  }, [key, path]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  return { data: state.data, error: state.error, loading: Boolean(key) && state.key !== key, reload };
}
