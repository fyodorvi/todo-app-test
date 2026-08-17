import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { searchAddresses, type NominatimResult } from "@/api/nominatim";
import type { TodoLocation } from "@/api/todos";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatShortAddress, formatShortAddressFromText } from "@/lib/formatShortAddress";
import { cn } from "@/lib/utils";

type AddressAutocompleteProps = {
  value: TodoLocation | null;
  onChange: (location: TodoLocation | null) => void;
  disabled?: boolean;
};

export function AddressAutocomplete({ value, onChange, disabled }: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value?.text ?? "");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [searched, setSearched] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const debouncedQuery = useDebouncedValue(query, 1000);

  function abortPendingSearch() {
    abortRef.current?.abort();
    abortRef.current = null;
  }

  useEffect(() => {
    return () => {
      abortPendingSearch();
    };
  }, []);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();

    if (value && query === value.text) {
      setLoading(false);
      setResults([]);
      setOpen(false);
      return;
    }

    if (trimmed.length < 3) {
      abortPendingSearch();
      setResults([]);
      setLoading(false);
      setError(null);
      setSearched(false);
      return;
    }

    if (value?.text === trimmed) {
      setResults([]);
      setLoading(false);
      setSearched(false);
      return;
    }

    abortPendingSearch();
    const controller = new AbortController();
    abortRef.current = controller;

    async function fetchResults() {
      setLoading(true);
      setError(null);

      try {
        const data = await searchAddresses(trimmed, controller.signal);
        if (!controller.signal.aborted) {
          setResults(data);
          setOpen(true);
          setSearched(true);
        }
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }
        setResults([]);
        setError(err instanceof Error ? err.message : "Address search failed");
        setSearched(true);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void fetchResults();

    return () => {
      controller.abort();
    };
  }, [debouncedQuery, query, value]);

  function handleSelect(result: NominatimResult) {
    abortPendingSearch();

    const shortText = result.address
      ? formatShortAddress(result.address)
      : formatShortAddressFromText(result.display_name);

    const location: TodoLocation = {
      text: result.display_name,
      shortText: shortText || result.display_name,
      lat: Number.parseFloat(result.lat),
      lon: Number.parseFloat(result.lon),
    };

    setQuery(result.display_name);
    onChange(location);
    setResults([]);
    setOpen(false);
    setSearched(false);
    setLoading(false);
    setError(null);
  }

  const showNoResults =
    !value && searched && !loading && query.trim().length >= 3 && results.length === 0 && !error;

  return (
    <div className="space-y-2">
      <Label htmlFor="address">Address</Label>
      <div className="relative">
        <Input
          id="address"
          value={query}
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            if (value && next !== value.text) {
              onChange(null);
            }
            setOpen(true);
            setSearched(false);
          }}
          onFocus={() => {
            if (results.length > 0) {
              setOpen(true);
            }
          }}
          placeholder="Start typing an address..."
          disabled={disabled}
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}

        {error && (
          <p className="absolute top-full left-0 mt-1 text-xs text-destructive">{error}</p>
        )}

        {showNoResults && (
          <p className="absolute top-full left-0 z-50 mt-1 rounded-md border bg-popover px-3 py-2 text-xs text-muted-foreground shadow-md">
            No addresses found
          </p>
        )}

        {open && results.length > 0 && (
          <ul className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover shadow-md">
            {results.map((result) => (
              <li key={`${result.lat}-${result.lon}-${result.display_name}`}>
                <button
                  type="button"
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                    value?.text === result.display_name && "bg-accent",
                  )}
                  onClick={() => handleSelect(result)}
                  disabled={disabled}
                >
                  {result.display_name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
