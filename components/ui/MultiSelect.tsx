'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'

interface MultiSelectProps {
  options: string[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  allowCustom?: boolean
  onAddNew?: (value: string) => void
  disabled?: boolean
}

export default function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Search subjects...',
  allowCustom = false,
  onAddNew,
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const available = options.filter(
    (o) => !value.includes(o) && o.toLowerCase().includes(query.toLowerCase())
  )

  const showAddNew =
    allowCustom &&
    query.trim().length > 0 &&
    !value.includes(query.trim()) &&
    !options.some((o) => o.toLowerCase() === query.trim().toLowerCase())

  const allItems = showAddNew
    ? [...available, `__add__:${query.trim()}`]
    : available

  useEffect(() => {
    setHighlighted(0)
  }, [query])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function handleSelect(item: string) {
    if (item.startsWith('__add__:')) {
      const newVal = item.slice(8)
      onChange([...value, newVal])
      onAddNew?.(newVal)
    } else {
      onChange([...value, item])
    }
    setQuery('')
    inputRef.current?.focus()
  }

  function handleRemove(item: string) {
    onChange(value.filter((v) => v !== item))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((h) => Math.min(h + 1, allItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (allItems[highlighted]) handleSelect(allItems[highlighted])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
    } else if (e.key === 'Backspace' && query === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex flex-wrap gap-1.5 w-full px-3 py-2 rounded-lg border min-h-[44px] cursor-text transition-colors ${
          disabled
            ? 'bg-gray-50 border-gray-200 cursor-not-allowed'
            : 'bg-white border-[#E2E8F0] hover:border-[#94A3B8]'
        } ${open ? 'border-[#059669] ring-1 ring-[#059669]' : ''}`}
        onClick={() => {
          if (!disabled) {
            setOpen(true)
            inputRef.current?.focus()
          }
        }}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#D1FAE5] text-[#059669] text-xs font-medium"
          >
            {tag}
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleRemove(tag) }}
              className="hover:text-emerald-800 transition-colors ml-0.5"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          className="flex-1 min-w-[120px] outline-none bg-transparent text-sm text-gray-900 placeholder-slate-400 py-0.5"
          placeholder={value.length === 0 ? placeholder : ''}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
      </div>

      {open && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-[#E2E8F0] rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {allItems.length === 0 && (
            <li className="px-3 py-2.5 text-slate-400 text-sm">
              {query ? 'No matches found' : 'All options selected'}
            </li>
          )}
          {allItems.map((item, i) => {
            const isAddNew = item.startsWith('__add__:')
            const label = isAddNew ? `+ Add New: "${item.slice(8)}"` : item
            return (
              <li
                key={item}
                className={`px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                  i === highlighted
                    ? 'bg-[#D1FAE5] text-[#059669]'
                    : isAddNew
                    ? 'text-[#059669] hover:bg-[#D1FAE5]'
                    : 'text-gray-700 hover:bg-[#F1F5F9]'
                }`}
                onMouseEnter={() => setHighlighted(i)}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(item) }}
              >
                {label}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
