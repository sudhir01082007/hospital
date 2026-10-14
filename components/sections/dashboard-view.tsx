'use client'

import {
  BedDouble,
  Clock,
  Sparkles,
  Siren,
  Hospital as HospitalIcon,
  Calendar,
  Heart,
  ChevronRight,
  ShieldCheck,
  MapPin,
  ArrowUpRight,
  Activity,
  Phone,
  Check,
  Stethoscope,
  Navigation,
} from 'lucide-react'
import { Hospital, Appointment, UserProfile } from '@/lib/hospital-data'
import { PatientMap } from '@/components/patient-map'

interface DashboardViewProps {
  userProfile: UserProfile
  hospitals: Hospital[]
  appointments: Appointment[]
  savedHospitalIds: string[]
  patientCoords?: { lat: number; lng: number } | null
  onToggleSave: (hospitalId: string) => void
  onNavigateTab: (tabName: string) => void
  onViewDetails: (hospital: Hospital) => void
  onBookAppointment: (hospital: Hospital) => void
  onOpenMap: () => void
  onEmergencySOS: () => void
}

export function DashboardView({
  userProfile,
  hospitals,
  appointments,
  savedHospitalIds,
  patientCoords,
  onToggleSave,
  onNavigateTab,
  onViewDetails,
  onBookAppointment,
  onOpenMap,
  onEmergencySOS,
}: DashboardViewProps) {
  const topHospital = hospitals[0]
  const upcomingAppointment = appointments.find((a) => a.status === 'Confirmed' || a.status === 'Pending')
  const totalIcuBeds = hospitals.reduce((acc, h) => acc + h.resource.icuBeds, 0)
  const totalAvailableBeds = hospitals.reduce((acc, h) => acc + h.resource.availableBeds, 0)

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-linear-to-r from-card via-card to-primary/5 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <ShieldCheck className="size-3.5" /> Swasthya Patient Intelligence
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                Blood Group: <strong className="text-foreground">{userProfile.bloodGroup}</strong>
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                Cashless Insurance Active
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Good morning, {userProfile.fullName.split(' ')[0]} 👋
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Chennai healthcare resource radar is active. Live bed availability and emergency routes are monitored.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              onClick={onEmergencySOS}
              aria-label="Emergency"
              className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs font-bold text-destructive transition hover:bg-destructive hover:text-destructive-foreground shadow-xs cursor-pointer"
            >
              <Siren className="size-4 animate-pulse" /> Emergency 108 Dispatch
            </button>
            <button
              onClick={() => onNavigateTab('Find a Hospital')}
              aria-label="Find Hospital"
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition hover:bg-primary/90 shadow-sm cursor-pointer"
            >
              Find Hospital <ArrowUpRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Key Vital Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Nearest ER Trauma</span>
            <span className="rounded-lg bg-primary/10 p-1.5 text-primary">
              <MapPin className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-xl font-bold text-foreground sm:text-2xl">{topHospital?.distance ?? 2.4} km</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{topHospital?.name ?? 'GGH Park Town'}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Active OPD Bookings</span>
            <span className="rounded-lg bg-teal-500/10 p-1.5 text-teal-700">
              <Calendar className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-xl font-bold text-foreground sm:text-2xl">
            {appointments.filter((a) => a.status === 'Confirmed').length}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Next: {upcomingAppointment?.date ?? 'None'}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Live ICU Beds Ready</span>
            <span className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-700">
              <BedDouble className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-xl font-bold text-foreground sm:text-2xl">{totalIcuBeds} Beds</p>
          <p className="mt-1 text-xs text-muted-foreground">Across {hospitals.length} network centers</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Saved Facilities</span>
            <span className="rounded-lg bg-rose-500/10 p-1.5 text-rose-600">
              <Heart className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-xl font-bold text-foreground sm:text-2xl">{savedHospitalIds.length}</p>
          <button
            onClick={() => onNavigateTab('Saved Hospitals')}
            className="mt-1 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            View saved bookmarks
          </button>
        </div>
      </div>

      {/* Quick Interactive Actions */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold tracking-tight text-foreground">Quick Healthcare Workflows</h3>
          <span className="text-[11px] text-muted-foreground">1-click direct actions</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            onClick={onEmergencySOS}
            className="group flex flex-col items-start rounded-xl border border-border/80 bg-background p-3.5 text-left transition hover:border-destructive/40 hover:bg-destructive/5 hover:shadow-xs"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive group-hover:scale-110 transition-transform">
              <Siren className="size-4" />
            </div>
            <span className="mt-2 text-xs font-bold text-foreground">Emergency Ambulance</span>
            <span className="mt-0.5 text-[10px] text-muted-foreground">108 Dispatch with live GPS</span>
          </button>

          <button
            onClick={() => onNavigateTab('Appointment / Requests')}
            className="group flex flex-col items-start rounded-xl border border-border/80 bg-background p-3.5 text-left transition hover:border-primary/40 hover:bg-primary/5 hover:shadow-xs"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
              <Calendar className="size-4" />
            </div>
            <span className="mt-2 text-xs font-bold text-foreground">Book Consultation</span>
            <span className="mt-0.5 text-[10px] text-muted-foreground">Instant digital queue token</span>
          </button>

          <button
            onClick={() => onNavigateTab('Health Requirements')}
            className="group flex flex-col items-start rounded-xl border border-border/80 bg-background p-3.5 text-left transition hover:border-primary/40 hover:bg-primary/5 hover:shadow-xs"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-teal-500/10 text-teal-700 group-hover:scale-110 transition-transform">
              <Activity className="size-4" />
            </div>
            <span className="mt-2 text-xs font-bold text-foreground">AI Symptom Triage</span>
            <span className="mt-0.5 text-[10px] text-muted-foreground">Match symptoms to department</span>
          </button>

          <button
            onClick={onOpenMap}
            className="group flex flex-col items-start rounded-xl border border-border/80 bg-background p-3.5 text-left transition hover:border-primary/40 hover:bg-primary/5 hover:shadow-xs"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700 group-hover:scale-110 transition-transform">
              <MapPin className="size-4" />
            </div>
            <span className="mt-2 text-xs font-bold text-foreground">Live Hospital Map</span>
            <span className="mt-0.5 text-[10px] text-muted-foreground">Interactive radar across Chennai</span>
          </button>
        </div>
      </div>

      {/* Interactive OpenStreetMap Healthcare Radar */}
      <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MapPin className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-foreground text-base sm:text-lg">
                  Patient Location & Live Healthcare Radar
                </h3>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                  Live GPS
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Interactive OpenStreetMap tracking patient GPS, nearby facilities, and real-time bed capacities
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenMap}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/60 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer"
            >
              <Navigation className="size-3.5 text-primary" /> Full Screen Radar
            </button>
          </div>
        </div>

        <div className="mt-4">
          <PatientMap
            patientLocation={{
              lat: patientCoords?.lat ?? 13.0067,
              lng: patientCoords?.lng ?? 80.2575,
              label: 'Patient Location',
              description: `${userProfile.fullName} (${userProfile.address || 'Chennai, Tamil Nadu'})`,
            }}
            hospitals={hospitals}
            height={400}
            zoom={13}
            showControls={false}
            onSelectHospital={onViewDetails}
            onBookHospital={onBookAppointment}
          />
        </div>
      </div>

      {/* Main Grid: AI Spotlight & Upcoming Schedule */}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Left: Top AI Recommended Hospital & Bed Radar */}
        <div className="space-y-5">
          <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    AI Top Hospital Recommendation
                  </span>
                </div>
                <h3 className="mt-1 text-lg font-bold text-foreground">{topHospital?.name}</h3>
                <p className="text-xs text-muted-foreground">{topHospital?.address}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => topHospital && onToggleSave(topHospital.id)}
                  aria-label="Save to favorites"
                  className="rounded-xl border border-border p-2 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 transition"
                >
                  <Heart
                    className={`size-4 ${
                      topHospital && savedHospitalIds.includes(topHospital.id)
                        ? 'fill-rose-600 text-rose-600'
                        : ''
                    }`}
                  />
                </button>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  {topHospital?.score}% Match
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-muted/50 p-3">
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <BedDouble className="size-3" /> Available Beds
                </span>
                <p className="mt-1 text-base font-bold text-foreground">{topHospital?.resource.availableBeds}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <ShieldCheck className="size-3" /> ICU Ready
                </span>
                <p className="mt-1 text-base font-bold text-foreground">{topHospital?.resource.icuBeds} Beds</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="size-3" /> Avg Wait Time
                </span>
                <p className="mt-1 text-base font-bold text-foreground">{topHospital?.resource.waitingTime} min</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Stethoscope className="size-3" /> Active Doctors
                </span>
                <p className="mt-1 text-base font-bold text-foreground">{topHospital?.resource.doctorsAvailable}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                <Check className="size-3.5" /> 24/7 Emergency Trauma
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                <Check className="size-3.5" /> Direct Ambulance Fleet
              </span>
              <span className="inline-flex items-center gap-1 text-primary font-medium">
                <Check className="size-3.5" /> Cashless Approved
              </span>
            </div>

            <div className="mt-5 flex gap-3 pt-2 border-t border-border">
              <button
                onClick={() => topHospital && onViewDetails(topHospital)}
                className="flex-1 rounded-xl border border-border py-2.5 text-xs font-semibold text-foreground hover:bg-muted"
              >
                View Full Hospital Specs
              </button>
              <button
                onClick={() => topHospital && onBookAppointment(topHospital)}
                className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                Book Priority Token
              </button>
            </div>
          </div>

          {/* Live Hospital Bed Radar Table */}
          <div className="rounded-3xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h4 className="font-bold text-foreground text-sm">Live Hospital Resource Monitor</h4>
                <p className="text-xs text-muted-foreground">Real-time bed & ICU capacities in your zone</p>
              </div>
              <button
                onClick={() => onNavigateTab('Find a Hospital')}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                View all <ChevronRight className="size-3.5" />
              </button>
            </div>

            <div className="mt-3 divide-y divide-border overflow-x-auto">
              {hospitals.slice(0, 4).map((h) => (
                <div key={h.id} className="flex items-center justify-between py-3 gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{h.name}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <MapPin className="size-3" /> {h.location} · {h.distance} km
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-[11px] text-muted-foreground">Beds / ICU</span>
                      <p className="text-xs font-bold text-foreground">
                        {h.resource.availableBeds} / {h.resource.icuBeds}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-muted-foreground">Wait</span>
                      <p className="text-xs font-bold text-foreground">{h.resource.waitingTime}m</p>
                    </div>

                    <button
                      onClick={() => onBookAppointment(h)}
                      className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition"
                    >
                      Book
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Next Appointment & Emergency Quick Dial */}
        <div className="space-y-5">
          {/* Upcoming Appointment Card */}
          <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-primary" />
                <h4 className="text-sm font-bold text-foreground">Upcoming Appointment</h4>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                {upcomingAppointment?.status ?? 'Active'}
              </span>
            </div>

            {upcomingAppointment ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary">Token #{upcomingAppointment.tokenNumber}</span>
                    <span className="text-[11px] text-muted-foreground">{upcomingAppointment.type}</span>
                  </div>
                  <h5 className="mt-2 font-bold text-foreground text-sm">{upcomingAppointment.doctorName}</h5>
                  <p className="text-xs text-muted-foreground">{upcomingAppointment.department}</p>
                  <p className="mt-2 text-xs font-medium text-foreground">{upcomingAppointment.hospitalName}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-primary/15 pt-2">
                    <span className="flex items-center gap-1 font-semibold text-foreground">
                      <Clock className="size-3.5 text-primary" /> {upcomingAppointment.date}
                    </span>
                    <span>Slot: {upcomingAppointment.time}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onNavigateTab('Appointment / Requests')}
                    className="flex-1 rounded-xl border border-border py-2 text-xs font-semibold text-foreground hover:bg-muted"
                  >
                    Manage Schedule
                  </button>
                  <button
                    onClick={() => onNavigateTab('Appointment / Requests')}
                    className="flex-1 rounded-xl bg-primary py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    View Ticket Pass
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <Calendar className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-2 text-xs font-semibold text-foreground">No Upcoming Appointments</p>
                <button
                  onClick={() => onNavigateTab('Appointment / Requests')}
                  className="mt-3 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                >
                  Book New Slot
                </button>
              </div>
            )}
          </div>

          {/* Emergency Ambulance SOS Panel */}
          <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-5 sm:p-6 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive text-destructive-foreground">
                <Siren className="size-5" />
              </div>
              <div>
                <h4 className="font-bold text-destructive text-sm">Need Rapid Emergency Care?</h4>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Direct dispatch to Chennai Emergency Services. Trauma ICU readiness pre-alerts automatically.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={onEmergencySOS}
                className="flex items-center justify-center gap-2 rounded-xl bg-destructive py-3 text-xs font-bold text-destructive-foreground shadow-sm hover:bg-destructive/90 transition"
              >
                <Phone className="size-3.5" /> Call 108 Emergency Ambulance
              </button>
              <button
                onClick={() => onNavigateTab('Emergency Support')}
                className="flex items-center justify-center gap-1 text-xs font-semibold text-destructive hover:underline py-1"
              >
                Open Emergency Response Center <ChevronRight className="size-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
