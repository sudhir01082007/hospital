'use client'

import { useState } from 'react'
import {
  UserRound,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Heart,
  AlertTriangle,
  CreditCard,
  Edit3,
  X,
  CheckCircle2,
  FileText,
} from 'lucide-react'
import { UserProfile } from '@/lib/hospital-data'

interface ProfileViewProps {
  profile: UserProfile
  onUpdateProfile: (updated: UserProfile) => void
  onDownloadMedicalId: () => void
}

export function ProfileView({ profile, onUpdateProfile, onDownloadMedicalId }: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<UserProfile>(profile)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdateProfile(formData)
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      {/* Top Profile Summary */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-border bg-card p-6 sm:flex-row sm:items-center shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-2xl font-black text-primary-foreground shadow-sm">
            AK
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{profile.fullName}</h2>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                Verified Patient
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground flex flex-wrap items-center gap-3">
              <span>{profile.gender}, {profile.age} years</span>
              <span>·</span>
              <span className="font-semibold text-foreground">Blood: {profile.bloodGroup}</span>
              <span>·</span>
              <span>UHID: SW-984210</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => {
              setFormData(profile)
              setIsEditing(true)
            }}
            className="flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition"
          >
            <Edit3 className="size-3.5" /> Edit Information
          </button>
          <button
            onClick={onDownloadMedicalId}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition"
          >
            <FileText className="size-3.5" /> Digital Emergency Card
          </button>
        </div>
      </div>

      {/* Grid of Profile Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact & Location Details */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-foreground text-base border-b border-border pb-3">
            Contact & Residential Information
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-3">
              <Phone className="size-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-muted-foreground">Mobile Phone</span>
                <p className="font-bold text-foreground text-sm">{profile.phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="size-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-muted-foreground">Registered Email</span>
                <p className="font-bold text-foreground text-sm">{profile.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-muted-foreground">Residential Address</span>
                <p className="font-medium text-foreground leading-relaxed">{profile.address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-bold text-foreground text-base">Designated Emergency Contact</h3>
            <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600">
              Primary SOS Contact
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-muted-foreground">Contact Name & Relationship</span>
              <p className="font-bold text-foreground text-sm">{profile.emergencyContactName}</p>
            </div>

            <div>
              <span className="text-muted-foreground">Emergency Contact Phone</span>
              <p className="font-bold text-foreground text-sm">{profile.emergencyContactPhone}</p>
            </div>

            <div className="rounded-2xl border border-border bg-muted/40 p-3 text-[11px] text-muted-foreground leading-relaxed">
              This contact receives immediate SMS alerts containing your live GPS pin whenever an Emergency SOS or 108
              Ambulance is requested.
            </div>
          </div>
        </div>

        {/* Medical History & Allergies */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-foreground text-base border-b border-border pb-3">
            Clinical History & Allergies
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex items-center gap-1.5 text-destructive font-semibold mb-1.5">
                <AlertTriangle className="size-3.5" /> Known Allergies
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.allergies.map((all) => (
                  <span key={all} className="rounded-lg bg-destructive/10 px-2.5 py-1 text-xs font-bold text-destructive">
                    {all}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-foreground font-semibold mb-1.5">
                <Heart className="size-3.5 text-primary" /> Pre-existing Chronic Conditions
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.chronicConditions.map((cond) => (
                  <span key={cond} className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                    {cond}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Insurance Coverage */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-bold text-foreground text-base">Health Insurance Information</h3>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
              Verified
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-muted-foreground">Insurance Provider</span>
              <p className="font-bold text-foreground text-sm">{profile.insuranceProvider}</p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-muted-foreground">Policy Number</span>
                <p className="font-bold text-foreground font-mono">{profile.policyNumber}</p>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground">Validity</span>
                <p className="font-bold text-foreground">{profile.validTill}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-300/40 bg-emerald-50/50 p-3 text-[11px] text-emerald-800">
              Eligible for instant digital pre-authorization across Apollo, Fortis, GGH, Kauvery, and MIOT networks.
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-xs" role="presentation" onClick={() => setIsEditing(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 id="edit-profile-title" className="font-bold text-foreground text-lg">
                Edit Patient Profile
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-foreground">Full Name</label>
                <input
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                    className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground">Mobile Phone</label>
                <input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">Emergency Contact Name & Phone</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <input
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    placeholder="Contact Name"
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    placeholder="Phone number"
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground">Residential Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-input bg-background p-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 rounded-xl border border-border py-2.5 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
