'use client'

import React, { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ─── Types ────────────────────────────────────────────────────────────────────

interface OverpassFacility {
  id: number
  lat: number
  lon: number
  tags: Record<string, string>
  distanceKm: number
}

interface NearbyMapInnerProps {
  patientLat: number
  patientLng: number
  isLive: boolean
  facilities: OverpassFacility[]
  selectedId: number | null
  onSelectFacility: (f: OverpassFacility) => void
  height?: number | string
}

// ─── Custom Icons ─────────────────────────────────────────────────────────────

function createPatientIcon(isLive: boolean) {
  const color = isLive ? '#059669' : '#0f766e'
  const ringColor = isLive ? 'rgba(5, 150, 105, 0.35)' : 'rgba(15, 118, 110, 0.3)'
  const animation = isLive
    ? 'animation: ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;'
    : ''

  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;display:flex;align-items:center;justify-content:center;width:40px;height:40px;">
        <div style="position:absolute;width:100%;height:100%;border-radius:50%;background:${ringColor};${animation}"></div>
        <div style="position:relative;width:32px;height:32px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 3px 12px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#fff;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/>
            <line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/>
            <line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22],
  })
}

function createFacilityIcon(isSelected: boolean) {
  const bg = isSelected ? '#0f766e' : '#0284c7'
  const border = isSelected ? '#fff' : '#e0f2fe'
  return L.divIcon({
    className: '',
    html: `
      <div style="display:flex;align-items:center;background:#fff;border:2px solid ${bg};border-radius:20px;padding:2px 8px 2px 4px;box-shadow:0 3px 8px rgba(0,0,0,0.2);gap:4px;font-family:inherit;">
        <div style="width:18px;height:18px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;color:#fff;">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 6v12M6 12h12"/>
          </svg>
        </div>
        <span style="font-size:10px;font-weight:700;color:#1e293b;">H</span>
      </div>
    `,
    iconSize: [46, 24],
    iconAnchor: [23, 12],
    popupAnchor: [0, -14],
  })
}

// ─── Map re-center when patient moves ─────────────────────────────────────────

function RecenterOnPatient({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  const prevRef = useRef<[number, number] | null>(null)

  useEffect(() => {
    const prev = prevRef.current
    if (!prev || Math.abs(prev[0] - lat) > 0.0001 || Math.abs(prev[1] - lng) > 0.0001) {
      map.setView([lat, lng], map.getZoom(), { animate: true })
      prevRef.current = [lat, lng]
    }
  }, [lat, lng, map])

  return null
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function NearbyMapInner({
  patientLat,
  patientLng,
  isLive,
  facilities,
  selectedId,
  onSelectFacility,
  height = 380,
}: NearbyMapInnerProps) {
  const patientIcon = createPatientIcon(isLive)
  const centerPos: [number, number] = [patientLat, patientLng]

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-border shadow-xs"
      style={{ height: typeof height === 'number' ? `${height}px` : height, minHeight: '280px' }}
    >
      <MapContainer
        center={centerPos}
        zoom={14}
        scrollWheelZoom
        dragging
        className="h-full w-full z-0"
        style={{ height: '100%', width: '100%' }}
      >
        <RecenterOnPatient lat={patientLat} lng={patientLng} />

        {/* OSM tile layer with required attribution */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Patient position marker */}
        <Marker position={centerPos} icon={patientIcon}>
          <Popup minWidth={200}>
            <div className="p-1 font-sans text-slate-800">
              <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1">
                <span className={`size-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-teal-600'}`} />
                <h4 className="text-xs font-bold uppercase tracking-wide text-teal-800">
                  {isLive ? 'Live Location' : 'Your Location'}
                </h4>
              </div>
              <p className="mt-1.5 text-[10px] font-mono text-slate-500">
                {patientLat.toFixed(5)}, {patientLng.toFixed(5)}
              </p>
              {isLive && (
                <p className="mt-1 text-[10px] text-emerald-700 font-semibold">
                  ● Updating in real time
                </p>
              )}
            </div>
          </Popup>
        </Marker>

        {/* Facility markers */}
        {facilities.map((f) => {
          const isSelected = f.id === selectedId
          const name = f.tags.name || 'Unnamed Facility'
          const phone = f.tags.phone || f.tags['contact:phone']
          const pos: [number, number] = [f.lat, f.lon]

          return (
            <Marker
              key={f.id}
              position={pos}
              icon={createFacilityIcon(isSelected)}
              eventHandlers={{ click: () => onSelectFacility(f) }}
            >
              <Popup minWidth={220}>
                <div className="p-1 font-sans text-slate-800">
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">{name}</h4>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    {f.distanceKm < 1
                      ? `${Math.round(f.distanceKm * 1000)} m away`
                      : `${f.distanceKm.toFixed(1)} km away`}
                  </p>
                  {phone && (
                    <a
                      href={`tel:${phone}`}
                      className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-teal-700 hover:underline"
                    >
                      📞 {phone}
                    </a>
                  )}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block rounded bg-teal-700 px-2 py-1 text-center text-[10px] font-bold text-white hover:bg-teal-800 transition"
                  >
                    Get Directions ↗
                  </a>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Live badge overlay */}
      {isLive && (
        <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm pointer-events-none">
          <span className="size-1.5 rounded-full bg-white animate-pulse" />
          LIVE
        </div>
      )}
    </div>
  )
}
