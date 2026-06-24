'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useSearch } from '@/hooks/useSearch';
import { cn } from '@/lib/utils';

const RECENT_SEARCHES_KEY = 'jdm_recent_searches';
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  try {
    const current = getRecentSearches().filter((q) => q !== query);
    const updated = [query, ...current].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

function clearRecentSearches() {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // ignore
  }
}

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchBar({ isOpen, onClose }: SearchBarProps) {
  const t = useTranslations('search');
  const { query, setQuery, clearQuery, results, isLoading } = useSearch();
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches when opened
  useEffect(() => {
    if (isOpen) {
      setRecentSearches(getRecentSearches());
      // Focus input after animation
      const id = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(id);
    } else {
      clearQuery();
    }
  }, [isOpen, clearQuery]);

  // Keyboard: ESC closes, Cmd/Ctrl+K opens
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          // signal open — parent should handle via this shortcut;
          // we only manage closing here
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        saveRecentSearch(query.trim());
        setRecentSearches(getRecentSearches());
      }
    },
    [query]
  );

  const handleResultClick = useCallback(
    (title: string) => {
      saveRecentSearch(title);
      onClose();
    },
    [onClose]
  );

  const handleRecentClick = useCallback(
    (term: string) => {
      setQuery(term);
    },
    [setQuery]
  );

  const handleClearRecent = useCallback(() => {
    clearRecentSearches();
    setRecentSearches([]);
  }, []);

  const showRecent = !query && recentSearches.length > 0;
  const showResults = !!query;
  const showNoResults = showResults && !isLoading && results.length === 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex flex-col bg-background/40 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          {/* Header row */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-4 sm:px-6 lg:px-8">
            <form
              onSubmit={handleSearchSubmit}
              className="flex flex-1 items-center gap-3"
            >
              <Search className="size-5 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('placeholder')}
                className="flex-1 bg-transparent text-lg font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
                aria-label={t('placeholder')}
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
              />
              {isLoading && (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              )}
              {query && (
                <button
                  type="button"
                  onClick={clearQuery}
                  className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={t('close')}
                >
                  <X className="size-4" />
                </button>
              )}
            </form>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label={t('close')}
              className="shrink-0 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X className="size-5" />
            </Button>
          </div>

          {!query && !showRecent && (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                {t('shortcut', { key: '⌘K' })}
              </p>
            </div>
          )}

          {/* Recent searches */}
          {showRecent && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {t('recentSearches')}
                </span>
                <button
                  onClick={handleClearRecent}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t('clearRecent')}
                </button>
              </div>
              <ul className="space-y-1">
                {recentSearches.map((term) => (
                  <li key={term}>
                    <button
                      onClick={() => handleRecentClick(term)}
                      className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Clock className="size-4 shrink-0 text-muted-foreground/50" />
                      {term}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Search results */}
          {showResults && (
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-2xl px-4 py-4 sm:px-6">
                {isLoading && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    {t('loading')}
                  </p>
                )}

                {showNoResults && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-10 text-center"
                  >
                    <p className="text-base font-medium text-muted-foreground">
                      {t('noResults', { query })}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground/60">
                      {t('noResultsHint')}
                    </p>
                  </motion.div>
                )}

                {!isLoading && results.length > 0 && (
                  <motion.ul
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-2"
                  >
                    {results.map((result) => (
                      <li key={result.id}>
                        <Link
                          href={result.href}
                          onClick={() => handleResultClick(result.title)}
                          className="group flex items-center gap-4 rounded-lg border border-border bg-card p-3 transition-colors hover:border-[#DC2626]/40 hover:bg-muted"
                        >
                          {/* Product image */}
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground/20">
                            {result.image ? (
                              <img
                                src={result.image}
                                alt={result.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Search className="size-5" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground group-hover:text-[#DC2626]">
                              {result.title}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              {(() => {
                                const cat = result.category.toLowerCase();
                                const isEngine = cat === 'engine';
                                const isTransmission = cat === 'transmission';
                                const text = isEngine ? 'Engine' : isTransmission ? 'Transmission' : 'Part';
                                const badgeClass = isEngine
                                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                                  : isTransmission
                                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
                                return (
                                  <Badge
                                    variant="outline"
                                    className={cn('text-[10px] font-medium border px-1.5 py-0', badgeClass)}
                                  >
                                    {text}
                                  </Badge>
                                );
                              })()}
                              {result.make && (
                                <span className="text-xs text-muted-foreground">
                                  {result.make}
                                  {result.model ? ` · ${result.model}` : ''}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="text-sm font-bold text-[#DC2626]">
                              ${result.price.toLocaleString()}
                            </p>
                            <ArrowRight className="ml-auto mt-1 size-4 text-muted-foreground/30 transition-colors group-hover:text-[#DC2626]" />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </motion.ul>
                )}

                {!isLoading && results.length > 0 && (
                  <>
                    <Separator className="my-4 bg-border" />
                    <Link
                      href={`/search?q=${encodeURIComponent(query)}`}
                      onClick={onClose}
                      className="flex items-center justify-center gap-2 text-sm font-medium text-[#DC2626] transition-colors hover:text-[#ef4444]"
                    >
                      {t('viewAll')}
                      <ArrowRight className="size-4" />
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
