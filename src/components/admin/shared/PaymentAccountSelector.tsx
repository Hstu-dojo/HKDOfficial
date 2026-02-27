'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Plus, Loader2, CreditCard, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PaymentAccount {
  id: string;
  name: string;
  methodType: string;
  accountNumber: string;
  accountName: string | null;
  qrCodeUrl: string | null;
  instructions: string | null;
  isDefault: boolean;
  priority: number;
  scope?: string;
  scopeId?: string | null;
}

interface PaymentAccountSelectorProps {
  /** 'course' or 'program' */
  scope: 'course' | 'program';
  /** The ID of the course/program being edited (undefined for new entities) */
  scopeId?: string;
  /** Called whenever the selection changes */
  onChange: (selectedIds: string[]) => void;
  /** Extra CSS classes on the root */
  className?: string;
}

// ---------------------------------------------------------------------------
// Method-type styling
// ---------------------------------------------------------------------------

const METHOD_CONFIG: Record<
  string,
  { label: string; emoji: string; color: string; bg: string; border: string }
> = {
  bkash: {
    label: 'bKash',
    emoji: '🔴',
    color: 'text-pink-700 dark:text-pink-400',
    bg: 'bg-pink-50 dark:bg-pink-950/20',
    border: 'border-pink-300 dark:border-pink-700',
  },
  nagad: {
    label: 'Nagad',
    emoji: '🟠',
    color: 'text-orange-700 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    border: 'border-orange-300 dark:border-orange-700',
  },
  rocket: {
    label: 'Rocket',
    emoji: '🟣',
    color: 'text-purple-700 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    border: 'border-purple-300 dark:border-purple-700',
  },
  upay: {
    label: 'Upay',
    emoji: '🟢',
    color: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950/20',
    border: 'border-green-300 dark:border-green-700',
  },
  bank_transfer: {
    label: 'Bank Transfer',
    emoji: '🏦',
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-300 dark:border-blue-700',
  },
  cash: {
    label: 'Cash',
    emoji: '💵',
    color: 'text-gray-700 dark:text-gray-400',
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    border: 'border-gray-300 dark:border-gray-600',
  },
};

const getMethodConfig = (type: string) =>
  METHOD_CONFIG[type] ?? {
    label: type,
    emoji: '💳',
    color: 'text-gray-700 dark:text-gray-400',
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    border: 'border-gray-300 dark:border-gray-600',
  };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PaymentAccountSelector({
  scope,
  scopeId,
  onChange,
  className,
}: PaymentAccountSelectorProps) {
  const [globalAccounts, setGlobalAccounts] = useState<PaymentAccount[]>([]);
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [useDefault, setUseDefault] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all default/global accounts + already-assigned ones
  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all default (global) payment accounts
      const globalRes = await fetch('/api/admin/payment-accounts?scope=default&activeOnly=true');
      if (!globalRes.ok) throw new Error('Failed to fetch payment accounts');
      const globalData = await globalRes.json();
      const globals: PaymentAccount[] = globalData.accounts ?? [];
      setGlobalAccounts(globals);

      // If editing an existing entity, fetch already-assigned accounts
      if (scopeId) {
        const scopeRes = await fetch(
          `/api/admin/payment-accounts?scope=${scope}&scopeId=${scopeId}&activeOnly=true`
        );
        if (scopeRes.ok) {
          const scopeData = await scopeRes.json();
          const scopeAccounts: PaymentAccount[] = scopeData.accounts ?? [];

          if (scopeAccounts.length > 0) {
            // There are course/program-specific accounts → match them to globals
            // by methodType+accountNumber (since they were cloned)
            const matchedGlobalIds = new Set<string>();
            for (const sa of scopeAccounts) {
              const match = globals.find(
                (g) => g.methodType === sa.methodType && g.accountNumber === sa.accountNumber
              );
              if (match) matchedGlobalIds.add(match.id);
            }
            setAssignedIds(matchedGlobalIds);
            setSelectedIds(new Set(matchedGlobalIds));
            setUseDefault(false);
          } else {
            // No scope-specific accounts → using default fallback
            setUseDefault(true);
            setSelectedIds(new Set());
            setAssignedIds(new Set());
          }
        }
      }
    } catch (err) {
      console.error('PaymentAccountSelector: fetch error', err);
      setError('Failed to load payment accounts');
    } finally {
      setLoading(false);
    }
  }, [scope, scopeId]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Notify parent of changes
  useEffect(() => {
    if (loading) return;
    if (useDefault) {
      onChange([]); // empty = use fallback defaults
    } else {
      onChange(Array.from(selectedIds));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, useDefault, loading]);

  const toggleAccount = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // ---------- Render ----------

  if (loading) {
    return (
      <div className={cn('flex items-center gap-2 py-4 text-muted-foreground', className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading payment accounts…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('flex items-center gap-2 py-4 text-destructive', className)}>
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  if (globalAccounts.length === 0) {
    return (
      <div className={cn('rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground', className)}>
        <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No payment accounts configured yet.</p>
        <p className="mt-1">
          Go to{' '}
          <a
            href="/en/admin/payment-settings"
            className="text-blue-600 hover:underline"
            target="_blank"
          >
            Payment Settings
          </a>{' '}
          to create payment accounts first.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toggle: Use default vs override */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={`payment-mode-${scope}-${scopeId ?? 'new'}`}
            checked={useDefault}
            onChange={() => {
              setUseDefault(true);
              setSelectedIds(new Set());
            }}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Use default payment accounts
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={`payment-mode-${scope}-${scopeId ?? 'new'}`}
            checked={!useDefault}
            onChange={() => setUseDefault(false)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Select specific accounts
          </span>
        </label>
      </div>

      {useDefault && (
        <p className="text-xs text-muted-foreground">
          The globally configured default payment accounts will be shown to students during enrollment.
        </p>
      )}

      {/* Account cards */}
      {!useDefault && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {globalAccounts.map((account) => {
            const cfg = getMethodConfig(account.methodType);
            const isSelected = selectedIds.has(account.id);

            return (
              <button
                key={account.id}
                type="button"
                onClick={() => toggleAccount(account.id)}
                className={cn(
                  'relative flex items-start gap-3 rounded-lg border-2 p-3 text-left transition-all',
                  isSelected
                    ? `${cfg.border} ${cfg.bg} ring-1 ring-offset-1`
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                {/* Checkbox indicator */}
                <div
                  className={cn(
                    'mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    isSelected
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-300 dark:border-gray-600'
                  )}
                >
                  {isSelected && <CheckCircle className="h-3.5 w-3.5" />}
                </div>

                {/* Account details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cfg.emoji}</span>
                    <span className="font-medium text-sm truncate">{account.name}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={cn('font-medium', cfg.color)}>{cfg.label}</span>
                    <span>•</span>
                    <span className="font-mono">{account.accountNumber}</span>
                  </div>
                  {account.accountName && (
                    <div className="mt-0.5 text-xs text-muted-foreground truncate">
                      {account.accountName}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {!useDefault && selectedIds.size === 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          ⚠ No accounts selected. Students will see the default payment accounts as fallback.
        </p>
      )}
    </div>
  );
}
