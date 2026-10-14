'use client'

import React, { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Hospital } from '@/lib/hospital-data'
import {
  PatientLocation,
  PatientMapInnerProps,
  DEFAULT_PATIENT_LOCATION,
  HOSPITAL_GEO_COORDINATES,
  DISTRICT_CENTRE_COORDS,
} from './patient-map-types'

// Create custom SVG HTML marker icons to prevent Leaflet asset 404s
const createPatientIcon = () => {
  return L.divIcon({
    className: 'custom-patient-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 38px; height: 38px;">
        <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: rgba(13, 148, 136, 0.4); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; width: 32px; height: 32px; border-radius: 50%; background: #0f766e; border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: #ffffff;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="2" y1="12" x2="5" y2="12"></line>
            <line x1="19" y1="12" x2="22" y2="12"></line>
            <line x1="12" y1="2" x2="12" y2="5"></line>
            <line x1="12" y1="19" x2="12" y2="22"></line>
            <circle cx="12" cy="12" r="7"></circle>
            <circle cx="12" cy="12" r="2"></circle>
          </svg>
        </div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20],
  })
}

const createHospitalIcon = (availableBeds: number, isEmergency: boolean) => {
  const bg = isEmergency ? '#0284c7' : '#0f766e'
  return L.divIcon({
    className: 'custom-hospital-marker',
    html: `
      <div style="display: flex; align-items: center; background: #ffffff; border: 2px solid ${bg}; border-radius: 20px; padding: 2px 8px 2px 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.2); gap: 4px; font-family: inherit;">
        <div style="width: 20px; height: 20px; border-radius: 50%; background: ${bg}; display: flex; align-items: center; justify-content: center; color: white;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 6v12M6 12h12"/>
          </svg>
        </div>
        <span style="font-size: 11px; font-weight: 700; color: #1e293b;">${availableBeds}b</span>
      </div>
    `,
    iconSize: [60, 26],
    iconAnchor: [30, 13],
    popupAnchor: [0, -14],
  })
}

// Helper to center/update map position
function RecenterController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  return null
}

export default function PatientMapInner({
  patientLocation = DEFAULT_PATIENT_LOCATION,
  hospitals = [],
  height = '400px',
  className = '',
  zoom = 13,
  showHospitals = true,
  onSelectHospital,
  onBookHospital,
}: PatientMapInnerProps) {
  const centerPosition: [number, number] = [patientLocation.lat, patientLocation.lng]
  const patientIcon = createPatientIcon()

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-border bg-card shadow-xs ${className}`}
      style={{ height: typeof height === 'number' ? `${height}px` : height, minHeight: '300px' }}
    >
      <MapContainer
        center={centerPosition}
        zoom={zoom}
        scrollWheelZoom={true}
        dragging={true}
        className="h-full w-full z-0"
        style={{ height: '100%', width: '100%', background: '#e5e7eb' }}
      >
        <RecenterController center={centerPosition} zoom={zoom} />

        {/* Standard OpenStreetMap Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Patient Location Marker */}
        <Marker position={centerPosition} icon={patientIcon}>
          <Popup className="custom-patient-popup" minWidth={220}>
            <div className="p-1 text-slate-800 font-sans">
              <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200">
                <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <h4 className="font-bold text-xs uppercase tracking-wider text-teal-800">
                  {patientLocation.label || 'Patient Location'}
                </h4>
              </div>
              <p className="mt-1.5 text-xs text-slate-600 leading-snug">
                {patientLocation.description || 'Current active GPS coordinates for emergency dispatch'}
              </p>
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 bg-slate-100 p-1.5 rounded">
                <span>Lat: {patientLocation.lat.toFixed(4)}</span>
                <span>Lng: {patientLocation.lng.toFixed(4)}</span>
              </div>
              <div className="mt-2 text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded text-center">
                ✓ Live Healthcare Radar Active
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Surrounding Hospital Markers */}
        {showHospitals &&
          hospitals.map((hospital) => {
            const geo = HOSPITAL_GEO_COORDINATES[hospital.id] || (() => {
              // Try to find district centre from hospital.location (e.g. "RS Puram, Coimbatore")
              const locParts = (hospital.location ?? '').split(',')
              const districtGuess = locParts[locParts.length - 1]?.trim()
              if (districtGuess && DISTRICT_CENTRE_COORDS[districtGuess]) {
                // Add small jitter so multiple hospitals don't overlap exactly
                const jitter = (Math.random() - 0.5) * 0.02
                return {
                  lat: DISTRICT_CENTRE_COORDS[districtGuess].lat + jitter,
                  lng: DISTRICT_CENTRE_COORDS[districtGuess].lng + jitter,
                }
              }
              // Last resort: offset from patient position (existing behaviour)
              return {
                lat: patientLocation.lat + (hospital.coordinates.y - 50) * 0.003,
                lng: patientLocation.lng + (hospital.coordinates.x - 50) * 0.003,
              }
            })()
            const hospitalPosition: [number, number] = [geo.lat, geo.lng]
            const icon = createHospitalIcon(hospital.resource.availableBeds, hospital.emergency)

            return (
              <Marker
                key={hospital.id}
                position={hospitalPosition}
                icon={icon}
                eventHandlers={{
                  click: () => onSelectHospital?.(hospital),
                }}
              >
                <Popup className="custom-hospital-popup" minWidth={240}>
                  <div className="p-1 text-slate-800 font-sans">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                      <h4 className="font-bold text-xs text-slate-900 leading-tight">
                        {hospital.name}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{hospital.location} ({hospital.distance} km)</p>
                    
                    <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px] bg-slate-50 p-2 rounded border border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Available Beds</span>
                        <strong className="text-teal-700">{hospital.resource.availableBeds} general</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">ICU Ready</span>
                        <strong className="text-slate-700">{hospital.resource.icuBeds} ICU</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Est. Wait</span>
                        <strong className="text-slate-700">{hospital.resource.waitingTime} mins</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Doctors</span>
                        <strong className="text-slate-700">{hospital.resource.doctorsAvailable} active</strong>
                      </div>
                    </div>

                    <div className="mt-2.5 flex gap-1.5">
                      {onSelectHospital && (
                        <button
                          onClick={() => onSelectHospital(hospital)}
                          className="flex-1 rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                        >
                          Details
                        </button>
                      )}
                      {onBookHospital && (
                        <button
                          onClick={() => onBookHospital(hospital)}
                          className="flex-1 rounded bg-teal-700 px-2 py-1 text-[11px] font-semibold text-white hover:bg-teal-800 transition cursor-pointer"
                        >
                          Book Slot
                        </button>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}
      </MapContainer>
    </div>
  )
}
