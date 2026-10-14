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
function mapRow(row: Record<string, any>): Hospital {
  return {
    id: String(row.id ?? row.hospital_id ?? `sb-${Math.random()}`),
    name: row.name ?? row.hospital_name ?? 'Unknown Hospital',
    location: row.location ?? row.area ?? row.district ?? '',
    distance: Number(row.distance ?? row.distance_km ?? 0),
    type: row.type ?? row.hospital_type ?? 'Hospital',
    resource: {
      availableBeds: Number(row.available_beds ?? row.availableBeds ?? 0),
      icuBeds: Number(row.icu_beds ?? row.icuBeds ?? 0),
      doctorsAvailable: Number(row.doctors_available ?? row.doctorsAvailable ?? 0),
      waitingTime: Number(row.waiting_time ?? row.waitingTime ?? 30),
      oxygenBeds: Number(row.oxygen_beds ?? row.oxygenBeds ?? 0),
      ventilatorBeds: Number(row.ventilator_beds ?? row.ventilatorBeds ?? 0),
    },
    emergency: Boolean(row.emergency ?? row.has_emergency ?? false),
    ambulance: Boolean(row.ambulance ?? row.has_ambulance ?? false),
    departments: Array.isArray(row.departments) ? row.departments : [],
    score: Number(row.score ?? row.match_score ?? 75),
    address: row.address ?? row.full_address ?? '',
    phone: row.phone ?? row.contact_phone ?? '',
    rating: Number(row.rating ?? 4.0),
    reviewsCount: Number(row.reviews_count ?? row.reviewsCount ?? 0),
    coordinates: {
      // Prefer explicit latitude/longitude columns, fallback to generic or combined coordinate objects
      x: Number(
        row.latitude ??
        row.lat ??
        row.coord_x ??
        (row.coordinates && row.coordinates.x) ??
        0
      ),
      y: Number(
        row.longitude ??
        row.lng ??
        row.lon ??
        row.coord_y ??
        (row.coordinates && row.coordinates.y) ??
        0
      ),
    },
    insuranceAccepted: Array.isArray(row.insurance_accepted ?? row.insuranceAccepted)
      ? (row.insurance_accepted ?? row.insuranceAccepted)
      : [],
    doctors: Array.isArray(row.doctors) ? row.doctors : [],
  }
}

// ─── Supabase query ────────────────────────────────────────────────────────────

async function fetchFromSupabase(
  districtOrPincode: string,
  isPincodeSearch: boolean
): Promise<Hospital[] | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase.from('hospitals').select('id, name, location, district, city, address, latitude, longitude, coord, available_beds, icu_beds, doctors_available, waiting_time, emergency, ambulance, departments, score, phone, rating, reviews_count')

    if (isPincodeSearch) {
      query = query.or(`pincode.eq.${districtOrPincode},pin_code.eq.${districtOrPincode}`)
    } else {
      query = query.or(
        [
          `district.ilike.%${districtOrPincode}%`,
          `location.ilike.%${districtOrPincode}%`,
          `city.ilike.%${districtOrPincode}%`,
          `address.ilike.%${districtOrPincode}%`,
        ].join(',')
      )
    }

    const { data, error } = await query.limit(50)

    if (error) {
      console.warn('[hospital-search] Supabase query failed:', error.message)
      return null
    }

    if (!data || data.length === 0) return []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as Record<string, any>[]).map(mapRow)
  } catch (err) {
    console.warn('[hospital-search] Unexpected Supabase error:', err)
    return null
  }
}

// ─── Filter helpers ────────────────────────────────────────────────────────────

function applyFilters(list: Hospital[], req: PatientRequirement): Hospital[] {
  return list.filter((h) => {
    const specialtyMatch =
      !req.specialty || req.specialty === 'Other' || h.departments.includes(req.specialty)
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

  // ── 1. Empty input → all static hospitals ────────────────────────────────
  if (!rawLocation) {
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
