'use client'

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react'

interface SearchableSelectProps {
  options: string[]
  // Optional parallel array of raw values for each option label.
  // When provided: options[i] is the display label, valueOptions[i] is the stored value.
  // When omitted: options are used as both label and value (existing behaviour).
  valueOptions?: string[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  allowCustom?: boolean
  onAddNew?: (value: string) => Promise<void>
  error?: string
  disabled?: boolean
  id?: string
  label?: string
}

export function SearchableSelect({
  options,
  valueOptions,
  value,
  onChange,
  placeholder = 'Search or select...',
  allowCustom = false,
  onAddNew,
  error,
  disabled,
  id,
  label,
}: SearchableSelectProps) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const [addingNew, setAddingNew] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = options
    .map((label, i) => ({ label, rawValue: valueOptions ? valueOptions[i] : label }))
    .filter(o => o.label.toLowerCase().includes(query.toLowerCase()))

  const exactMatch = options.some(o => o.toLowerCase() === query.toLowerCase())
  const showAddNew = allowCustom && query.trim().length > 1 && !exactMatch

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selectOption = useCallback((displayLabel: string, rawValue: string) => {
    onChange(rawValue)
    setQuery(displayLabel)
    setOpen(false)
    setHighlighted(0)
  }, [onChange])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const total = filtered.length + (showAddNew ? 1 : 0)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted(h => (h + 1) % total)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted(h => (h - 1 + total) % total)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlighted < filtered.length) {
        const opt = filtered[highlighted]
        selectOption(opt.label, opt.rawValue)
      } else if (showAddNew && onAddNew) {
        handleAddNew()
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const handleAddNew = async () => {
    if (!onAddNew || !query.trim()) return
    setAddingNew(true)
    try {
      await onAddNew(query.trim())
      setOpen(false)
    } finally {
      setAddingNew(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={query}
        disabled={disabled}
        placeholder={placeholder}
        onChange={e => {
          setQuery(e.target.value)
          setOpen(true)
          setHighlighted(0)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm text-slate-900 placeholder:text-slate-400 transition-colors
          ${error ? 'border-red-400 focus:border-red-500' : 'border-[#E2E8F0] focus:border-[#059669]'}
          focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-200' : 'focus:ring-emerald-100'}
          disabled:bg-slate-50 disabled:text-slate-400`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {open && (filtered.length > 0 || showAddNew) && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full bg-white border border-[#E2E8F0] rounded-lg shadow-lg max-h-52 overflow-y-auto"
        >
          {filtered.map((opt, i) => (
            <li
              key={opt.rawValue}
              role="option"
              aria-selected={opt.rawValue === value}
              className={`px-3.5 py-2.5 text-sm cursor-pointer transition-colors ${
                i === highlighted ? 'bg-emerald-50 text-[#059669]' : 'text-slate-700 hover:bg-slate-50'
              } ${opt.rawValue === value ? 'font-semibold text-[#059669]' : ''}`}
              onMouseDown={() => selectOption(opt.label, opt.rawValue)}
              onMouseEnter={() => setHighlighted(i)}
            >
              {opt.label}
            </li>
          ))}
          {showAddNew && (
            <li
              role="option"
              aria-selected={false}
              className={`px-3.5 py-2.5 text-sm cursor-pointer border-t border-[#E2E8F0] transition-colors ${
                highlighted === filtered.length ? 'bg-emerald-50 text-[#059669]' : 'text-[#059669] hover:bg-emerald-50'
              }`}
              onMouseDown={handleAddNew}
              onMouseEnter={() => setHighlighted(filtered.length)}
            >
              {addingNew ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting...
                </span>
              ) : (
                <span>+ Add new: <span className="font-semibold">{query.trim()}</span></span>
              )}
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
