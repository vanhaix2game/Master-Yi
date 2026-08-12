// useAsync — không memory leak, abort controller
function useAsync<T>(fn: (signal: AbortSignal) => Promise<T>, deps: any[] = []) {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: Error | null }>({
    data: null, loading: true, error: null,
  });

  useEffect(() => {
    const abort = new AbortController();
    let cancelled = false;

    setState(s => ({ ...s, loading: true, error: null }));
    fn(abort.signal)
      .then(data => { if (!cancelled) setState({ data, loading: false, error: null }); })
      .catch(error => { if (!cancelled) setState({ data: null, loading: false, error }); });

    return () => { cancelled = true; abort.abort(); };
  }, deps);

  return state;
}

// useDebounce
function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// useLocalStorage
function useLocalStorage<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
    } catch { return initial; }
  });

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { console.warn(`Failed to save ${key} to localStorage`); }
  }, [key, value]);

  return [value, setValue];
}
