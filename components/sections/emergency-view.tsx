'use client'

import { useState } from 'react'
import {
  Siren,
  Phone,
  Ambulance,
  MapPin,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Navigation,
  UserCheck,
  HeartPulse,
  Radio,
  Share2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Hospital, UserProfile } from '@/lib/hospital-data'

interface EmergencyViewProps {
  hospitals: Hospital[]
  userProfile: UserProfile
  onViewDetails: (hospital: Hospital) => void
}

export function EmergencyView({ hospitals, userProfile, onViewDetails }: EmergencyViewProps) {
  const [dispatchStatus, setDispatchStatus] = useState<'idle' | 'calling' | 'dispatched'>('idle')
  const [sosSent, setSosSent] = useState(false)
  const [activeGuide, setActiveGuide] = useState<string | null>('cpr')

  const emergencyHospitals = hospitals
    .filter((h) => h.emergency)
    .sort((a, b) => a.distance - b.distance)

  const handleDispatchAmbulance = () => {
    setDispatchStatus('calling')
    setTimeout(() => {
      setDispatchStatus('dispatched')
    }, 1800)
  }

  const handleSendSosAlert = () => {
    setSosSent(true)
  }

  return (
    <div className="space-y-6">
      {/* Red Alert Emergency SOS Banner */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-destructive/40 bg-linear-to-r from-destructive via-destructive/95 to-destructive/90 p-6 sm:p-8 text-destructive-foreground shadow-xl">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex size-3 rounded-full bg-card animate-ping" />
              <span className="rounded-full bg-card/20 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-card">
                Tamil Nadu Emergency Trauma Grid
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Emergency Response & Ambulance Dispatch
            </h2>
            <p className="max-w-xl text-xs sm:text-sm text-destructive-foreground/90 leading-relaxed">
              Initiate immediate 108 ambulance dispatch with live GPS corridor clearance and automated trauma hospital
              pre-alerts.
            </p>
          </div>

          {/* Big Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            {dispatchStatus === 'idle' && (
              <button
                onClick={handleDispatchAmbulance}
                className="flex items-center justify-center gap-2.5 rounded-2xl bg-card px-6 py-4 text-sm font-extrabold text-destructive shadow-xl hover:bg-card/90 transition transform active:scale-95"
              >
                <Ambulance className="size-5 animate-bounce" />
                Dispatch 108 Ambulance Now
              </button>
            )}

            <button
              onClick={handleSendSosAlert}
              className={`flex items-center justify-center gap-2 rounded-2xl border px-5 py-4 text-xs sm:text-sm font-bold transition shadow-md ${
                sosSent
                  ? 'border-emerald-300 bg-emerald-700 text-white'
                  : 'border-destructive-foreground/40 bg-destructive-foreground/15 text-destructive-foreground hover:bg-destructive-foreground/25'
              }`}
            >
              {sosSent ? (
                <>
                  <CheckCircle2 className="size-4" /> SOS Alert Sent to {userProfile.emergencyRelation}
                </>
              ) : (
                <>
                  <Radio className="size-4 animate-pulse" /> Send Family SOS with GPS
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Ambulance Dispatch Simulation Widget */}
        {dispatchStatus === 'calling' && (
          <div className="mt-6 rounded-2xl border border-destructive-foreground/30 bg-destructive-foreground/15 p-4 text-center">
            <div className="flex items-center justify-center gap-3">
              <span className="size-4 rounded-full bg-card animate-ping" />
              <p className="text-sm font-bold text-card">Connecting to 108 Central Chennai Emergency Control...</p>
            </div>
          </div>
        )}

        {dispatchStatus === 'dispatched' && (
          <div className="mt-6 rounded-2xl border border-emerald-300/40 bg-emerald-950/80 p-5 text-card shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-emerald-500/30 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500 text-white">
                  <Ambulance className="size-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Ambulance Dispatched! Vehicle: TN-01-EM-4091</h4>
                  <p className="text-xs text-emerald-200">
                    Advanced Life Support (ALS) Unit en route to your Thiruvanmiyur location.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-xl bg-emerald-500/20 px-3 py-1 text-sm font-bold text-emerald-300">
                  ETA: 6 Minutes
                </span>
                <button
                  onClick={() => setDispatchStatus('idle')}
                  className="rounded-xl bg-card/20 px-3 py-1 text-xs text-card hover:bg-card/30"
                >
                  Dismiss
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
              <div className="rounded-xl bg-emerald-900/40 p-2.5">
                <span className="text-emerald-300 font-medium">Driver / Paramedic:</span>
                <p className="font-bold text-white mt-0.5">Muthu K. (Certified EMT)</p>
              </div>
              <div className="rounded-xl bg-emerald-900/40 p-2.5">
                <span className="text-emerald-300 font-medium">Direct Hotline:</span>
                <p className="font-bold text-white mt-0.5">+91 94441 12345</p>
              </div>
              <div className="rounded-xl bg-emerald-900/40 p-2.5">
                <span className="text-emerald-300 font-medium">Destination Hospital:</span>
                <p className="font-bold text-white mt-0.5">GGH Park Town Trauma Center</p>
              </div>
              <div className="rounded-xl bg-emerald-900/40 p-2.5">
                <span className="text-emerald-300 font-medium">ER Bed Status:</span>
                <p className="font-bold text-emerald-200 mt-0.5">Pre-alerted & Reserved</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Emergency Helpline Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <a
          href="tel:108"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs hover:border-destructive/40 transition"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive font-bold">
            <Phone className="size-5" />
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground font-semibold">Ambulance</span>
            <p className="text-base font-bold text-foreground">108</p>
          </div>
        </a>

        <a
          href="tel:102"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs hover:border-primary/40 transition"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
            <Phone className="size-5" />
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground font-semibold">Maternity & Child</span>
            <p className="text-base font-bold text-foreground">102</p>
          </div>
        </a>

        <a
          href="tel:104"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs hover:border-teal-500/40 transition"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-700 font-bold">
            <Phone className="size-5" />
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground font-semibold">Medical Advice</span>
            <p className="text-base font-bold text-foreground">104</p>
          </div>
        </a>

        <a
          href={`tel:${userProfile.emergencyContactPhone}`}
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs hover:border-rose-500/40 transition"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 font-bold">
            <UserCheck className="size-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-muted-foreground font-semibold">Emergency Contact</span>
            <p className="text-xs font-bold text-foreground truncate">{userProfile.emergencyContactName}</p>
          </div>
        </a>
      </div>

      {/* Grid: Nearest ER Facilities & First Aid Protocol */}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Left: 24/7 Verified Emergency Trauma Centers */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground">Nearest 24/7 Trauma Centers</h3>
              <p className="text-xs text-muted-foreground">Ranked strictly by fastest emergency transit</p>
            </div>
            <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-bold text-destructive">
              {emergencyHospitals.length} Ready
            </span>
          </div>

          <div className="space-y-3">
            {emergencyHospitals.map((hospital) => (
              <div
                key={hospital.id}
                className="rounded-2xl border border-border bg-card p-5 shadow-xs transition hover:border-destructive/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
                      <Siren className="size-3" /> Level 1 Trauma Facility
                    </span>
                    <h4 className="mt-1.5 font-bold text-foreground text-base">{hospital.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{hospital.address}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-foreground">{hospital.distance} km</span>
                    <p className="text-[10px] text-muted-foreground font-semibold">~{hospital.resource.waitingTime}m wait</p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 border-y border-border py-2.5 text-xs">
                  <div>
                    <span className="text-muted-foreground text-[10px]">ICU Capacity</span>
                    <p className="font-bold text-foreground">{hospital.resource.icuBeds} Beds Ready</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px]">Ventilators</span>
                    <p className="font-bold text-foreground">{hospital.resource.ventilatorBeds} Units</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px]">ER Doctors</span>
                    <p className="font-bold text-foreground">{hospital.resource.doctorsAvailable} On Duty</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2.5">
                  <a
                    href={`tel:${hospital.phone}`}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-destructive py-2 text-xs font-bold text-destructive-foreground hover:bg-destructive/90 transition shadow-xs"
                  >
                    <Phone className="size-3.5" /> Call ER Desk ({hospital.phone})
                  </a>
                  <button
                    onClick={() => onViewDetails(hospital)}
                    className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                  >
                    Specs
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right: Emergency First Aid Guidelines */}
        <section className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <HeartPulse className="size-5 text-destructive" />
            <h3 className="font-bold text-foreground text-base">Critical First-Aid Action Guides</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Standard medical protocols to follow while ambulance is en route.
          </p>

          <div className="space-y-2.5">
            {/* Guide 1: CPR */}
            <div className="rounded-2xl border border-border bg-muted/40 p-3.5">
              <button
                onClick={() => setActiveGuide(activeGuide === 'cpr' ? null : 'cpr')}
                className="flex w-full items-center justify-between font-bold text-foreground text-xs"
              >
                <span>Cardiopulmonary Resuscitation (Hands-Only CPR)</span>
                {activeGuide === 'cpr' ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </button>
              {activeGuide === 'cpr' && (
                <div className="mt-3 text-xs text-muted-foreground space-y-1.5 border-t border-border pt-2 leading-relaxed">
                  <p>1. Check for responsiveness and pulse.</p>
                  <p>2. Place heel of hand on center of chest, interlock fingers.</p>
                  <p>3. Push hard and fast (100–120 beats per minute) to depth of 2 inches.</p>
                  <p>4. Continue without pause until paramedics arrive.</p>
                </div>
              )}
            </div>

            {/* Guide 2: Severe Bleeding */}
            <div className="rounded-2xl border border-border bg-muted/40 p-3.5">
              <button
                onClick={() => setActiveGuide(activeGuide === 'bleeding' ? null : 'bleeding')}
                className="flex w-full items-center justify-between font-bold text-foreground text-xs"
              >
                <span>Severe Hemorrhage / Arterial Bleeding</span>
                {activeGuide === 'bleeding' ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </button>
              {activeGuide === 'bleeding' && (
                <div className="mt-3 text-xs text-muted-foreground space-y-1.5 border-t border-border pt-2 leading-relaxed">
                  <p>1. Apply firm, continuous direct pressure with sterile gauze or clean cloth.</p>
                  <p>2. Elevate the injured limb above heart level if no fracture is suspected.</p>
                  <p>3. Do NOT remove soaked bandages; layer additional pads on top.</p>
                </div>
              )}
            </div>

            {/* Guide 3: Stroke FAST */}
            <div className="rounded-2xl border border-border bg-muted/40 p-3.5">
              <button
                onClick={() => setActiveGuide(activeGuide === 'stroke' ? null : 'stroke')}
                className="flex w-full items-center justify-between font-bold text-foreground text-xs"
              >
                <span>Stroke Recognition: F.A.S.T. Assessment</span>
                {activeGuide === 'stroke' ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </button>
              {activeGuide === 'stroke' && (
                <div className="mt-3 text-xs text-muted-foreground space-y-1.5 border-t border-border pt-2 leading-relaxed">
                  <p><strong>F - Face:</strong> Ask to smile. Does one side droop?</p>
                  <p><strong>A - Arms:</strong> Ask to raise both arms. Does one drift downward?</p>
                  <p><strong>S - Speech:</strong> Ask to repeat a simple phrase. Is speech slurred?</p>
                  <p><strong>T - Time:</strong> Call 108 immediately. Note exact time of onset.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
