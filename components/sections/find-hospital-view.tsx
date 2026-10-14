'use client'

import { useState, useTransition, useCallback } from 'react'
import {
  Search,
  Sparkles,
  Siren,
  MapPin,
  Stethoscope,
  ChevronDown,
  BedDouble,
  Clock,
  Heart,
  Hospital as HospitalIcon,
  Check,
  Navigation,
  Phone,
  ArrowRight,
  LocateFixed,
  SlidersHorizontal,
  Cross,
  Loader2,
  AlertTriangle,
  Info,
} from 'lucide-react'
import { Hospital, PatientRequirement, specialties, recentSearches, defaultReasons } from '@/lib/hospital-data'
import { DISTRICTS } from '@/lib/hospital-search'
import { searchHospitals, type HospitalSearchResult } from '@/lib/hospital-search'

interface FindHospitalViewProps {
  hospitals: Hospital[]
  savedHospitalIds: string[]
  onToggleSave: (hospitalId: string) => void
  onViewDetails: (hospital: Hospital) => void
  onBookHospital: (hospital: Hospital) => void
  onOpenMap: () => void
  onEmergencySearch: () => void
  onFilterChange: (requirements: PatientRequirement) => void
}

const DEFAULT_REQUIREMENTS: PatientRequirement = {
  location: '',
  specialty: 'All Specialties',
  icuRequired: false,
  emergency: false,
  ambulanceRequired: false,
  notes: '',
}

export function FindHospitalView({
  hospitals,
  savedHospitalIds,
  onToggleSave,
  onViewDetails,
  onBookHospital,
  onOpenMap,
  onEmergencySearch,
  onFilterChange,
}: FindHospitalViewProps) {
  const [requirements, setRequirements] = useState<PatientRequirement>(DEFAULT_REQUIREMENTS)
  const [sortBy, setSortBy] = useState<'score' | 'distance' | 'wait' | 'beds'>('score')
  const [isPending, startTransition] = useTransition()

  // Search result metadata (from the async search)
  const [searchMeta, setSearchMeta] = useState<Omit<HospitalSearchResult, 'hospitals'>>({
    resolvedLocation: '',
    fromDatabase: false,
    noDataForLocation: false,
    unknownLocation: false,
  })

  // Local display list (updated after each search)
  const [displayHospitals, setDisplayHospitals] = useState<Hospital[]>(hospitals)
  const [hasSearched, setHasSearched] = useState(false)

  // ── Run the async search ─────────────────────────────────────────────────
  const runSearch = useCallback(
    (req: PatientRequirement) => {
      startTransition(async () => {
        const result = await searchHospitals(req)
        setDisplayHospitals(result.hospitals)
        setSearchMeta({
          resolvedLocation: result.resolvedLocation,
          fromDatabase: result.fromDatabase,
          noDataForLocation: result.noDataForLocation,
          unknownLocation: result.unknownLocation,
        })
        setHasSearched(true)
        // Sync parent state so map, dashboard, etc. also update
        onFilterChange(req)
      })
    },
    [onFilterChange]
  )

  // ── Field update helper ──────────────────────────────────────────────────
  const update = (key: keyof PatientRequirement, value: string | boolean) => {
    const updated = { ...requirements, [key]: value }
    setRequirements(updated)
    // Auto-run when toggles or specialty changes (instant feedback)
    if (typeof value === 'boolean' || key === 'specialty') {
      runSearch(updated)
    }
  }

  // ── Sort the currently displayed list ───────────────────────────────────
  const sortedHospitals = [...displayHospitals].sort((a, b) => {
    if (sortBy === 'score') {
      const scoreA = typeof a.score === 'number' && !isNaN(a.score) && a.score > 0 ? a.score : null
      const scoreB = typeof b.score === 'number' && !isNaN(b.score) && b.score > 0 ? b.score : null
      if (scoreA !== null && scoreB !== null) {
        if (scoreB !== scoreA) return scoreB - scoreA
        return a.name.localeCompare(b.name)
      }
      if (scoreA !== null) return -1
      if (scoreB !== null) return 1
      return a.name.localeCompare(b.name)
    }

    if (sortBy === 'distance') {
      const distA = typeof a.distance === 'number' && !isNaN(a.distance) && a.distance > 0 ? a.distance : null
      const distB = typeof b.distance === 'number' && !isNaN(b.distance) && b.distance > 0 ? b.distance : null
      // Known distances come first, sorted ascending (nearest first)
      if (distA !== null && distB !== null) {
        if (distA !== distB) return distA - distB
        return b.score - a.score
      }
      if (distA !== null) return -1
      if (distB !== null) return 1
      // Both unknown: place after known, tie-break by AI match score then name
      return (b.score ?? 0) - (a.score ?? 0) || a.name.localeCompare(b.name)
    }

    if (sortBy === 'wait') {
      const waitA =
        typeof a.resource?.waitingTime === 'number' &&
        !isNaN(a.resource.waitingTime) &&
        a.resource.waitingTime > 0
          ? a.resource.waitingTime
          : null
      const waitB =
        typeof b.resource?.waitingTime === 'number' &&
        !isNaN(b.resource.waitingTime) &&
        b.resource.waitingTime > 0
          ? b.resource.waitingTime
          : null
      // Known wait times come first, sorted ascending (lowest first)
      if (waitA !== null && waitB !== null) {
        if (waitA !== waitB) return waitA - waitB
        return b.score - a.score
      }
      if (waitA !== null) return -1
      if (waitB !== null) return 1
      // Both unknown: place after known, tie-break by AI match score
      return (b.score ?? 0) - (a.score ?? 0) || a.name.localeCompare(b.name)
    }

    if (sortBy === 'beds') {
      const bedsA =
        typeof a.resource?.availableBeds === 'number' && !isNaN(a.resource.availableBeds)
          ? a.resource.availableBeds
          : null
      const bedsB =
        typeof b.resource?.availableBeds === 'number' && !isNaN(b.resource.availableBeds)
          ? b.resource.availableBeds
          : null
      // Known bed counts come first, sorted descending (highest first)
      if (bedsA !== null && bedsB !== null) {
        if (bedsB !== bedsA) return bedsB - bedsA
        // Secondary sort by ICU beds
        const icuA = a.resource?.icuBeds ?? 0
        const icuB = b.resource?.icuBeds ?? 0
        if (icuB !== icuA) return icuB - icuA
        return b.score - a.score
      }
      if (bedsA !== null) return -1
      if (bedsB !== null) return 1
      // Both unknown: place after known, tie-break by AI match score
      return (b.score ?? 0) - (a.score ?? 0) || a.name.localeCompare(b.name)
    }

    return 0
  })

  const topHospital = sortedHospitals[0]

  // ── Reset ────────────────────────────────────────────────────────────────
  const handleReset = () => {
    // Preserve the currently selected district (location) while resetting other filters
    const updated = {
      ...DEFAULT_REQUIREMENTS,
      location: requirements.location,
    };
    setRequirements(updated);
    runSearch(updated);
  }

  return (
    <div className="space-y-6">
      {/* Search & AI Filter Card */}
      <section className="rounded-3xl border border-border bg-card p-5 sm:p-7 shadow-xs">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                AI Clinical Matching &amp; Resource Radar
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Find the Right Healthcare Facility
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Real-time hospital ranking based on live ICU capacity, doctor readiness, and proximity.
            </p>
          </div>
          <button
            onClick={onEmergencySearch}
            className="flex items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2 text-xs font-bold text-destructive hover:bg-destructive hover:text-destructive-foreground transition shadow-xs"
          >
            <Siren className="size-4" /> Emergency Mode
          </button>
        </div>

        {/* Inputs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-foreground">
            District
            <div className="relative">
              <MapPin className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <select
                id="hospital-district-select"
                value={requirements.location}
                onChange={(e) => {
                  const updated = { ...requirements, location: e.target.value }
                  setRequirements(updated)
                  runSearch(updated)
                }}
                className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-8 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select district</option>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" />
            </div>
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-semibold text-foreground">
            Healthcare Requirement / Specialty
            <div className="relative">
              <Stethoscope className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <select
                id="hospital-specialty-select"
                value={requirements.specialty}
                onChange={(e) => update('specialty', e.target.value)}
                className="h-10 w-full appearance-none rounded-xl border border-input bg-background pl-9 pr-8 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                {specialties.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" />
            </div>
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-semibold text-foreground">
            Symptoms or Specific Notes
            <input
              id="hospital-notes-input"
              value={requirements.notes}
              onChange={(e) => update('notes', e.target.value)}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              placeholder="e.g. Chest pain, breathlessness, fever"
            />
          </label>

          <div className="flex items-end">
            <button
              id="hospital-search-button"
              onClick={() => runSearch(requirements)}
              disabled={isPending}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              {isPending ? 'Searching…' : 'Search & Match'}
            </button>
          </div>
        </div>

        {/* Toggles */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
              <input
                type="checkbox"
                id="filter-icu"
                checked={requirements.icuRequired}
                onChange={(e) => update('icuRequired', e.target.checked)}
                className="size-4 rounded accent-primary cursor-pointer"
              />
              <span>ICU Required</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
              <input
                type="checkbox"
                id="filter-emergency"
                checked={requirements.emergency}
                onChange={(e) => update('emergency', e.target.checked)}
                className="size-4 rounded accent-primary cursor-pointer"
              />
              <span>24/7 Emergency Care</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
              <input
                type="checkbox"
                id="filter-ambulance"
                checked={requirements.ambulanceRequired}
                onChange={(e) => update('ambulanceRequired', e.target.checked)}
                className="size-4 rounded accent-primary cursor-pointer"
              />
              <span>Ambulance Available</span>
            </label>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <SlidersHorizontal className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground font-medium">Sort By:</span>
            <select
              id="hospital-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-lg border border-input bg-background px-2.5 py-1 font-semibold text-foreground outline-none cursor-pointer focus:ring-2 focus:ring-ring"
            >
              <option value="score">Best AI Match %</option>
              <option value="distance">Shortest Distance</option>
              <option value="wait">Lowest Wait Time</option>
              <option value="beds">Most Available Beds</option>
            </select>
          </div>
        </div>
      </section>

      {/* Quick Filter Tag Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground mr-1">Quick searches:</span>
        {recentSearches.map((chip) => (
          <button
            key={chip.label}
            onClick={() => {
              const updated = {
                ...requirements,
                specialty: chip.label === 'ICU' ? 'Emergency Care' : chip.label,
              }
              setRequirements(updated)
              runSearch(updated)
            }}
            className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/40 hover:bg-primary/5 transition"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Main Grid: Hospital List vs Radar Map & AI Reasons */}
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        {/* Left: Recommended Hospital Cards */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              {/* Dynamic result count and location label */}
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                {isPending
                  ? 'Searching…'
                  : `${sortedHospitals.length} Healthcare ${sortedHospitals.length === 1 ? 'Facility' : 'Facilities'} Matched`}
                {searchMeta.resolvedLocation && !isPending && (
                  <span className="ml-1 normal-case font-normal text-muted-foreground">
                    — {searchMeta.resolvedLocation}
                  </span>
                )}
              </p>
              <h3 className="text-lg font-bold text-foreground">Verified Hospital Rankings</h3>
            </div>
            <button
              onClick={onOpenMap}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <Navigation className="size-3.5" /> View on Radar Map
            </button>
          </div>

          {/* DB source badge */}
          {searchMeta.fromDatabase && !isPending && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
              <Check className="size-3.5 shrink-0" />
              Live data from Supabase database for {searchMeta.resolvedLocation}
            </div>
          )}

          {/* Active sort limitation & explanation note */}
          {!isPending && sortedHospitals.length > 0 && (
            <>
              {sortBy === 'distance' && sortedHospitals.some((h) => !h.distance || h.distance <= 0) && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                  <Info className="size-3.5 shrink-0 text-amber-600" />
                  <span>
                    Sorted by distance. Verified GPS coordinates are listed first; facilities with pending location telemetry appear below.
                  </span>
                </div>
              )}
              {sortBy === 'wait' && (
                <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-800">
                  <Info className="size-3.5 shrink-0 text-blue-600" />
                  <span>
                    Sorted by emergency &amp; triage wait times (lowest first). Facilities with verified real-time queues appear first.
                  </span>
                </div>
              )}
              {sortBy === 'beds' && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
                  <Info className="size-3.5 shrink-0 text-emerald-600" />
                  <span>
                    Sorted by available bed capacity (highest first). Facilities with verified real-time census appear first.
                  </span>
                </div>
              )}
            </>
          )}

          <div className="flex flex-col gap-4">
            {isPending ? (
              // Loading skeleton
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rounded-3xl border border-border bg-card p-5 animate-pulse"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="size-11 rounded-2xl bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 rounded bg-muted w-3/4" />
                        <div className="h-3 rounded bg-muted w-1/2" />
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-4 gap-3">
                      {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="h-10 rounded bg-muted" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedHospitals.length > 0 ? (
              sortedHospitals.map((hospital) => {
                const isSaved = savedHospitalIds.includes(hospital.id)
                return (
                  <article
                    key={hospital.id}
                    className="group rounded-3xl border border-border bg-card p-5 shadow-xs transition hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 gap-3.5">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <HospitalIcon className="size-6" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="truncate font-bold text-foreground text-base">{hospital.name}</h4>
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="size-3.5 shrink-0" />
                            {hospital.location}
                            {hospital.distance > 0 ? (
                              <> · <strong className="text-foreground">{hospital.distance} km</strong> away</>
                            ) : (
                              <span className="text-muted-foreground/60 italic text-[11px]"> · Distance pending GPS</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onToggleSave(hospital.id)}
                          aria-label={isSaved ? 'Remove from saved' : 'Save hospital'}
                          className={`rounded-xl border p-2 transition ${
                            isSaved
                              ? 'border-rose-200 bg-rose-50 text-rose-600'
                              : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          <Heart className={`size-4 ${isSaved ? 'fill-rose-600' : ''}`} />
                        </button>
                        <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                          {hospital.score}% match
                        </span>
                      </div>
                    </div>

                    {/* Key Resource Numbers */}
                    <div className="mt-4 grid grid-cols-2 gap-3 border-y border-border py-3 sm:grid-cols-4">
                      <div>
                        <div className="mb-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <BedDouble className="size-3" /> Available Beds
                        </div>
                        <p className="text-sm font-bold text-foreground">{hospital.resource.availableBeds}</p>
                      </div>
                      <div>
                        <div className="mb-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Cross className="size-3" /> ICU Ready
                        </div>
                        <p className="text-sm font-bold text-foreground">{hospital.resource.icuBeds} Beds</p>
                      </div>
                      <div>
                        <div className="mb-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Stethoscope className="size-3" /> Specialists
                        </div>
                        <p className="text-sm font-bold text-foreground">{hospital.resource.doctorsAvailable}</p>
                      </div>
                      <div>
                        <div className="mb-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="size-3" /> Wait Time
                        </div>
                        <p className="text-sm font-bold text-foreground">{hospital.resource.waitingTime} min</p>
                      </div>
                    </div>

                    {/* Departments & Features */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {hospital.emergency && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <Check className="size-3" /> 24/7 ER Ready
                        </span>
                      )}
                      {hospital.ambulance && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <Check className="size-3" /> Ambulance Fleet
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground">{hospital.type}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 flex gap-2.5">
                      <button
                        onClick={() => onViewDetails(hospital)}
                        className="flex-1 rounded-xl border border-border py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => onBookHospital(hospital)}
                        className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition"
                      >
                        Book Appointment
                      </button>
                      <a
                        href={`tel:${hospital.phone}`}
                        className="flex size-9 items-center justify-center rounded-xl border border-border text-primary hover:bg-primary/10 transition"
                        title={`Call ${hospital.phone}`}
                      >
                        <Phone className="size-4" />
                      </a>
                    </div>
                  </article>
                )
              })
            ) : hasSearched ? (
              // ── Empty state — differentiated by reason ──────────────────
              <div className="rounded-3xl border border-dashed border-border p-12 text-center">
                {searchMeta.unknownLocation ? (
                  <>
                    <AlertTriangle className="mx-auto size-8 text-amber-500" />
                    <h4 className="mt-3 font-bold text-foreground">
                      Location Not Recognised
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      &ldquo;{searchMeta.resolvedLocation}&rdquo; could not be matched to a Tamil Nadu district.
                      Try a district name like <strong>Coimbatore</strong>, <strong>Madurai</strong>, or a 6-digit pincode.
                    </p>
                  </>
                ) : searchMeta.noDataForLocation ? (
                  <>
                    <Info className="mx-auto size-8 text-primary" />
                    <h4 className="mt-3 font-bold text-foreground">
                      No Hospitals Found for {searchMeta.resolvedLocation}
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Hospital data for <strong>{searchMeta.resolvedLocation}</strong> has not yet been added to the database.
                      Contact your administrator to add hospital records for this district.
                    </p>
                    <p className="mt-3 text-[11px] text-muted-foreground">
                      Try searching for <strong>Chennai</strong> to see available demo data, or relax specialty/ICU filters.
                    </p>
                  </>
                ) : (
                  <>
                    <Search className="mx-auto size-8 text-muted-foreground" />
                    <h4 className="mt-3 font-bold text-foreground">
                      {sortedHospitals.length} Healthcare {sortedHospitals.length === 1 ? 'Facility' : 'Facilities'} Matched
                      {searchMeta.resolvedLocation ? ` — ${searchMeta.resolvedLocation}` : ''}
                    </h4>
                    {requirements.specialty && requirements.specialty !== 'All Specialties' ? (
                      <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
                        No facilities in <strong>{searchMeta.resolvedLocation || 'this district'}</strong> currently match the &ldquo;{requirements.specialty}&rdquo; specialty filter in the state hospital database.
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Try relaxing your ICU, specialty, or emergency criteria.
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      {requirements.specialty && requirements.specialty !== 'All Specialties' && (
                        <button
                          onClick={() => {
                            const updated = { ...requirements, specialty: 'All Specialties' }
                            setRequirements(updated)
                            runSearch(updated)
                          }}
                          className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-xs cursor-pointer"
                        >
                          View All {searchMeta.resolvedLocation || 'District'} Facilities
                        </button>
                      )}
                      <button
                        onClick={handleReset}
                        className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              // Initial state before first search
              <div className="rounded-3xl border border-dashed border-border p-10 text-center">
                <Search className="mx-auto size-8 text-muted-foreground" />
                <h4 className="mt-3 font-bold text-foreground">Enter a Location to Search</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Type a district, city, or pincode and click <strong>Search &amp; Match</strong>.
                </p>
                <button
                  onClick={() => runSearch(requirements)}
                  className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
                >
                  Search Now
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Right: Interactive Map Widget & AI Decision Factors */}
        <div className="space-y-6">
          {/* Map Preview Card */}
          <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h4 className="font-bold text-foreground text-sm">Nearby Healthcare Map</h4>
                <p className="text-xs text-muted-foreground">
                  {searchMeta.resolvedLocation
                    ? `Live facilities — ${searchMeta.resolvedLocation}`
                    : 'Live facilities near your location'}
                </p>
              </div>
              <button
                onClick={onOpenMap}
                className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
              >
                <Navigation className="size-3.5" /> Fullscreen Map
              </button>
            </div>

            <div
              onClick={onOpenMap}
              className="group relative h-[250px] cursor-pointer overflow-hidden bg-[#e8f1ec]"
              title="Click to expand interactive radar map"
            >
              <div
                className="absolute inset-0 opacity-40 group-hover:opacity-50 transition-opacity"
                style={{
                  backgroundImage:
                    'linear-gradient(32deg, transparent 48%, #a8c2b6 49%, #a8c2b6 51%, transparent 52%), linear-gradient(115deg, transparent 48%, #b7ccc2 49%, #b7ccc2 51%, transparent 52%), linear-gradient(#c6d8d0 1px, transparent 1px), linear-gradient(90deg, #c6d8d0 1px, transparent 1px)',
                  backgroundSize: '180px 140px, 220px 180px, 48px 48px, 48px 48px',
                }}
              />
              <div className="absolute left-[40%] top-[48%] flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-card bg-primary text-primary-foreground shadow-lg animate-pulse">
                <LocateFixed className="size-4" />
              </div>

              {sortedHospitals.slice(0, 4).map((hospital, idx) => (
                <div
                  key={hospital.id}
                  className={`absolute flex size-8 items-center justify-center rounded-full border-2 border-card bg-destructive text-destructive-foreground shadow-md transition-transform group-hover:scale-110 ${
                    idx === 0
                      ? 'left-[58%] top-[30%]'
                      : idx === 1
                      ? 'left-[68%] top-[60%]'
                      : idx === 2
                      ? 'left-[26%] top-[64%]'
                      : 'left-[46%] top-[76%]'
                  }`}
                  title={hospital.name}
                >
                  <HospitalIcon className="size-3.5" />
                </div>
              ))}

              <div className="absolute inset-x-0 bottom-3 flex justify-center">
                <span className="rounded-full bg-card/90 px-3.5 py-1 text-xs font-semibold text-foreground shadow-md backdrop-blur-xs border border-border">
                  Click to open Live GPS Route Map
                </span>
              </div>
            </div>
          </section>

          {/* AI Decision Explanation Box */}
          {topHospital && (
            <section className="rounded-3xl border border-primary/20 bg-primary/5 p-6">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-foreground text-sm">
                      Why Swasthya AI Ranks {topHospital.name} #1
                    </h4>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Transparent algorithmic breakdown based on real-time triage capacity.
                  </p>
                  <ul className="mt-4 flex flex-col gap-2.5">
                    {defaultReasons.map((reason) => (
                      <li key={reason} className="flex items-center gap-2 text-xs font-medium text-foreground">
                        <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="size-2.5" />
                        </span>
                        {reason}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 flex gap-2">
                    <button
                      onClick={() => onBookHospital(topHospital)}
                      className="rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shadow-xs"
                    >
                      Book at {topHospital.name.split(' ')[0]} <ArrowRight className="inline size-3 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
