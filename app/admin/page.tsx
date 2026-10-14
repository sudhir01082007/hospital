'use client'

import { useState, useEffect } from 'react'
import { Search, Edit, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { mapRow } from '@/lib/hospital-search'
import { type Hospital } from '@/lib/hospital-data'

export default function AdminDashboard() {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [filtered, setFiltered] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Load hospitals from Supabase
  useEffect(() => {
    async function loadData() {
      try {
        const { data, error } = await supabase
          .from('hospitals')
          .select('*')
          .limit(200)

        if (!error && data) {
          const mapped = data.map(mapRow)
          setHospitals(mapped)
          setFiltered(mapped)
        }
      } catch (err) {
        console.warn('Failed to load admin hospital data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Simple client-side filter (by name, district, or type)
  useEffect(() => {
    const term = searchTerm.toLowerCase().trim()
    if (!term) {
      setFiltered(hospitals)
      return
    }
    const result = hospitals.filter((h) => {
      const matchesName = h.name?.toLowerCase().includes(term)
      const matchesDistrict = (h.district || h.address || '')?.toLowerCase().includes(term)
      const matchesType = h.type?.toLowerCase().includes(term)
      return matchesName || matchesDistrict || matchesType
    })
    setFiltered(result)
  }, [searchTerm, hospitals])

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">🏥 Hospital Admin Dashboard</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -mt-2.5 size-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, district, specialty…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-xl border border-border bg-card pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin size-8 text-primary" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full table-auto min-w-[800px]">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Name</th>
                <th className="px-4 py-2 text-left font-medium">District</th>
                <th className="px-4 py-2 text-left font-medium">Specialty</th>
                <th className="px-4 py-2 text-left font-medium">Beds / ICU</th>
                <th className="px-4 py-2 text-left font-medium">Coordinates</th>
                <th className="px-4 py-2 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((h) => (
                <tr key={h.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-2">{h.name}</td>
                  <td className="px-4 py-2">{h.type ?? '—'}</td>
                  <td className="px-4 py-2">
                    {h.resource?.availableBeds ?? '—'} / {h.resource?.icuBeds ?? '—'}
                  </td>
                  <td className="px-4 py-2 text-sm text-muted-foreground">
                    {h.coordinates?.x && h.coordinates?.y
                      ? `${h.coordinates.x.toFixed(4)}, ${h.coordinates.y.toFixed(4)}`
                      : '—'}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                    >
                      <Edit className="size-3" /> Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-muted-foreground">
                    No hospitals match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
