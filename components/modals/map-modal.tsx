'use client'

import React, { useState } from 'react'
import { X, Navigation, LocateFixed, Phone, ArrowRight } from 'lucide-react'
import { Hospital } from '@/lib/hospital-data'
import { PatientMap, DEFAULT_PATIENT_LOCATION, HOSPITAL_GEO_COORDINATES } from '@/components/patient-map'

interface MapModalProps {
  hospitals: Hospital[]
  onClose: () => void
  onSelectHospital: (hospital: Hospital) => void
  onBookHospital: (hospital: Hospital) => void
}

export function MapModal({ hospitals, onClose, onSelectHospital, onBookHospital }: MapModalProps) {
  const [activeHospital, setActiveHospital] = useState<Hospital>(hospitals[0] || null)

  // Patient location coordinates (stored in variables, ready for API/geolocation replacement)
  const patientLocation = {
    lat: 13.0067,
    lng: 80.2575,
    label: 'Patient Location',
    description: 'Adyar / Thiruvanmiyur Corridor, Chennai (Current GPS)',
  }

  const activeGeo = activeHospital
    ? HOSPITAL_GEO_COORDINATES[activeHospital.id] || {
        lat: patientLocation.lat + (activeHospital.coordinates.y - 50) * 0.003,
        lng: patientLocation.lng + (activeHospital.coordinates.x - 50) * 0.003,
      }
    : null

  // Derive a location label from the visible hospital list
  const locationLabel = (() => {
    if (!hospitals || hospitals.length === 0) return 'Tamil Nadu'
    const loc = hospitals[0]?.location ?? ''
    const parts = loc.split(',')
    return parts[parts.length - 1]?.trim() || 'Tamil Nadu'
  })()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 p-3 backdrop-blur-xs"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="map-modal-title"
        className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Navigation className="size-5" />
            </div>
            <div>
              <h2 id="map-modal-title" className="text-lg font-bold text-foreground">
                {locationLabel} Live Healthcare Radar Map
              </h2>
              <p className="text-xs text-muted-foreground">
                Interactive OpenStreetMap with real-time bed availability & emergency corridor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close interactive map"
            className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Map Body & Side Drawer */}
        <div className="grid flex-1 overflow-hidden lg:grid-cols-[1fr_340px]">
          {/* Interactive OpenStreetMap */}
          <div className="relative h-full min-h-[350px] w-full overflow-hidden bg-muted/20">
            <PatientMap
              patientLocation={patientLocation}
              hospitals={hospitals}
              height="100%"
              zoom={13}
              showControls={false}
              onSelectHospital={(h) => setActiveHospital(h)}
              onBookHospital={(h) => {
                onBookHospital(h)
                onClose()
              }}
              className="h-full w-full"
            />

            {/* Floating Map Legend */}
            <div className="absolute bottom-4 left-4 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-border/80 bg-card/95 p-3 text-xs shadow-md backdrop-blur-xs pointer-events-auto">
              <div className="flex items-center gap-1.5 font-medium">
                <span className="size-3 rounded-full bg-teal-700 ring-2 ring-teal-500/30" />
                <span className="text-foreground">Patient Location</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <span className="size-3 rounded-full bg-primary" />
                <span className="text-foreground">Verified Hospitals</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <LocateFixed className="size-3.5 text-teal-700" />
                <span className="text-muted-foreground">Zoom / Drag enabled</span>
              </div>
            </div>
          </div>

          {/* Active Hospital Preview Panel */}
          {activeHospital && (
            <div className="flex flex-col justify-between border-t border-border bg-card p-5 lg:border-t-0 lg:border-l overflow-y-auto">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {activeHospital.score}% AI Match
                </span>
                <h3 className="mt-2 text-base font-bold text-foreground">{activeHospital.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{activeHospital.address}</p>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-border bg-muted/40 p-2.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Available Beds</span>
                    <p className="text-sm font-bold text-teal-700">{activeHospital.resource.availableBeds} units</p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/40 p-2.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">ICU Ready</span>
                    <p className="text-sm font-bold text-foreground">
                      {activeHospital.resource.icuBeds} Beds
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/40 p-2.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Distance</span>
                    <p className="text-sm font-bold text-foreground">{activeHospital.distance} km</p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/40 p-2.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Wait Time</span>
                    <p className="text-sm font-bold text-foreground">{activeHospital.resource.waitingTime} mins</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Departments</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {activeHospital.departments.slice(0, 4).map((d) => (
                      <span key={d} className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-primary/5 p-3 flex items-center gap-2 text-xs">
                  <Phone className="size-4 text-primary shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">{activeHospital.phone}</p>
                    <p className="text-[10px] text-muted-foreground">24/7 Emergency Triage Desk</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <button
                  onClick={() => {
                    onSelectHospital(activeHospital)
                    onClose()
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer"
                >
                  View Full Hospital Profile
                </button>
                <button
                  onClick={() => {
                    onBookHospital(activeHospital)
                    onClose()
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 cursor-pointer"
                >
                  Book Priority Appointment <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
