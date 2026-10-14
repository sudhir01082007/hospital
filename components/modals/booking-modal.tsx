'use client'

import { useState } from 'react'
import { Calendar, Clock, Hospital as HospitalIcon, Stethoscope, User, X, CheckCircle2 } from 'lucide-react'
import { Hospital, Appointment } from '@/lib/hospital-data'

interface BookingModalProps {
  hospital: Hospital | null
  allHospitals: Hospital[]
  onClose: () => void
  onConfirm: (appointment: Omit<Appointment, 'id' | 'tokenNumber' | 'status'>) => void
}

export function BookingModal({ hospital, allHospitals, onClose, onConfirm }: BookingModalProps) {
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(hospital?.id ?? allHospitals[0]?.id ?? '')
  const currentHospital = allHospitals.find((h) => h.id === selectedHospitalId) || allHospitals[0]

  const [department, setDepartment] = useState<string>(currentHospital?.departments[0] || 'Cardiology')
  const [doctorName, setDoctorName] = useState<string>(currentHospital?.doctors[0]?.name || 'Available Specialist')
  const [date, setDate] = useState<string>('Tomorrow, 10:30 AM')
  const [time, setTime] = useState<string>('10:30 AM')
  const [type, setType] = useState<Appointment['type']>('In-person OPD')
  const [patientNotes, setPatientNotes] = useState<string>('')
  const [submitted, setSubmitted] = useState(false)

  const timeSlots = ['09:00 AM', '10:30 AM', '11:45 AM', '02:00 PM', '04:30 PM', '06:00 PM']
  const dateOptions = [
    'Today (Urgent slot)',
    'Tomorrow, 10:30 AM',
    'Next Friday, 11:00 AM',
    'Next Monday, 09:30 AM',
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentHospital) return

    setSubmitted(true)
    setTimeout(() => {
      onConfirm({
        hospitalId: currentHospital.id,
        hospitalName: currentHospital.name,
        department,
        doctorName,
        date,
        time,
        type,
        patientNotes,
      })
    }, 600)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-xs" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-dialog-title"
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Calendar className="size-3.5" /> Fast-Track OPD Booking
            </span>
            <h2 id="booking-dialog-title" className="mt-2 text-xl font-bold tracking-tight text-foreground">
              Book Appointment or Consultation
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Instant digital token and hospital admission priority pass.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close booking modal"
            className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="size-16 animate-bounce text-emerald-600" />
            <h3 className="mt-4 text-lg font-bold text-foreground">Appointment Booked Successfully!</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Generating your confirmed appointment pass...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Hospital Selection */}
            <div>
              <label className="text-xs font-semibold text-foreground">Selected Healthcare Facility</label>
              <div className="relative mt-1.5">
                <HospitalIcon className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <select
                  value={selectedHospitalId}
                  onChange={(e) => {
                    setSelectedHospitalId(e.target.value)
                    const target = allHospitals.find((h) => h.id === e.target.value)
                    if (target?.departments[0]) setDepartment(target.departments[0])
                    if (target?.doctors[0]) setDoctorName(target.doctors[0].name)
                  }}
                  className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-8 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-ring"
                >
                  {allHospitals.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} — {h.location} ({h.distance} km)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Department & Doctor */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-foreground">Specialty / Department</label>
                <div className="relative mt-1.5">
                  <Stethoscope className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-8 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-ring"
                  >
                    {currentHospital?.departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Attending Specialist</label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <select
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-8 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-ring"
                  >
                    {currentHospital?.doctors && currentHospital.doctors.length > 0 ? (
                      currentHospital.doctors.map((doc) => (
                        <option key={doc.name} value={doc.name}>
                          {doc.name} ({doc.fee})
                        </option>
                      ))
                    ) : (
                      <option value="Senior Duty Specialist">Senior Duty Specialist</option>
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Consultation Mode */}
            <div>
              <label className="text-xs font-semibold text-foreground">Consultation Mode</label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(['In-person OPD', 'Video Consultation', 'Emergency Admission'] as const).map((mode) => (
                  <button
                    type="button"
                    key={mode}
                    onClick={() => setType(mode)}
                    className={`rounded-xl border p-2 text-center text-xs font-semibold transition ${
                      type === mode
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-border bg-muted/40 text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Date & Time Slot */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-foreground">Preferred Date</label>
                <div className="relative mt-1.5">
                  <Calendar className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <select
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-8 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-ring"
                  >
                    {dateOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Time Slot</label>
                <div className="relative mt-1.5">
                  <Clock className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-8 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-ring"
                  >
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Reason / Symptoms Note */}
            <div>
              <label className="text-xs font-semibold text-foreground">Symptoms or Clinical Notes (Optional)</label>
              <textarea
                value={patientNotes}
                onChange={(e) => setPatientNotes(e.target.value)}
                placeholder="Briefly describe your symptoms or reason for visit..."
                rows={2}
                className="mt-1.5 w-full rounded-xl border border-input bg-background p-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Live Fee & Insurance Guarantee */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
              <div className="flex items-center justify-between font-semibold text-foreground">
                <span>Verified Cashless / Standard OPD Pass</span>
                <span className="text-primary font-bold">Confirmed on Arrival</span>
              </div>
              <p className="mt-1 text-muted-foreground text-[11px]">
                Instant digital queue token generated. You will receive an SMS reminder 1 hour prior.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                Confirm & Get Token
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
