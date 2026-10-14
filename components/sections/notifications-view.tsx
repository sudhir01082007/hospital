'use client'

import { useState } from 'react'
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Info,
  Trash2,
  CheckCheck,
  ArrowRight,
} from 'lucide-react'
import { NotificationItem } from '@/lib/hospital-data'

interface NotificationsViewProps {
  notifications: NotificationItem[]
  onMarkAllAsRead: () => void
  onClearAll: () => void
  onSelectNotification: (item: NotificationItem) => void
}

export function NotificationsView({
  notifications,
  onMarkAllAsRead,
  onClearAll,
  onSelectNotification,
}: NotificationsViewProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all')

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return n.unread
    if (filter === 'urgent') return n.type === 'urgent'
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Live Medical Intelligence Feeds
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            Notifications & Hospital Alerts
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Critical ICU availability bulletins, appointment status confirmations, and emergency corridor alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onMarkAllAsRead}
            className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition"
          >
            <CheckCheck className="size-3.5 text-primary" /> Mark all read
          </button>
          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
          >
            <Trash2 className="size-3.5" /> Clear
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-3">
        {(
          [
            ['all', 'All Alerts'],
            ['unread', 'Unread Only'],
            ['urgent', 'Emergency & Critical'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              filter === k
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((item) => {
            const Icon =
              item.type === 'urgent'
                ? AlertCircle
                : item.type === 'appointment'
                ? Calendar
                : item.type === 'system'
                ? CheckCircle2
                : Info

            return (
              <div
                key={item.id}
                onClick={() => onSelectNotification(item)}
                className={`group flex cursor-pointer items-start justify-between gap-4 rounded-2xl border p-4 sm:p-5 transition hover:shadow-xs ${
                  item.unread
                    ? 'border-primary/30 bg-primary/5 hover:bg-primary/10'
                    : 'border-border bg-card hover:bg-muted/40'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                      item.type === 'urgent'
                        ? 'bg-destructive/10 text-destructive'
                        : item.type === 'appointment'
                        ? 'bg-primary/10 text-primary'
                        : item.type === 'system'
                        ? 'bg-emerald-500/10 text-emerald-700'
                        : 'bg-teal-500/10 text-teal-700'
                    }`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-foreground text-sm">{item.title}</h4>
                      {item.unread && <span className="size-2 rounded-full bg-primary" />}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{item.message}</p>
                    <span className="mt-2 inline-block text-[10px] font-medium text-muted-foreground">
                      {item.time}
                    </span>
                  </div>
                </div>

                {item.targetSection && (
                  <button className="shrink-0 flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-primary group-hover:border-primary/40 transition">
                    View <ArrowRight className="size-3" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center">
          <Bell className="mx-auto size-12 text-muted-foreground/40" />
          <h3 className="mt-3 font-bold text-foreground">No Notifications Found</h3>
          <p className="mt-1 text-xs text-muted-foreground">You are all caught up on hospital and triage updates.</p>
        </div>
      )}
    </div>
  )
}
