'use client'

import { useState } from 'react'
import {
  Sparkles,
  ArrowRight,
  BedDouble,
  Clock,
  MapPin,
  CheckCircle2,
  Stethoscope,
  Heart,
  Scale,
  ShieldCheck,
  Building,
} from 'lucide-react'
import { Hospital } from '@/lib/hospital-data'

interface RecommendationsViewProps {
  hospitals: Hospital[]
  savedHospitalIds: string[]
  onToggleSave: (hospitalId: string) => void
  onViewDetails: (hospital: Hospital) => void
  onBookHospital: (hospital: Hospital) => void
}

export function RecommendationsView({
  hospitals,
  savedHospitalIds,
  onToggleSave,
  onViewDetails,
  onBookHospital,
}: RecommendationsViewProps) {
  const [compareAId, setCompareAId] = useState<string>(hospitals[0]?.id ?? '')
  const [compareBId, setCompareBId] = useState<string>(hospitals[1]?.id ?? '')

  const hospitalA = hospitals.find((h) => h.id === compareAId) || hospitals[0]
  const hospitalB = hospitals.find((h) => h.id === compareBId) || hospitals[1] || hospitals[0]

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl border border-primary/20 bg-linear-to-r from-primary/10 via-card to-card p-6 sm:p-8">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
            <Sparkles className="size-3.5" /> Explainable Healthcare Intelligence
          </span>
          <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            My AI Recommendations
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            SwasthyaConnect continuously synthesizes multi-factor hospital data — correlating your clinical profile,
            active bed census, emergency department triage queues, and traffic congestion corridors in Chennai.
          </p>
        </div>

        {/* Algorithm Weight Factor Badges */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-border pt-5">
          <div className="rounded-2xl border border-border bg-card p-3 shadow-xs">
            <span className="text-[11px] font-semibold text-muted-foreground">Department Alignment</span>
            <p className="mt-1 text-lg font-bold text-foreground">30% Weight</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-3 shadow-xs">
            <span className="text-[11px] font-semibold text-muted-foreground">ICU & Bed Capacity</span>
            <p className="mt-1 text-lg font-bold text-foreground">25% Weight</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-3 shadow-xs">
            <span className="text-[11px] font-semibold text-muted-foreground">Proximity & Travel Time</span>
            <p className="mt-1 text-lg font-bold text-foreground">25% Weight</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-3 shadow-xs">
            <span className="text-[11px] font-semibold text-muted-foreground">Queue & Wait Metrics</span>
            <p className="mt-1 text-lg font-bold text-foreground">20% Weight</p>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Tool */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-xs">
        <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="size-4 text-primary" />
              <h3 className="font-bold text-foreground text-base sm:text-lg">
                Side-by-Side Hospital Comparator
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Directly contrast clinical infrastructure, wait times, and verified bed availability.
            </p>
          </div>
          <span className="text-xs font-semibold text-primary">Live Comparison Matrix</span>
        </div>

        {/* Hospital Selectors */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-foreground">Select Hospital A</label>
            <select
              value={compareAId}
              onChange={(e) => setCompareAId(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.score}% match)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Select Hospital B</label>
            <select
              value={compareBId}
              onChange={(e) => setCompareBId(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.score}% match)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison Table / Cards */}
        {hospitalA && hospitalB && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {/* Hospital A Card */}
            <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                    Hospital A
                  </span>
                  <h4 className="mt-2 text-base font-bold text-foreground">{hospitalA.name}</h4>
                  <p className="text-xs text-muted-foreground">{hospitalA.location}</p>
                </div>
                <span className="text-xl font-extrabold text-primary">{hospitalA.score}%</span>
              </div>

              <div className="mt-4 space-y-2.5 divide-y divide-border text-xs">
                <div className="flex justify-between pt-2">
                  <span className="text-muted-foreground">Distance from GPS:</span>
                  <strong className="text-foreground">{hospitalA.distance} km</strong>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-muted-foreground">Available Beds:</span>
                  <strong className="text-foreground">{hospitalA.resource.availableBeds} units</strong>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-muted-foreground">ICU & Ventilators:</span>
                  <strong className="text-foreground">
                    {hospitalA.resource.icuBeds} ICU / {hospitalA.resource.ventilatorBeds} Vent
                  </strong>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-muted-foreground">Average Triage Wait:</span>
                  <strong className="text-foreground">{hospitalA.resource.waitingTime} minutes</strong>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-muted-foreground">Duty Doctors:</span>
                  <strong className="text-foreground">{hospitalA.resource.doctorsAvailable} Specialists</strong>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-muted-foreground">Ambulance Fleet:</span>
                  <strong className={hospitalA.ambulance ? 'text-emerald-700 font-bold' : 'text-muted-foreground'}>
                    {hospitalA.ambulance ? '24/7 Available' : 'On Demand'}
                  </strong>
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => onViewDetails(hospitalA)}
                  className="flex-1 rounded-xl border border-border py-2 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  View Profile
                </button>
                <button
                  onClick={() => onBookHospital(hospitalA)}
                  className="flex-1 rounded-xl bg-primary py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Book Token
                </button>
              </div>
            </div>

            {/* Hospital B Card */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                    Hospital B
                  </span>
                  <h4 className="mt-2 text-base font-bold text-foreground">{hospitalB.name}</h4>
                  <p className="text-xs text-muted-foreground">{hospitalB.location}</p>
                </div>
                <span className="text-xl font-extrabold text-muted-foreground">{hospitalB.score}%</span>
              </div>

              <div className="mt-4 space-y-2.5 divide-y divide-border text-xs">
                <div className="flex justify-between pt-2">
                  <span className="text-muted-foreground">Distance from GPS:</span>
                  <strong className="text-foreground">{hospitalB.distance} km</strong>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-muted-foreground">Available Beds:</span>
                  <strong className="text-foreground">{hospitalB.resource.availableBeds} units</strong>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-muted-foreground">ICU & Ventilators:</span>
                  <strong className="text-foreground">
                    {hospitalB.resource.icuBeds} ICU / {hospitalB.resource.ventilatorBeds} Vent
                  </strong>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-muted-foreground">Average Triage Wait:</span>
                  <strong className="text-foreground">{hospitalB.resource.waitingTime} minutes</strong>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-muted-foreground">Duty Doctors:</span>
                  <strong className="text-foreground">{hospitalB.resource.doctorsAvailable} Specialists</strong>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-muted-foreground">Ambulance Fleet:</span>
                  <strong className={hospitalB.ambulance ? 'text-emerald-700 font-bold' : 'text-muted-foreground'}>
                    {hospitalB.ambulance ? '24/7 Available' : 'On Demand'}
                  </strong>
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => onViewDetails(hospitalB)}
                  className="flex-1 rounded-xl border border-border py-2 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  View Profile
                </button>
                <button
                  onClick={() => onBookHospital(hospitalB)}
                  className="flex-1 rounded-xl bg-primary py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Book Token
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Ranked Recommendations List */}
      <section className="space-y-4">
        <h3 className="font-bold text-foreground text-base sm:text-lg">Ranked Recommendations Rationale</h3>
        <div className="space-y-3">
          {hospitals.map((hospital, index) => {
            const isSaved = savedHospitalIds.includes(hospital.id)
            return (
              <div
                key={hospital.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center shadow-xs hover:border-primary/30 transition"
              >
                <div className="flex items-start gap-3.5">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-foreground text-sm sm:text-base">{hospital.name}</h4>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        {hospital.score}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {hospital.location} · {hospital.distance} km away · {hospital.resource.waitingTime}m wait time
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {hospital.departments.slice(0, 3).map((dept) => (
                        <span key={dept} className="rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground font-medium">
                          {dept}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:self-center shrink-0">
                  <button
                    onClick={() => onToggleSave(hospital.id)}
                    aria-label="Bookmark hospital"
                    className="rounded-xl border border-border p-2 text-muted-foreground hover:text-rose-600 transition"
                  >
                    <Heart className={`size-4 ${isSaved ? 'fill-rose-600 text-rose-600' : ''}`} />
                  </button>
                  <button
                    onClick={() => onViewDetails(hospital)}
                    className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => onBookHospital(hospital)}
                    className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    Book
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
