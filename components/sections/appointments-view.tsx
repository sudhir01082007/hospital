'use client'

import { useState } from 'react'
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Download,
  Plus,
  Hospital as HospitalIcon,
  User,
  Stethoscope,
  RefreshCw,
} from 'lucide-react'
import { Appointment } from '@/lib/hospital-data'

interface AppointmentsViewProps {
  appointments: Appointment[]
  onOpenBookingModal: () => void
  onCancelAppointment: (appointmentId: string) => void
  onRescheduleAppointment: (appointment: Appointment) => void
  onDownloadSlip: (appointment: Appointment) => void
}

export function AppointmentsView({
  appointments,
  onOpenBookingModal,
  onCancelAppointment,
  onRescheduleAppointment,
  onDownloadSlip,
}: AppointmentsViewProps) {
  const [filter, setFilter] = useState<'all' | 'Upcoming' | 'Completed' | 'Cancelled'>('all')

  const filteredAppointments = appointments.filter((a) => {
    if (filter === 'all') return true
    if (filter === 'Upcoming') return a.status === 'Confirmed' || a.status === 'Pending'
    return a.status === filter
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Hospital Admission & Outpatient Queue
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            Appointments & Admission Requests
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Track confirmed outpatient tokens, bed admission requisitions, and scheduled visits.
          </p>
        </div>

        <button
          onClick={onOpenBookingModal}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition self-start sm:self-auto"
        >
          <Plus className="size-4" /> Book New Appointment
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {(
          [
            ['all', 'All Bookings'],
            ['Upcoming', 'Upcoming & Confirmed'],
            ['Completed', 'Past Consultations'],
            ['Cancelled', 'Cancelled'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              filter === key
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {label} ({key === 'all' ? appointments.length : appointments.filter((a) => (key === 'Upcoming' ? a.status === 'Confirmed' || a.status === 'Pending' : a.status === key)).length})
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {filteredAppointments.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredAppointments.map((apt) => {
            const isUpcoming = apt.status === 'Confirmed' || apt.status === 'Pending'
            return (
              <div
                key={apt.id}
                className="flex flex-col justify-between rounded-3xl border border-border bg-card p-5 shadow-xs transition hover:border-primary/40 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
                    <div>
                      <span className="inline-block rounded-md bg-primary/10 px-2 py-0.5 text-xs font-mono font-bold text-primary">
                        Token #{apt.tokenNumber}
                      </span>
                      <h3 className="mt-2 font-bold text-foreground text-base">{apt.doctorName}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Stethoscope className="size-3 text-primary" /> {apt.department} · {apt.type}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        apt.status === 'Confirmed'
                          ? 'bg-emerald-500/10 text-emerald-700'
                          : apt.status === 'Pending'
                          ? 'bg-amber-500/10 text-amber-700'
                          : apt.status === 'Completed'
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {apt.status}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-foreground font-semibold">
                      <HospitalIcon className="size-3.5 text-muted-foreground" />
                      <span>{apt.hospitalName}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-primary" />
                        <strong className="text-foreground">{apt.date}</strong>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5 text-primary" />
                        <span>Slot: {apt.time}</span>
                      </span>
                    </div>
                    {apt.patientNotes && (
                      <p className="rounded-xl bg-muted/40 p-2.5 text-[11px] text-muted-foreground italic">
                        &quot;{apt.patientNotes}&quot;
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 flex flex-wrap gap-2 pt-3 border-t border-border">
                  <button
                    onClick={() => onDownloadSlip(apt)}
                    className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition"
                  >
                    <Download className="size-3.5" /> Pass Slip
                  </button>

                  {isUpcoming && (
                    <>
                      <button
                        onClick={() => onRescheduleAppointment(apt)}
                        className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition"
                      >
                        <RefreshCw className="size-3.5" /> Reschedule
                      </button>

                      <button
                        onClick={() => onCancelAppointment(apt.id)}
                        className="rounded-xl border border-destructive/20 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center">
          <Calendar className="mx-auto size-12 text-muted-foreground/40" />
          <h3 className="mt-3 font-bold text-foreground">No Appointments in this Category</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Schedule a priority OPD consultation or hospital bed reservation.
          </p>
          <button
            onClick={onOpenBookingModal}
            className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90"
          >
            Book Appointment Now
          </button>
        </div>
      )}
    </div>
  )
}
