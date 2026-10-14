'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { MapPin, Navigation, Layers } from 'lucide-react'
import {
  PatientLocation,
  DEFAULT_PATIENT_LOCATION,
  HOSPITAL_GEO_COORDINATES,
  DISTRICT_CENTRE_COORDS,
  PatientMapProps,
} from './patient-map-types'

// Dynamic import with ssr: false ensures Leaflet is only loaded on the client
const PatientMapInner = dynamic(() => import('./patient-map-inner'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] w-full flex-col items-center justify-center rounded-2xl border border-border bg-muted/30 text-center animate-pulse p-6">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Navigation className="size-6 animate-spin" />
      </div>
      <p className="mt-3 text-sm font-semibold text-foreground">Loading OpenStreetMap Live Radar...</p>
      <p className="mt-1 text-xs text-muted-foreground">Calibrating patient GPS & nearby hospital resources</p>
    </div>
  ),
})

export function PatientMap({
  patientLocation = DEFAULT_PATIENT_LOCATION,
  hospitals = [],
  height = '400px',
  className = '',
  zoom = 13,
  showControls = true,
  showHospitals = true,
  title = 'Live Healthcare & Hospital Radar',
  description = 'Real-time interactive OpenStreetMap showing your location and live bed capacities',
  onSelectHospital,
  onBookHospital,
}: PatientMapProps) {
  const [mounted, setMounted] = useState<boolean>(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div
        className={`flex w-full items-center justify-center rounded-2xl border border-border bg-card p-8 text-center ${className}`}
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Navigation className="size-6 animate-spin text-primary" />
          <span className="text-xs font-semibold text-foreground">Initializing Map Radar...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {showControls && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MapPin className="size-3.5" />
              </span>
              <h3 className="text-sm font-bold tracking-tight text-foreground">{title}</h3>
            </div>
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">
              <span className="size-2 rounded-full bg-primary animate-pulse" />
              Patient Pin Active
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-muted-foreground font-medium">
              <Layers className="size-3" />
              OpenStreetMap
            </span>
          </div>
        </div>
      )}

      <PatientMapInner
        patientLocation={patientLocation}
        hospitals={hospitals}
        height={height}
        zoom={zoom}
        showHospitals={showHospitals}
        onSelectHospital={onSelectHospital}
        onBookHospital={onBookHospital}
      />
    </div>
  )
}

export type { PatientLocation, PatientMapProps }
export { DEFAULT_PATIENT_LOCATION, HOSPITAL_GEO_COORDINATES, DISTRICT_CENTRE_COORDS }
