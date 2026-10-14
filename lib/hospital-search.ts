/**
 * hospital-search.ts
 *
 * Dynamic, Supabase-backed hospital search for Tamil Nadu districts.
 *
 * Strategy:
 *   1. Query Supabase `hospitals` table with district / pincode filters.
 *   2. If Supabase returns results, map them to the app's Hospital shape.
 *   3. If Supabase has no records for that location (or errors), fall back to
 *      filtering the local static array — so Chennai always has demo data and
 *      other districts get an honest "no data" empty state.
 *   4. Apply specialty, ICU, emergency, and ambulance filters.
 *   5. Never cross-pollinate districts (a Coimbatore search never shows Chennai results).
 */

import { supabase } from '@/lib/supabase'
import {
  hospitals as STATIC_HOSPITALS,
  type Hospital,
  type PatientRequirement,
} from '@/lib/hospital-data'

// ─── District / city name normalisation ───────────────────────────────────────

/**
 * Known Tamil Nadu district aliases → canonical names used in the DB.
 * Handles common alternate spellings and common-name vs. official-name mismatches.
 */
const DISTRICT_ALIASES: Record<string, string> = {
  // Chennai cluster
  chennai: 'Chennai',
  madras: 'Chennai',
  'park town': 'Chennai',
  adyar: 'Chennai',
  egmore: 'Chennai',
  't nagar': 'Chennai',
  tnagar: 'Chennai',
  velachery: 'Chennai',
  tambaram: 'Chennai',
  'thousand lights': 'Chennai',
  vadapalani: 'Chennai',
  alwarpet: 'Chennai',
  manapakkam: 'Chennai',
  // Coimbatore cluster
  coimbatore: 'Coimbatore',
  kovai: 'Coimbatore',
  'rs puram': 'Coimbatore',
  pollachi: 'Coimbatore',
  // Madurai cluster
  madurai: 'Madurai',
  // Salem cluster
  salem: 'Salem',
  // Tiruchirappalli / Trichy
  tiruchirappalli: 'Tiruchirappalli',
  trichy: 'Tiruchirappalli',
  tiruchy: 'Tiruchirappalli',
  // Tirunelveli
  tirunelveli: 'Tirunelveli',
  nellai: 'Tirunelveli',
  // Erode
  erode: 'Erode',
  // Vellore
  vellore: 'Vellore',
  // Thanjavur
  thanjavur: 'Thanjavur',
  tanjore: 'Thanjavur',
  // Kanyakumari
  kanyakumari: 'Kanyakumari',
  'cape comorin': 'Kanyakumari',
  nagercoil: 'Kanyakumari',
  // Tiruppur
  tiruppur: 'Tiruppur',
  tirupur: 'Tiruppur',
  // Dindigul
  dindigul: 'Dindigul',
  // Kancheepuram
  kancheepuram: 'Kancheepuram',
  kanchipuram: 'Kancheepuram',
  // Cuddalore
  cuddalore: 'Cuddalore',
  // Nagapattinam
  nagapattinam: 'Nagapattinam',
  // Thoothukudi / Tuticorin
  thoothukudi: 'Thoothukudi',
  tuticorin: 'Thoothukudi',
}

export const DISTRICTS = Array.from(new Set(Object.values(DISTRICT_ALIASES))).sort();

/** Returns the canonical district name, or null if unrecognised. */
export function resolveDistrict(input: string): string | null {
  const trimmed = input.trim().toLowerCase()
  return DISTRICT_ALIASES[trimmed] ?? null
}

/** True when the input is a plausible 6-digit Indian pincode. */
export function isPincode(input: string): boolean {
  return /^\d{6}$/.test(input.trim())
}

// ─── Supabase row → Hospital mapper ───────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapRow(row: Record<string, any>): Hospital {
  const district = row.district ?? row.district_name ?? ''
  const location = row.location ?? row.city ?? (district ? `${district}, Tamil Nadu` : '')
  const type =
    row.type && String(row.type).trim() !== '' && String(row.type).trim().toLowerCase() !== 'null'
      ? String(row.type).trim()
      : 'Healthcare Facility'
  const address = row.address ?? row.full_address ?? (district ? `${district}, Tamil Nadu` : '')
  const phone = row.phone ?? row.contact_phone ?? ''

  let departments: string[] = []
  if (Array.isArray(row.departments)) {
    departments = row.departments.filter(Boolean).map(String)
  } else if (typeof row.departments === 'string' && row.departments.trim()) {
    try {
      const parsed = JSON.parse(row.departments)
      if (Array.isArray(parsed)) departments = parsed.filter(Boolean).map(String)
      else departments = row.departments.split(',').map((d: string) => d.trim()).filter(Boolean)
    } catch {
      departments = row.departments.split(',').map((d: string) => d.trim()).filter(Boolean)
    }
  }

  let doctors = Array.isArray(row.doctors) ? row.doctors : []
  if (!doctors.length && typeof row.doctors === 'string' && row.doctors.trim()) {
    try {
      const parsed = JSON.parse(row.doctors)
      if (Array.isArray(parsed)) doctors = parsed
    } catch {
      doctors = []
    }
  }

  const name = row.name ?? row.hospital_name ?? 'Unknown Hospital'
  const isErFacility = /emergency|trauma|critical\s*care|medical\s*college|general\s*hospital|super\s*speciality/i.test(`${name} ${type}`)
  const emergency = Boolean(row.emergency ?? row.has_emergency ?? isErFacility)

  return {
    id: String(row.id ?? row.hospital_id ?? `sb-${Math.random()}`),
    name: name,
    location: location,
    district: district,
    city: row.city ?? '',
    pincode: row.pincode ?? row.pin_code ?? '',
    distance: Number(row.distance ?? row.distance_km ?? 0),
    type: type,
    resource: {
      availableBeds: Number(row.available_beds ?? row.availableBeds ?? 0),
      icuBeds: Number(row.icu_beds ?? row.icuBeds ?? 0),
      doctorsAvailable: Number(row.doctors_available ?? row.doctorsAvailable ?? 0),
      waitingTime: Number(row.waiting_time ?? row.waitingTime ?? 30),
      oxygenBeds: Number(row.oxygen_beds ?? row.oxygenBeds ?? 0),
      ventilatorBeds: Number(row.ventilator_beds ?? row.ventilatorBeds ?? 0),
    },
    emergency: emergency,
    ambulance: Boolean(row.ambulance ?? row.has_ambulance ?? false),
    departments: departments,
    score: Number(row.score ?? row.match_score ?? 75),
    address: address,
    phone: phone,
    rating: Number(row.rating ?? 4.0),
    reviewsCount: Number(row.reviews_count ?? row.reviewsCount ?? 0),
    coordinates: {
      x: Number(
        row.coord_x ??
        row.latitude ??
        row.lat ??
        (row.coordinates && row.coordinates.x) ??
        0
      ),
      y: Number(
        row.coord_y ??
        row.longitude ??
        row.lng ??
        row.lon ??
        (row.coordinates && row.coordinates.y) ??
        0
      ),
    },
    insuranceAccepted: Array.isArray(row.insurance_accepted ?? row.insuranceAccepted)
      ? (row.insurance_accepted ?? row.insuranceAccepted)
      : [],
    doctors: doctors,
  }
}

// ─── Supabase Queries ─────────────────────────────────────────────────────────

/**
 * Fetch a single hospital record by its unique database ID from Supabase.
 * Returns the mapped Hospital object or null if not found.
 */
export async function fetchHospitalById(id: string): Promise<Hospital | null> {
  const trimmedId = id?.trim()
  if (!trimmedId) return null

  try {
    const { data, error } = await supabase
      .from('hospitals')
      .select('*')
      .eq('id', trimmedId)
      .maybeSingle()

    if (error) {
      console.warn('[hospital-search] fetchHospitalById Supabase error:', error.message)
      throw new Error(`Database error: ${error.message}`)
    }

    if (data) {
      return mapRow(data)
    }

    // Fallback: check static hospitals for demo IDs (e.g. 'ggh', 'apollo')
    const staticMatch = STATIC_HOSPITALS.find((h) => h.id === trimmedId)
    if (staticMatch) {
      return staticMatch
    }

    return null
  } catch (err) {
    console.warn('[hospital-search] fetchHospitalById error:', err)
    throw err
  }
}

async function fetchFromSupabase(
  districtOrPincode: string,
  isPincodeSearch: boolean
): Promise<Hospital[] | null> {
  try {
    const needle = districtOrPincode.trim()
    if (!needle) return []

    console.log(`[Hospital Search Trace] Fetching from Supabase for "${needle}" (isPincode: ${isPincodeSearch})`)

    if (isPincodeSearch) {
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .eq('pincode', needle)
        .limit(200)

      if (error) {
        console.warn('[Hospital Search Trace] Pincode query failed error:', error.message)
        return null
      }
      console.log(`[Hospital Search Trace] Total records returned from Supabase for pincode "${needle}": ${data?.length ?? 0}`)
      return (data || []).map(mapRow)
    }

    // 1. Direct district match (server-side, avoids 1000 row truncation)
    const { data: districtData, error: districtError } = await supabase
      .from('hospitals')
      .select('*')
      .ilike('district', `%${needle}%`)
      .limit(500)

    if (districtError) {
      console.warn('[Hospital Search Trace] District query failed error:', districtError.message)
      return null
    }

    if (districtData && districtData.length > 0) {
      console.log(`[Hospital Search Trace] Total records returned from Supabase for district "${needle}": ${districtData.length}`)
      return districtData.map(mapRow)
    }

    // 2. Fallback to city, address, location fields
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('hospitals')
      .select('*')
      .or(`city.ilike.%${needle}%,address.ilike.%${needle}%,location.ilike.%${needle}%`)
      .limit(500)

    if (fallbackError) {
      console.warn('[Hospital Search Trace] Fallback query failed error:', fallbackError.message)
      return null
    }

    console.log(`[Hospital Search Trace] Total records returned from Supabase fallback for "${needle}": ${fallbackData?.length ?? 0}`)
    return (fallbackData || []).map(mapRow)
  } catch (err) {
    console.warn('[Hospital Search Trace] Unexpected Supabase error:', err)
    return null
  }
}

// ─── Filter helpers ────────────────────────────────────────────────────────────

function applyFilters(list: Hospital[], req: PatientRequirement): Hospital[] {
  const spec = (req.specialty ?? '').trim().toLowerCase()
  const isAllSpecialties = !spec || spec === 'all' || spec === 'all specialties' || spec === 'other'

  return list.filter((h) => {
    let specialtyMatch = false
    if (isAllSpecialties) {
      specialtyMatch = true
    } else {
      // 1. Exact or case-insensitive department array match
      const inDepts = h.departments.some((d) => d.trim().toLowerCase() === spec)

      // 2. Specialty keyword matching on hospital name or facility type
      const nameAndType = `${h.name} ${h.type}`.toLowerCase()
      let keywordMatch = false
      if (spec.includes('cardio')) {
        keywordMatch = nameAndType.includes('cardio') || nameAndType.includes('heart')
      } else if (spec.includes('neuro')) {
        keywordMatch = nameAndType.includes('neuro')
      } else if (spec.includes('ortho')) {
        keywordMatch = nameAndType.includes('ortho')
      } else if (spec.includes('general')) {
        keywordMatch = nameAndType.includes('general') || nameAndType.includes('medicine') || nameAndType.includes('hospital')
      } else if (spec.includes('emergency')) {
        keywordMatch = h.emergency || /emergency|trauma|critical\s*care|medical\s*college|general\s*hospital|super\s*speciality/i.test(nameAndType)
      }
      specialtyMatch = inDepts || keywordMatch
    }

    const icuMatch = !req.icuRequired || h.resource.icuBeds > 0
    const emergencyMatch = !req.emergency || h.emergency
    const ambulanceMatch = !req.ambulanceRequired || h.ambulance
    return specialtyMatch && icuMatch && emergencyMatch && ambulanceMatch
  })
}

function filterStaticByLocation(location: string): Hospital[] {
  const loc = location.toLowerCase().trim()
  return STATIC_HOSPITALS.filter(
    (h) =>
      h.location.toLowerCase().includes(loc) ||
      h.address.toLowerCase().includes(loc) ||
      h.name.toLowerCase().includes(loc)
  )
}

// ─── Public API ────────────────────────────────────────────────────────────────

export type HospitalSearchResult = {
  hospitals: Hospital[]
  /** Canonical district label for display (e.g. "Coimbatore") */
  resolvedLocation: string
  /** Whether the result came from the live Supabase database */
  fromDatabase: boolean
  /** True when the location is recognised but has no hospital records */
  noDataForLocation: boolean
  /** True when the location string is unrecognised */
  unknownLocation: boolean
}

/**
 * Main entry point — async, Supabase-first.
 * Accepts any free-text location (district name, city name, pincode, area name).
 * Returns a ranked, filtered list of hospitals and metadata about the search.
 */
export async function searchHospitals(req: PatientRequirement): Promise<HospitalSearchResult> {
  const rawLocation = (req.location ?? '').trim()

  // ── 1. Empty input → fetch top hospitals from Supabase, fallback to static ──
  if (!rawLocation) {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .limit(100)

      if (!error && data && data.length > 0) {
        const dbList = data.map(mapRow)
        const filtered = applyFilters(dbList, req).sort((a, b) => b.score - a.score)
        return {
          hospitals: filtered,
          resolvedLocation: 'Tamil Nadu',
          fromDatabase: true,
          noDataForLocation: false,
          unknownLocation: false,
        }
      }
    } catch (err) {
      console.warn('[hospital-search] Empty location Supabase fallback:', err)
    }

    const filtered = applyFilters(STATIC_HOSPITALS, req).sort((a, b) => b.score - a.score)
    return {
      hospitals: filtered,
      resolvedLocation: 'Tamil Nadu',
      fromDatabase: false,
      noDataForLocation: false,
      unknownLocation: false,
    }
  }

  // ── 2. Pincode search ──────────────────────────────────────────────────────
  if (isPincode(rawLocation)) {
    const dbResults = await fetchFromSupabase(rawLocation, true)
    if (dbResults === null) {
      // DB unreachable
      const staticFiltered = applyFilters(filterStaticByLocation(rawLocation), req).sort(
        (a, b) => b.score - a.score
      )
      return {
        hospitals: staticFiltered,
        resolvedLocation: rawLocation,
        fromDatabase: false,
        noDataForLocation: staticFiltered.length === 0,
        unknownLocation: false,
      }
    }
    if (dbResults.length > 0) {
      const filtered = applyFilters(dbResults, req).sort((a, b) => b.score - a.score)
      return {
        hospitals: filtered,
        resolvedLocation: rawLocation,
        fromDatabase: true,
        noDataForLocation: false,
        unknownLocation: false,
      }
    }
    return {
      hospitals: [],
      resolvedLocation: rawLocation,
      fromDatabase: true,
      noDataForLocation: true,
      unknownLocation: false,
    }
  }

  // ── 3. District / city name search ────────────────────────────────────────
  const canonical = resolveDistrict(rawLocation)

  if (canonical) {
    const dbResults = await fetchFromSupabase(canonical, false)

    if (dbResults === null) {
      // DB unreachable — fall back to static
      const staticFiltered = applyFilters(filterStaticByLocation(canonical), req).sort(
        (a, b) => b.score - a.score
      )
      return {
        hospitals: staticFiltered,
        resolvedLocation: canonical,
        fromDatabase: false,
        noDataForLocation: staticFiltered.length === 0,
        unknownLocation: false,
      }
    }

    if (dbResults.length > 0) {
      const filtered = applyFilters(dbResults, req).sort((a, b) => b.score - a.score)
      console.log(
        `[Hospital Search Trace] District: "${canonical}" | Filter Specialty: "${req.specialty || 'None'}" | Salem/District DB records: ${dbResults.length} | Post-filter matches: ${filtered.length}`
      )
      if (req.specialty?.toLowerCase().includes('cardio')) {
        console.log(`[Hospital Search Trace] Cardiology matches for "${canonical}": ${filtered.length}`)
      }
      return {
        hospitals: filtered,
        resolvedLocation: canonical,
        fromDatabase: true,
        noDataForLocation: false,
        unknownLocation: false,
      }
    }

    // DB reachable but no rows — return empty result indicating no data for this location
    return {
      hospitals: [],
      resolvedLocation: canonical,
      fromDatabase: true,
      noDataForLocation: true,
      unknownLocation: false,
    }
  }

  // ── 4. Unrecognised location — try Supabase fuzzy search ────────────────
  // ── 4. Unrecognised location — try Supabase fuzzy search ────────────────
  const dbResults = await fetchFromSupabase(rawLocation, false)
  if (dbResults !== null) {
    if (dbResults.length > 0) {
      const filtered = applyFilters(dbResults, req).sort((a, b) => b.score - a.score)
      return {
        hospitals: filtered,
        resolvedLocation: rawLocation,
        fromDatabase: true,
        noDataForLocation: false,
        unknownLocation: false,
      }
    }
    // DB reachable but no rows — indicate no data for this location
    return {
      hospitals: [],
      resolvedLocation: rawLocation,
      fromDatabase: true,
      noDataForLocation: true,
      unknownLocation: false,
    }
  }
  // DB unreachable — treat as unknown location
  return {
    hospitals: [],
    resolvedLocation: rawLocation,
    fromDatabase: false,
    noDataForLocation: false,
    unknownLocation: true,
  }
}

/** Synchronous version for contexts where async isn't practical (e.g. emergency mode). */
export function searchHospitalsSync(req: PatientRequirement): Hospital[] {
  const rawLocation = (req.location ?? '').trim()

  const pool = rawLocation
    ? filterStaticByLocation(resolveDistrict(rawLocation) ?? rawLocation)
    : STATIC_HOSPITALS

  return applyFilters(pool, req).sort((a, b) => b.score - a.score)
}
