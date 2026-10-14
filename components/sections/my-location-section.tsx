'use client'

import { useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import {
  MapPin,
  Navigation,
  Radio,
  StopCircle,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Phone,
  ExternalLink,
  Loader2,
  Hospital as HospitalIcon,
  Search,
  SlidersHorizontal,
  Info,
  Crosshair,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { usePatientLocation } from '@/lib/use-patient-location'

// ─── Types ────────────────────────────────────────────────────────────────────

interface OverpassHospital {
  id: number
  lat: number
  lon: number
  tags: Record<string, string>
  distanceKm: number
}

type FacilityType = 'hospital' | 'clinic' | 'pharmacy' | 'emergency'

const FACILITY_CONFIGS: Record<
  FacilityType,
  { label: string; query: string; color: string; bg: string; icon: string }
> = {
  hospital: {
    label: 'Hospitals',
    query: 'amenity=hospital',
    color: 'text-sky-700',
    bg: 'bg-sky-500/10',
    icon: '🏥',
  },
  clinic: {
    label: 'Clinics',
    query: 'amenity=clinic',
    color: 'text-teal-700',
    bg: 'bg-teal-500/10',
    icon: '🏨',
  },
  pharmacy: {
    label: 'Pharmacies',
    query: 'amenity=pharmacy',
    color: 'text-emerald-700',
    bg: 'bg-emerald-500/10',
    icon: '💊',
  },
  emergency: {
    label: 'Emergency',
    query: 'emergency=yes',
    color: 'text-red-700',
    bg: 'bg-red-500/10',
    icon: '🚨',
  },
}

const RADIUS_OPTIONS = [500, 1000, 2000, 5000] // metres

// ─── Haversine distance helper ────────────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── Overpass fetch ────────────────────────────────────────────────────────────

async function fetchNearbyFacilities(
  lat: number,
  lng: number,
  radiusMetres: number,
  facilityType: FacilityType
): Promise<OverpassHospital[]> {
  const cfg = FACILITY_CONFIGS[facilityType]
  const [key, value] = cfg.query.split('=')

  // Build Overpass QL query - tries node, way, and relation
  const query = `
    [out:json][timeout:25];
    (
      node["${key}"="${value}"](around:${radiusMetres},${lat},${lng});
      way["${key}"="${value}"](around:${radiusMetres},${lat},${lng});
    );
    out center tags;
  `

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

  if (!res.ok) throw new Error(`Overpass API error: ${res.status}`)

  const data = await res.json()

  // Normalize node & way (ways have `center` coords)
  return (data.elements as Array<Record<string, unknown>>)
    .map((el) => {
      const elLat =
        typeof el.lat === 'number'
          ? el.lat
          : (el.center as { lat: number } | undefined)?.lat
      const elLon =
        typeof el.lon === 'number'
          ? el.lon
          : (el.center as { lon: number } | undefined)?.lon

      if (!elLat || !elLon) return null

      return {
        id: el.id as number,
        lat: elLat,
        lon: elLon,
        tags: (el.tags as Record<string, string>) || {},
        distanceKm: haversineKm(lat, lng, elLat, elLon),
      }
    })
    .filter((x): x is OverpassHospital => x !== null)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 20)
}

// ─── Dynamically loaded map (SSR-safe) ────────────────────────────────────────

const NearbyMapInner = dynamic(() => import('@/components/nearby-map-inner'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[340px] w-full items-center justify-center rounded-2xl border border-border bg-muted/30 animate-pulse">
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-primary" />
        <span className="text-xs font-semibold">Loading map…</span>
      </div>
    </div>
  ),
})

// ─── Main Component ───────────────────────────────────────────────────────────

interface MyLocationSectionProps {
  userId: string
}

export function MyLocationSection({ userId: _userId }: MyLocationSectionProps) {
  const {
    coords,
    address,
    permission,
    isLiveTracking,
    error,
    requestLocation,
    startLiveTracking,
    stopLiveTracking,
  } = usePatientLocation()

  const [facilities, setFacilities] = useState<OverpassHospital[]>([])
  const [facilityType, setFacilityType] = useState<FacilityType>('hospital')
  const [radiusMetres, setRadiusMetres] = useState<number>(2000)
  const [fetchState, setFetchState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [selectedFacility, setSelectedFacility] = useState<OverpassHospital | null>(null)

  // Auto-fetch when coords become available
  const fetchFacilities = useCallback(
    async (lat: number, lng: number, type: FacilityType, radius: number) => {
      setFetchState('loading')
      setFetchError(null)
      try {
        const results = await fetchNearbyFacilities(lat, lng, radius, type)
        setFacilities(results)
        setFetchState('done')
      } catch (e) {
        setFetchError(
          e instanceof Error ? e.message : 'Failed to fetch nearby facilities. Try again later.'
        )
        setFetchState('error')
      }
    },
    []
  )

  useEffect(() => {
    if (coords) {
      fetchFacilities(coords.lat, coords.lng, facilityType, radiusMetres)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords?.lat, coords?.lng, facilityType, radiusMetres])

  const cfg = FACILITY_CONFIGS[facilityType]

  const formatDistance = (km: number) =>
    km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`

  const formatAccuracy = (acc: number) =>
    acc < 100 ? `±${Math.round(acc)} m` : `±${(acc / 1000).toFixed(1)} km (low accuracy)`

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString()

  const getDirectionsUrl = (lat: number, lon: number, name: string) =>
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&destination_place_id=${encodeURIComponent(name)}`

  // ─── Location Not Yet Requested ──────────────────────────────────────────
  if (permission === 'idle') {
    return (
      <div className="space-y-6">
        <SectionHeader />
        <div className="rounded-3xl border border-border bg-card p-8 sm:p-12 text-center shadow-xs">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
            <MapPin className="size-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Enable Location Services</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Allow this page to access your device location to find nearby hospitals, clinics, and
            pharmacies on a live interactive map. Your location is never stored without your
            consent.
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground">
            <Info className="size-3.5" />
            Your browser will ask for permission before sharing any location data.
          </div>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <button
              id="enable-location-btn"
              onClick={requestLocation}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition cursor-pointer"
            >
              <Crosshair className="size-4" /> Enable Location
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Requesting ───────────────────────────────────────────────────────────
  if (permission === 'requesting' && !coords) {
    return (
      <div className="space-y-6">
        <SectionHeader />
        <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-xs">
          <Loader2 className="mx-auto size-10 animate-spin text-primary" />
          <p className="mt-3 text-sm font-semibold text-foreground">Requesting location…</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Please allow location access in the browser permission prompt.
          </p>
        </div>
      </div>
    )
  }

  // ─── Permission Denied ────────────────────────────────────────────────────
  if (permission === 'denied' || permission === 'unavailable') {
    return (
      <div className="space-y-6">
        <SectionHeader />
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-6 sm:p-8 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">
                {permission === 'unavailable' ? 'Geolocation Not Supported' : 'Location Permission Denied'}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{error}</p>
              {permission === 'denied' && (
                <ol className="mt-3 space-y-1 text-xs text-muted-foreground list-decimal list-inside">
                  <li>Click the lock 🔒 or info ℹ️ icon in your browser address bar.</li>
                  <li>Find <strong className="text-foreground">Location</strong> → set to <strong className="text-foreground">Allow</strong>.</li>
                  <li>Reload this page and click <strong className="text-foreground">Enable Location</strong> again.</li>
                </ol>
              )}
            </div>
          </div>
          <button
            onClick={requestLocation}
            className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer"
          >
            <RefreshCw className="size-3.5" /> Try Again
          </button>
        </div>

        {/* Show rest of dashboard info even when location denied */}
        <div className="rounded-2xl border border-border bg-muted/30 p-5 text-center">
          <p className="text-xs text-muted-foreground">
            The rest of your Patient Dashboard remains fully accessible below. Location features
            require browser permission to activate.
          </p>
        </div>
      </div>
    )
  }

  // ─── Error (non-permission) ───────────────────────────────────────────────
  if (error && !coords) {
    return (
      <div className="space-y-6">
        <SectionHeader />
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">{error}</p>
              <button
                onClick={requestLocation}
                className="mt-3 flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition"
              >
                <RefreshCw className="size-3.5" /> Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Location Granted ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <SectionHeader />

      {/* ── Status Banner ── */}
      <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          {/* Coords & Address */}
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {isLiveTracking ? (
                <Radio className="size-5 animate-pulse" />
              ) : (
                <MapPin className="size-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-foreground">
                  {isLiveTracking ? 'Live Location Active' : 'Location Fixed'}
                </span>
                {isLiveTracking && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Sharing live
                  </span>
                )}
              </div>
              {coords && (
                <p className="mt-0.5 text-xs text-muted-foreground font-mono">
                  {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}{' '}
                  <span className="not-italic text-muted-foreground/70">
                    ({formatAccuracy(coords.accuracy)})
                  </span>
                </p>
              )}
              {address && (
                <p className="mt-1 text-xs text-foreground font-medium flex items-center gap-1">
                  <MapPin className="size-3 text-primary" />
                  {address}
                </p>
              )}
              {coords && (
                <p className="mt-0.5 text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3" /> Updated {formatTime(coords.timestamp)}
                </p>
              )}
              {isLiveTracking && (
                <p className="mt-1 text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full inline-block">
                  ⚠️ Location is being shared in this browser tab only. Sharing stops when you close or navigate away.
                </p>
              )}
            </div>
          </div>

          {/* Tracking Controls */}
          <div className="flex flex-wrap gap-2 shrink-0">
            {!isLiveTracking ? (
              <>
                <button
                  id="start-live-tracking-btn"
                  onClick={startLiveTracking}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer shadow-sm"
                >
                  <Radio className="size-3.5" /> Start Live Location
                </button>
                <button
                  onClick={requestLocation}
                  className="flex items-center gap-2 rounded-xl border border-border bg-muted/60 px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer"
                >
                  <RefreshCw className="size-3.5" /> Refresh
                </button>
              </>
            ) : (
              <button
                id="stop-live-tracking-btn"
                onClick={stopLiveTracking}
                className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-2 text-xs font-bold text-destructive hover:bg-destructive hover:text-destructive-foreground transition cursor-pointer"
              >
                <StopCircle className="size-3.5" /> Stop Live Location
              </button>
            )}
          </div>
        </div>

        {/* Live tracking explicit notice */}
        {isLiveTracking && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
            <Wifi className="size-4 text-emerald-600 shrink-0" />
            <p className="text-xs text-emerald-800">
              <strong>Live tracking is on.</strong> Your position is updating continuously using{' '}
              <code className="bg-emerald-100 px-1 rounded">watchPosition()</code>. The map marker
              updates as you move. No GPS history is stored automatically.
            </p>
          </div>
        )}
        {!isLiveTracking && permission === 'granted' && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-muted/50 border border-border px-4 py-3">
            <WifiOff className="size-4 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              Live tracking is <strong>off</strong>. Your position is fixed at the last reading.
              Click <strong>Start Live Location</strong> to receive continuous updates.
            </p>
          </div>
        )}
      </div>

      {/* ── Interactive Map ── */}
      {coords && (
        <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Navigation className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Live Map</h3>
                <p className="text-xs text-muted-foreground">
                  Your position + nearby {cfg.label.toLowerCase()} within{' '}
                  {radiusMetres >= 1000
                    ? `${radiusMetres / 1000} km`
                    : `${radiusMetres} m`}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary uppercase tracking-wide">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              OpenStreetMap
            </span>
          </div>
          <NearbyMapInner
            patientLat={coords.lat}
            patientLng={coords.lng}
            isLive={isLiveTracking}
            facilities={facilities}
            selectedId={selectedFacility?.id ?? null}
            onSelectFacility={setSelectedFacility}
            height={380}
          />
        </div>
      )}

      {/* ── Nearby Facilities Search Controls ── */}
      {coords && (
        <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Search className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Nearby Hospitals & Services</h3>
                <p className="text-xs text-muted-foreground">
                  Real data via OpenStreetMap / Overpass API
                </p>
              </div>
            </div>
            {fetchState === 'loading' && (
              <Loader2 className="size-4 animate-spin text-primary" />
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center mb-5">
            {/* Facility type toggles */}
            <div className="flex items-center gap-1 flex-wrap">
              <SlidersHorizontal className="size-3.5 text-muted-foreground mr-1" />
              {(Object.entries(FACILITY_CONFIGS) as [FacilityType, typeof FACILITY_CONFIGS[FacilityType]][]).map(
                ([type, c]) => (
                  <button
                    key={type}
                    id={`facility-type-${type}`}
                    onClick={() => setFacilityType(type)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      facilityType === type
                        ? `${c.bg} ${c.color} ring-1 ring-current/30`
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {c.icon} {c.label}
                  </button>
                )
              )}
            </div>

            {/* Radius selector */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-muted-foreground font-medium">Radius:</span>
              <select
                id="search-radius-select"
                value={radiusMetres}
                onChange={(e) => setRadiusMetres(Number(e.target.value))}
                className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                {RADIUS_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r >= 1000 ? `${r / 1000} km` : `${r} m`}
                  </option>
                ))}
              </select>
              <button
                onClick={() => fetchFacilities(coords.lat, coords.lng, facilityType, radiusMetres)}
                disabled={fetchState === 'loading'}
                className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`size-3 ${fetchState === 'loading' ? 'animate-spin' : ''}`} />
                Search
              </button>
            </div>
          </div>

          {/* Results */}
          {fetchState === 'error' && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 flex items-start gap-2">
              <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-600" />
              <span>{fetchError}</span>
            </div>
          )}

          {fetchState === 'loading' && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-[76px] rounded-2xl bg-muted/40 animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
              <p className="text-center text-xs text-muted-foreground pt-1">
                Querying OpenStreetMap Overpass API…
              </p>
            </div>
          )}

          {fetchState === 'done' && facilities.length === 0 && (
            <div className="py-10 text-center">
              <HospitalIcon className="mx-auto size-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-semibold text-foreground">
                No {cfg.label.toLowerCase()} found nearby
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try increasing the search radius or switching facility type.
              </p>
            </div>
          )}

          {fetchState === 'done' && facilities.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground mb-3">
                Found <strong className="text-foreground">{facilities.length}</strong> result
                {facilities.length !== 1 ? 's' : ''} within{' '}
                {radiusMetres >= 1000 ? `${radiusMetres / 1000} km` : `${radiusMetres} m`},
                sorted by distance.
              </p>
              {facilities.map((f, idx) => {
                const name = f.tags.name || f.tags['name:en'] || `Unnamed ${cfg.label.slice(0, -1)}`
                const street = [f.tags['addr:street'], f.tags['addr:housenumber']]
                  .filter(Boolean)
                  .join(' ')
                const city = f.tags['addr:city'] || f.tags['addr:suburb'] || ''
                const displayAddress = [street, city].filter(Boolean).join(', ')
                const phone = f.tags.phone || f.tags['contact:phone'] || null
                const website = f.tags.website || f.tags['contact:website'] || null
                const isSelected = selectedFacility?.id === f.id

                return (
                  <div
                    key={f.id}
                    id={`facility-${f.id}`}
                    onClick={() => setSelectedFacility(isSelected ? null : f)}
                    className={`group rounded-2xl border p-4 cursor-pointer transition ${
                      isSelected
                        ? 'border-primary/40 bg-primary/5 shadow-xs'
                        : 'border-border bg-card hover:border-primary/20 hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-base ${cfg.bg}`}
                        >
                          {idx + 1 <= 3 ? (
                            <span className={`text-xs font-black ${cfg.color}`}>#{idx + 1}</span>
                          ) : (
                            cfg.icon
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{name}</p>
                          {displayAddress && (
                            <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1 truncate">
                              <MapPin className="size-3 shrink-0" /> {displayAddress}
                            </p>
                          )}
                          {f.tags.opening_hours && (
                            <p className="mt-0.5 text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="size-3" /> {f.tags.opening_hours}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${cfg.bg} ${cfg.color}`}
                        >
                          {formatDistance(f.distanceKm)}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="size-3.5 text-primary" />
                        )}
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-2">
                        {phone && (
                          <a
                            href={`tel:${phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition"
                          >
                            <Phone className="size-3" /> {phone}
                          </a>
                        )}
                        <a
                          href={getDirectionsUrl(f.lat, f.lon, name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-600 hover:text-white transition"
                        >
                          <Navigation className="size-3" /> Get Directions
                          <ExternalLink className="size-3" />
                        </a>
                        {website && (
                          <a
                            href={website.startsWith('http') ? website : `https://${website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/80 transition"
                          >
                            <ExternalLink className="size-3" /> Website
                          </a>
                        )}
                        <span className="flex items-center gap-1 rounded-lg bg-muted/50 px-3 py-1.5 text-[10px] font-mono text-muted-foreground">
                          {f.lat.toFixed(5)}, {f.lon.toFixed(5)}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
              <p className="pt-2 text-center text-[10px] text-muted-foreground">
                Data from{' '}
                <a
                  href="https://www.openstreetmap.org/copyright"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  © OpenStreetMap contributors
                </a>
                {' '}via Overpass API. Contact details shown only when verified in OSM.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SectionHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">My Location</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Real-time GPS, live tracking, and nearby healthcare discovery powered by OpenStreetMap
        </p>
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
        <MapPin className="size-3 text-primary" /> Patient Location Hub
      </span>
    </div>
  )
}
