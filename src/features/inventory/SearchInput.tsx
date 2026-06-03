import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

/** Controlled free-text search box; debouncing happens upstream in the hook. */
export function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search make, model, trim, VIN, or lot…"
        aria-label="Search inventory"
        className="w-full rounded-lg border border-slate-800 bg-slate-900/60 py-2.5 pl-10 pr-10 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 light:border-slate-300 light:bg-white light:text-slate-900 light:placeholder:text-slate-400"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-200 light:hover:bg-slate-100 light:hover:text-slate-800"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
