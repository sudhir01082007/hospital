import { Hospital } from '@/lib/hospital-data'

export interface PatientLocation {
  lat: number
  lng: number
  label?: string
  description?: string
}

// Default temporary patient coordinates for testing (Chennai, Adyar corridor)
// Easily replaced with real patient coordinates from backend / geolocation API
export const DEFAULT_PATIENT_LOCATION: PatientLocation = {
  lat: 13.0067,
  lng: 80.2575,
  label: 'Patient Location',
  description: 'Adyar / Thiruvanmiyur Corridor, Chennai (Current GPS)',
}

// Real Chennai hospital coordinates mapping for static/mock hospitals
export const HOSPITAL_GEO_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // ── Static / demo hospital IDs ────────────────────────────────────────────
  ggh: { lat: 13.0827, lng: 80.2707 },
  apollo: { lat: 13.0604, lng: 80.2505 },
  fortis: { lat: 13.0064, lng: 80.2575 },
  mgm: { lat: 13.0725, lng: 80.2215 },
  kauvery: { lat: 13.0336, lng: 80.2541 },
  miot: { lat: 13.0189, lng: 80.1878 },
  sims: { lat: 13.0514, lng: 80.2128 },
  stanley: { lat: 13.1062, lng: 80.2872 },
  billroth: { lat: 13.0789, lng: 80.2312 },
  omandurar: { lat: 13.0685, lng: 80.2745 },
}

/**
 * District-centre fallback coordinates for Tamil Nadu.
 * Used when a Supabase-sourced hospital has an ID not in HOSPITAL_GEO_COORDINATES.
 */
export const DISTRICT_CENTRE_COORDS: Record<string, { lat: number; lng: number }> = {
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Coimbatore: { lat: 11.0168, lng: 76.9558 },
  Madurai: { lat: 9.9252, lng: 78.1198 },
  Salem: { lat: 11.6643, lng: 78.1460 },
  Tiruchirappalli: { lat: 10.7905, lng: 78.7047 },
  Tirunelveli: { lat: 8.7139, lng: 77.7567 },
  Erode: { lat: 11.3410, lng: 77.7172 },
  Vellore: { lat: 12.9165, lng: 79.1325 },
  Thanjavur: { lat: 10.7870, lng: 79.1378 },
  Kanyakumari: { lat: 8.0883, lng: 77.5385 },
  Tiruppur: { lat: 11.1085, lng: 77.3411 },
  Dindigul: { lat: 10.3624, lng: 77.9695 },
  Kancheepuram: { lat: 12.8185, lng: 79.6947 },
  Cuddalore: { lat: 11.7480, lng: 79.7714 },
  Nagapattinam: { lat: 10.7672, lng: 79.8449 },
  Thoothukudi: { lat: 8.7642, lng: 78.1348 },
}

export interface PatientMapProps {
  patientLocation?: PatientLocation
  hospitals?: Hospital[]
  height?: string | number
  className?: string
  zoom?: number
  showControls?: boolean
  showHospitals?: boolean
  title?: string
  description?: string
  onSelectHospital?: (hospital: Hospital) => void
  onBookHospital?: (hospital: Hospital) => void
}

export interface PatientMapInnerProps {
  patientLocation?: PatientLocation
  hospitals?: Hospital[]
  height?: string | number
  className?: string
  zoom?: number
  showHospitals?: boolean
  onSelectHospital?: (hospital: Hospital) => void
  onBookHospital?: (hospital: Hospital) => void
}
