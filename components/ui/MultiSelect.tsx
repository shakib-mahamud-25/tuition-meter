'use client';

import { useState, useRef, useEffect } from 'react';

interface MultiSelectProps {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  allowCustom?: boolean;
  onAddNew?: (value: string) => void;
  error?: string;
  id?: string;
}

export default function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Search subjects...',
  label,
  required,
  allowCustom = false,
  onAddNew,
  error,
  id,
}: MultiSelectProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? options.filter(
        (o) =>
          o.toLowerCase().includes(query.toLowerCase()) && !value.includes(o)
      )
    : options.filter((o) => !value.includes(o)).slice(0, 10);

  const exactMatch = options.some((o) => o.toLowerCase() === query.toLowerCase());
  const showAddNew = allowCustom && query.trim().length > 1 && !exactMatch;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function toggleOption(opt: string) {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else {
      onChange([...value, opt]);
    }
    setQuery('');
  }

  function removeItem(item: string) {
    onChange(value.filter((v) => v !== item));
  }

  function handleAddNew() {
    if (onAddNew && query.trim()) {
      onAddNew(query.trim());
      onChange([...value, query.trim()]);
      setQuery('');
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-[#0F172A] mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Tags + input wrapper */}
      <div
        className={`min-h-[42px] w-full px-2 py-1.5 border rounded bg-white flex flex-wrap gap-1.5 cursor-text transition-colors ${
          error ? 'border-red-400' : open ? 'border-[#059669]' : 'border-[#CBD5E1]'
        }`}
        onClick={() => {
          setOpen(true);
        }}
      >
        {value.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#D1FAE5] text-[#059669] text-xs font-medium rounded"
          >
            {item}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeItem(item);
              }}
              className="hover:text-[#047857] ml-0.5"
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none bg-transparent py-0.5"
          autoComplete="off"
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {open && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-[#E2E8F0] rounded shadow-lg max-h-52 overflow-y-auto">
          {filtered.length === 0 && !showAddNew && (
            <li className="px-3 py-2.5 text-sm text-[#94A3B8]">
              {query ? 'No matches found' : 'All subjects selected'}
            </li>
          )}
          {filtered.map((opt) => (
            <li
              key={opt}
              onClick={() => toggleOption(opt)}
              className="px-3 py-2.5 text-sm cursor-pointer hover:bg-[#F1F5F9] text-[#0F172A] transition-colors"
            >
              {opt}
            </li>
          ))}
          {showAddNew && (
            <li
              onClick={handleAddNew}
              className="px-3 py-2.5 text-sm cursor-pointer border-t border-[#E2E8F0] flex items-center gap-2 hover:bg-[#F0FDF4] transition-colors"
            >
              <span className="w-4 h-4 rounded bg-[#059669] text-white flex items-center justify-center text-xs font-bold">+</span>
              <span className="text-[#059669] font-medium">Add Subject: "{query}"</span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
