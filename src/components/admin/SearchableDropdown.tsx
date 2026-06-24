'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';

interface SearchableDropdownProps {
  value: string;
  onChange: (val: string) => void;
  onSelect?: (val: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onFocus?: () => void;
}

export function SearchableDropdown({
  value,
  onChange,
  onSelect,
  options,
  placeholder,
  className,
  disabled = false,
  onFocus,
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Sync internal filter state with prop value when it changes externally
  if (value !== prevValue) {
    setFilter(value);
    setPrevValue(value);
  }

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll<HTMLButtonElement>('[data-option-index]');
    const item = items[highlightedIndex];
    if (item) item.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex]);

  // Safe deduplication of option values, filtering based on search input
  const filteredOptions = Array.from(new Set(options))
    .filter(opt => opt && opt.toLowerCase().includes(filter.toLowerCase()))
    .slice(0, 100); // Limit to top 100 entries for performance

  const selectOption = useCallback((opt: string) => {
    onChange(opt);
    if (onSelect) onSelect(opt);
    setFilter(opt);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }, [onChange, onSelect]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;

    const maxIndex = filteredOptions.length - 1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setHighlightedIndex(0);
        } else {
          const next = highlightedIndex + 1;
          if (next <= maxIndex) {
            setHighlightedIndex(next);
            requestAnimationFrame(() => {
              listRef.current?.querySelector<HTMLButtonElement>(`[data-option-index="${next}"]`)?.focus();
            });
          }
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setHighlightedIndex(maxIndex);
        } else if (highlightedIndex > 0) {
          const prev = highlightedIndex - 1;
          setHighlightedIndex(prev);
          requestAnimationFrame(() => {
            listRef.current?.querySelector<HTMLButtonElement>(`[data-option-index="${prev}"]`)?.focus();
          });
        }
        break;

      case 'Enter':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          selectOption(filteredOptions[highlightedIndex]);
        } else if (isOpen && filteredOptions.length > 0) {
          selectOption(filteredOptions[0]);
        }
        break;

      case 'Tab':
        if (isOpen && filteredOptions.length > 0) {
          e.preventDefault();
          setHighlightedIndex(0);
          // Focus the first option in the list
          requestAnimationFrame(() => {
            const items = listRef.current?.querySelectorAll<HTMLButtonElement>('[data-option-index]');
            items?.[0]?.focus();
          });
        }
        break;

      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.focus();
        break;
    }
  }, [disabled, isOpen, filteredOptions, highlightedIndex, selectOption]);

  return (
    <div ref={containerRef} className="relative w-full">
      <Input
        ref={inputRef}
        value={filter}
        disabled={disabled}
        onChange={(e) => {
          if (disabled) return;
          const val = e.target.value;
          setFilter(val);
          onChange(val);
          setHighlightedIndex(-1);
          setIsOpen(true);
        }}
        onFocus={() => {
          if (disabled) return;
          setIsOpen(true);
          if (onFocus) onFocus();
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />
      {isOpen && !disabled && filteredOptions.length > 0 && (
        <div
          ref={listRef}
          className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-border bg-popover py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none"
        >
          {filteredOptions.map((opt, idx) => (
            <button
              key={idx}
              type="button"
              data-option-index={idx}
              tabIndex={-1}
              className={`relative w-full cursor-pointer select-none px-4 py-2 text-left text-foreground hover:bg-[#DC2626]/10 hover:text-[#DC2626] focus:bg-[#DC2626]/10 focus:text-[#DC2626] focus:outline-none ${
                idx === highlightedIndex ? 'bg-[#DC2626]/10 text-[#DC2626]' : ''
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                selectOption(opt);
              }}
              onKeyDown={(e) => {
                switch (e.key) {
                  case 'ArrowDown':
                    e.preventDefault();
                    const next = listRef.current?.querySelector<HTMLButtonElement>(`[data-option-index="${idx + 1}"]`);
                    if (next) {
                      setHighlightedIndex(idx + 1);
                      next.focus();
                    }
                    break;
                  case 'ArrowUp':
                    e.preventDefault();
                    const prev = listRef.current?.querySelector<HTMLButtonElement>(`[data-option-index="${idx - 1}"]`);
                    if (prev) {
                      setHighlightedIndex(idx - 1);
                      prev.focus();
                    } else {
                      // Back to input
                      setHighlightedIndex(-1);
                      inputRef.current?.focus();
                    }
                    break;
                  case 'Enter':
                    e.preventDefault();
                    selectOption(opt);
                    break;
                  case 'Tab':
                    e.preventDefault();
                    selectOption(opt);
                    break;
                  case 'Escape':
                    setIsOpen(false);
                    setHighlightedIndex(-1);
                    inputRef.current?.focus();
                    break;
                }
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
