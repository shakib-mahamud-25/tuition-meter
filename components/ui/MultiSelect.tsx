'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'

interface MultiSelectProps {
  options: string[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  allowCustom?: boolean
  onAddNew?: (value: string) => Promise<void>
  error?: string
  id?: string
  label?: string
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Search subjects...',
  allowCustom = false,
  onAddNew,
  error,
  id,
  label,
}: MultiSelectProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const [addingNew, setAddingNew] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const available = options.filter(
    o => !value.includes(o) && o.toLowerCase().includes(query.toLowerCase())
  )
  const exactMatch = options.some(o => o.toLowerCase() === query.toLowerCase())
  const showAddNew = allowCustom && query.trim().length > 1 && !exactMatch && !value.includes(query.trim())

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const addItem = (item: string) => {
    onChange([...value, item])
    setQuery('')
    setHighlighted(0)
    inputRef.current?.focus()
  }

  const removeItem = (item: string) => {
    onChange(value.filter(v => v !== item))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const total = available.length + (showAddNew ? 1 : 0)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted(h => (h + 1) % Math.max(total, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted(h => (h - 1 + Math.max(total, 1)) % Math.max(total, 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlighted < available.length && available[highlighted]) {
        addItem(available[highlighted])
      } else if (showAddNew && onAddNew) {
        handleAddNew()
      }
    } else if (e.key === 'Backspace' && query === '' && value.length > 0) {
      removeItem(value[value.length - 1])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const handleAddNew = async () => {
    if (!onAddNew || !query.trim()) return
    setAddingNew(true)
    try {
      await onAddNew(query.trim())
      setQuery('')
      setOpen(false)
    } finally {
      setAddingNew(false)
    }
  }

  return (
    <div ref={containerRef}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <div
        className={`min-h-[44px] flex flex-wrap gap-1.5 px-2 py-2 bg-white border rounded-lg cursor-text transition-colors ${
          error ? 'border-red-400' : 'border-[#E2E8F0] focus-within:border-[#059669]'
        } focus-within:ring-2 ${error ? 'focus-within:ring-red-200' : 'focus-within:ring-emerald-100'}`}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map(v => (
          <span
            key={v}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#D1FAE5] text-[#059669] text-xs font-semibold rounded-md"
          >
            {v}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); removeItem(v) }}
              aria-label={`Remove ${v}`}
              className="text-emerald-600 hover:text-emerald-800 focus:outline-none"
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={query}
          placeholder={value.length === 0 ? placeholder : ''}
          onChange={e => { setQuery(e.target.value); setOpen(true); setHighlighted(0) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          className="flex-1 min-w-[100px] text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {open && (available.length > 0 || showAddNew) && (
        <ul
          role="listbox"
          aria-multiselectable="true"
          className="absolute z-50 mt-1 bg-white border border-[#E2E8F0] rounded-lg shadow-lg max-h-48 overflow-y-auto w-full"
          style={{ width: containerRef.current?.offsetWidth }}
        >
          {available.map((opt, i) => (
            <li
              key={opt}
              role="option"
              aria-selected={false}
              className={`px-3.5 py-2.5 text-sm cursor-pointer transition-colors ${
                i === highlighted ? 'bg-emerald-50 text-[#059669]' : 'text-slate-700 hover:bg-slate-50'
              }`}
              onMouseDown={() => addItem(opt)}
              onMouseEnter={() => setHighlighted(i)}
            >
              {opt}
            </li>
          ))}
          {showAddNew && (
            <li
              role="option"
              className={`px-3.5 py-2.5 text-sm cursor-pointer border-t border-[#E2E8F0] transition-colors ${
                highlighted === available.length ? 'bg-emerald-50 text-[#059669]' : 'text-[#059669] hover:bg-emerald-50'
              }`}
              onMouseDown={handleAddNew}
              onMouseEnter={() => setHighlighted(available.length)}
            >
              {addingNew ? 'Submitting...' : (
                <span>+ Add: <span className="font-semibold">{query.trim()}</span></span>
              )}
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
