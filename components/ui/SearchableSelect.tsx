'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'

interface SearchableSelectProps {
  options: string[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  allowCustom?: boolean
  onAddNew?: (value: string) => void
  disabled?: boolean
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Search or select...',
  allowCustom = false,
  onAddNew,
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(query.toLowerCase())
  )

  const showAddNew =
    allowCustom &&
    query.trim().length > 0 &&
    !options.some((o) => o.toLowerCase() === query.trim().toLowerCase())

  const allItems = showAddNew
    ? [...filtered, `__add__:${query.trim()}`]
    : filtered

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
      onChange(newVal)
      onAddNew?.(newVal)
    } else {
      onChange(item)
    }
    setOpen(false)
    setQuery('')
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
    }
  }

  function handleInputClick() {
    if (!disabled) {
      setOpen(true)
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger / input */}
      <div
        className={`flex items-center w-full px-3 py-2.5 rounded-lg border text-sm cursor-text transition-colors ${
          disabled
            ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-white border-[#E2E8F0] hover:border-[#94A3B8]'
        } ${open ? 'border-[#059669] ring-1 ring-[#059669]' : ''}`}
        onClick={handleInputClick}
      >
        {open ? (
          <input
            ref={inputRef}
            className="flex-1 outline-none bg-transparent text-gray-900 placeholder-slate-400"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
          />
        ) : (
          <span className={value ? 'text-[#059669] font-medium' : 'text-slate-400'}>
            {value || placeholder}
          </span>
        )}
        <svg
          className={`ml-auto w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown */}
      {open && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-[#E2E8F0] rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {allItems.length === 0 && (
            <li className="px-3 py-2.5 text-slate-400 text-sm">No results found</li>
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
