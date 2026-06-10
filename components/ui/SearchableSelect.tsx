'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface SearchableSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  allowCustom?: boolean;
  onAddNew?: (value: string) => void;
  addNewLabel?: string;
  error?: string;
  id?: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Search...',
  label,
  required,
  allowCustom = false,
  onAddNew,
  addNewLabel = 'Add New',
  error,
  id,
}: SearchableSelectProps) {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options.slice(0, 10);

  const exactMatch = options.some(
    (o) => o.toLowerCase() === query.toLowerCase()
  );

  const showAddNew = allowCustom && query.trim().length > 1 && !exactMatch;

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (opt: string) => {
      onChange(opt);
      setQuery(opt);
      setOpen(false);
    },
    [onChange]
  );

  const handleAddNew = useCallback(() => {
    if (onAddNew && query.trim()) {
      onAddNew(query.trim());
      onChange(query.trim());
      setOpen(false);
    }
  }, [onAddNew, onChange, query]);

  const allItems = showAddNew ? [...filtered, '__add_new__'] : filtered;

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, allItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = allItems[highlighted];
      if (item === '__add_new__') handleAddNew();
      else if (item) handleSelect(item);
    } else if (e.key === 'Escape') {
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
      <input
        id={id}
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlighted(0);
          if (!e.target.value) onChange('');
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full px-3 py-2.5 border rounded text-sm bg-white text-[#0F172A] placeholder-[#94A3B8] transition-colors outline-none ${
          error
            ? 'border-red-400 focus:border-red-500'
            : 'border-[#CBD5E1] focus:border-[#059669]'
        }`}
        autoComplete="off"
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {open && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 w-full bg-white border border-[#E2E8F0] rounded shadow-lg max-h-52 overflow-y-auto"
          role="listbox"
        >
          {filtered.length === 0 && !showAddNew && (
            <li className="px-3 py-2.5 text-sm text-[#94A3B8]">No results found</li>
          )}
          {filtered.map((opt, i) => (
            <li
              key={opt}
              role="option"
              aria-selected={value === opt}
              onClick={() => handleSelect(opt)}
              onMouseEnter={() => setHighlighted(i)}
              className={`px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                highlighted === i ? 'bg-[#F1F5F9]' : ''
              } ${value === opt ? 'text-[#059669] font-medium' : 'text-[#0F172A]'}`}
            >
              {opt}
            </li>
          ))}
          {showAddNew && (
            <li
              role="option"
              onClick={handleAddNew}
              onMouseEnter={() => setHighlighted(filtered.length)}
              className={`px-3 py-2.5 text-sm cursor-pointer border-t border-[#E2E8F0] flex items-center gap-2 transition-colors ${
                highlighted === filtered.length ? 'bg-[#F0FDF4]' : ''
              }`}
            >
              <span className="w-4 h-4 rounded bg-[#059669] text-white flex items-center justify-center text-xs font-bold">+</span>
              <span className="text-[#059669] font-medium">{addNewLabel}: "{query}"</span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
