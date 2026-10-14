'use client'

import { Heart, MapPin, BedDouble, Clock, Phone, Hospital as HospitalIcon, ArrowRight, Trash2 } from 'lucide-react'
import { Hospital } from '@/lib/hospital-data'

interface SavedHospitalsViewProps {
  hospitals: Hospital[]
  savedHospitalIds: string[]
  onToggleSave: (hospitalId: string) => void
  onViewDetails: (hospital: Hospital) => void
  onBookHospital: (hospital: Hospital) => void
  onNavigateSearch: () => void
}

export function SavedHospitalsView({
  hospitals,
  savedHospitalIds,
  onToggleSave,
  onViewDetails,
  onBookHospital,
  onNavigateSearch,
}: SavedHospitalsViewProps) {
  const savedHospitals = hospitals.filter((h) => savedHospitalIds.includes(h.id))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Heart className="size-4 text-rose-600 fill-rose-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Bookmarked Facilities
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            Saved Hospitals & Medical Centers
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Quick access to your preferred healthcare providers and frequent clinic destinations.
          </p>
        </div>

        <button
          onClick={onNavigateSearch}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shadow-xs self-start sm:self-auto"
        >
          Explore More Facilities <ArrowRight className="size-3.5" />
        </button>
      </div>

      {/* Hospital List */}
      {savedHospitals.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {savedHospitals.map((hospital) => (
            <div
              key={hospital.id}
              className="flex flex-col justify-between rounded-3xl border border-border bg-card p-5 shadow-xs transition hover:border-primary/40 hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3 min-w-0">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <HospitalIcon className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-foreground text-base">{hospital.name}</h3>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" /> {hospital.location} · {hospital.distance} km away
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleSave(hospital.id)}
                    className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 transition"
                    title="Remove from saved"
                  >
                    <Heart className="size-4 fill-rose-600" />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 border-y border-border py-3 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground">Available Beds</span>
                    <p className="font-bold text-foreground">{hospital.resource.availableBeds}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">ICU Capacity</span>
                    <p className="font-bold text-foreground">{hospital.resource.icuBeds} Beds</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Wait Time</span>
                    <p className="font-bold text-foreground">{hospital.resource.waitingTime} mins</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {hospital.departments.slice(0, 3).map((d) => (
                    <span key={d} className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex gap-2 pt-2">
                <button
                  onClick={() => onViewDetails(hospital)}
                  className="flex-1 rounded-xl border border-border py-2 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  View Details
                </button>
                <button
                  onClick={() => onBookHospital(hospital)}
                  className="flex-1 rounded-xl bg-primary py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Book Token
                </button>
                <a
                  href={`tel:${hospital.phone}`}
                  className="flex size-9 items-center justify-center rounded-xl border border-border text-primary hover:bg-primary/10"
                  title="Call hospital"
                >
                  <Phone className="size-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center">
          <Heart className="mx-auto size-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-base font-bold text-foreground">No Saved Hospitals Yet</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            Click the heart icon on any hospital card to save it here for fast-track booking and emergency quick-dial.
          </p>
          <button
            onClick={onNavigateSearch}
            className="mt-5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90"
          >
            Browse Chennai Hospitals
          </button>
        </div>
      )}
    </div>
  )
}
