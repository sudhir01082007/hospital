'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export type LocationPermission = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'

export interface PatientCoords {
  lat: number
  lng: number
  accuracy: number // metres
  timestamp: number
}

export interface UsePatientLocationReturn {
  coords: PatientCoords | null
  address: string | null
  permission: LocationPermission
  isLiveTracking: boolean
  error: string | null
  requestLocation: () => void
  startLiveTracking: () => void
  stopLiveTracking: () => void
}

/**
 * Custom hook that encapsulates the browser Geolocation API.
 *
 * - Does NOT request location until the patient explicitly calls requestLocation().
 * - Live tracking uses watchPosition() and is cleaned up on unmount.
 * - Reverse geocoding uses the free Nominatim API (OpenStreetMap).
 * - No background tracking after the browser tab closes.
 */
export function usePatientLocation(): UsePatientLocationReturn {
  const [coords, setCoords] = useState<PatientCoords | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [permission, setPermission] = useState<LocationPermission>('idle')
  const [isLiveTracking, setIsLiveTracking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const watchIdRef = useRef<number | null>(null)
  const geocodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ─── Reverse geocode helper ───────────────────────────────────────────────
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
      if (!res.ok) return
      const data = await res.json()
      const a = data.address || {}
      const parts = [
        a.road || a.pedestrian || a.path,
        a.neighbourhood || a.suburb || a.quarter,
        a.city || a.town || a.village || a.county,
        a.state,
      ].filter(Boolean)
      if (parts.length) setAddress(parts.join(', '))
    } catch {
      // Nominatim failure is non-critical; silently skip
    }
  }, [])

  // Debounce geocoding so we don't spam the API during live tracking
  const scheduleGeocode = useCallback(
    (lat: number, lng: number) => {
      if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current)
      geocodeTimeoutRef.current = setTimeout(() => reverseGeocode(lat, lng), 2000)
    },
    [reverseGeocode]
  )

  // ─── Success handler ──────────────────────────────────────────────────────
  const handlePosition = useCallback(
    (pos: GeolocationPosition) => {
      const next: PatientCoords = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp,
      }
      setCoords(next)
      setPermission('granted')
      setError(null)
      scheduleGeocode(next.lat, next.lng)
    },
    [scheduleGeocode]
  )

  // ─── Error handler ────────────────────────────────────────────────────────
  const handleError = useCallback((err: GeolocationPositionError) => {
    if (err.code === err.PERMISSION_DENIED) {
      setPermission('denied')
      setError(
        'Location permission denied. To enable, click the lock/info icon in your browser address bar → ' +
          'Site settings → Location → Allow, then reload the page.'
      )
    } else if (err.code === err.POSITION_UNAVAILABLE) {
      setError('Location unavailable. Your device could not determine its current position.')
    } else if (err.code === err.TIMEOUT) {
      setError('Location request timed out. Please try again.')
    } else {
      setError(`Location error: ${err.message}`)
    }
    setIsLiveTracking(false)
  }, [])

  // ─── Request single location fix ─────────────────────────────────────────
  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setPermission('unavailable')
      setError('Geolocation is not supported by your browser.')
      return
    }
    setPermission('requesting')
    setError(null)
    navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000,
    })
  }, [handlePosition, handleError])

  // ─── Start continuous live tracking ──────────────────────────────────────
  const startLiveTracking = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setPermission('unavailable')
      setError('Geolocation is not supported by your browser.')
      return
    }
    // Stop any existing watch before starting a new one
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
    }
    setPermission('requesting')
    setError(null)
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        handlePosition(pos)
        setIsLiveTracking(true)
      },
      (err) => {
        handleError(err)
        setIsLiveTracking(false)
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 }
    )
    watchIdRef.current = id
    setIsLiveTracking(true)
  }, [handlePosition, handleError])

  // ─── Stop live tracking ───────────────────────────────────────────────────
  const stopLiveTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsLiveTracking(false)
  }, [])

  // ─── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current)
      }
    }
  }, [])

  return {
    coords,
    address,
    permission,
    isLiveTracking,
    error,
    requestLocation,
    startLiveTracking,
    stopLiveTracking,
  }
}
