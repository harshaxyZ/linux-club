'use client';

import React, { useId, useMemo, useRef, useState } from 'react';
import { X, ChevronDown } from 'lucide-react';

interface MultiSelectComboboxProps {
  label: string;
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
  /** Option that cannot be combined with any other (e.g. "NA"). */
  exclusiveOption?: string;
  maxSelected?: number;
  placeholder?: string;
  hint?: string;
  required?: boolean;
}

/**
 * Type-to-filter multi-select. Follows the ARIA combobox pattern: the input
 * owns the listbox, options are reachable with the arrow keys, Enter selects the
 * active option, Escape closes, and Backspace on an empty query removes the last
 * chip. Selected values are announced through a visually hidden live region.
 */
export function MultiSelectCombobox({
  label,
  options,
  selected,
  onChange,
  exclusiveOption,
  maxSelected = 12,
  placeholder = 'Start typing to search…',
  hint,
  required = false,
}: MultiSelectComboboxProps) {
  const baseId = useId();
  const inputId = `${baseId}-input`;
  const listId = `${baseId}-list`;
  const hintId = `${baseId}-hint`;
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const atLimit = selected.length >= maxSelected;

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return options
      .filter((option) => !selected.includes(option))
      .filter((option) => (needle ? option.toLowerCase().includes(needle) : true))
      .slice(0, 8);
  }, [options, selected, query]);

  const commit = (option: string) => {
    let next: string[];
    if (exclusiveOption && option === exclusiveOption) {
      next = [option];
    } else {
      next = [...selected.filter((s) => s !== exclusiveOption), option].slice(0, maxSelected);
    }
    onChange(next);
    setQuery('');
    setActiveIndex(0);
  };

  const remove = (option: string) => onChange(selected.filter((s) => s !== option));

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((i) => (matches.length === 0 ? 0 : (i + 1) % matches.length));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((i) => (matches.length === 0 ? 0 : (i - 1 + matches.length) % matches.length));
      return;
    }
    if (event.key === 'Enter') {
      if (open && matches[activeIndex]) {
        event.preventDefault();
        commit(matches[activeIndex]);
      }
      return;
    }
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (event.key === 'Backspace' && query === '' && selected.length > 0) {
      remove(selected[selected.length - 1]);
    }
  };

  return (
    <div>
      <label
        htmlFor={inputId}
        className="block text-xs font-mono font-semibold text-ink uppercase tracking-wider mb-2"
      >
        {label} {required ? '*' : ''}
      </label>

      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-2 mb-2" aria-label={`${label}: selected`}>
          {selected.map((option) => (
            <li key={option}>
              <span className="inline-flex items-center gap-1.5 bg-accent/10 border border-accent/20 text-accent text-[11px] font-mono px-2.5 py-1 rounded-full">
                {option}
                <button
                  type="button"
                  onClick={() => remove(option)}
                  aria-label={`Remove ${option}`}
                  className="cursor-pointer hover:text-ink"
                >
                  <X className="w-3 h-3" aria-hidden="true" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <input
          id={inputId}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-describedby={hint ? hintId : undefined}
          aria-activedescendant={open && matches[activeIndex] ? `${listId}-${activeIndex}` : undefined}
          value={query}
          disabled={atLimit}
          placeholder={atLimit ? `Limit of ${maxSelected} reached` : placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          onBlur={() => {
            if (blurTimer.current) clearTimeout(blurTimer.current);
            blurTimer.current = setTimeout(() => setOpen(false), 120);
          }}
          className="w-full px-4 py-3.5 pr-10 rounded-xl border border-border bg-surface text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-accent disabled:opacity-60"
        />
        <ChevronDown
          className="w-4 h-4 text-ink-muted absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        />

        {open && matches.length > 0 && (
          <ul
            id={listId}
            role="listbox"
            aria-label={label}
            className="absolute z-30 mt-1 w-full max-h-60 overflow-auto rounded-xl border border-border bg-surface shadow-2xl py-1"
          >
            {matches.map((option, index) => (
              <li
                key={option}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(e) => {
                  // Select before the input's blur handler closes the list.
                  e.preventDefault();
                  commit(option);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={`px-4 py-2.5 text-sm cursor-pointer font-mono ${
                  index === activeIndex ? 'bg-accent/10 text-accent' : 'text-ink'
                }`}
              >
                {option}
              </li>
            ))}
          </ul>
        )}
      </div>

      {hint && (
        <p id={hintId} className="mt-1.5 text-[11px] font-mono text-ink-muted">
          {hint}
        </p>
      )}
      <span aria-live="polite" className="sr-only">
        {selected.length > 0 ? `${selected.length} selected: ${selected.join(', ')}` : 'None selected'}
      </span>
    </div>
  );
}
