'use client'

import { useState } from 'react'
import {
  ClipboardList,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Stethoscope,
  ArrowRight,
  HelpCircle,
  Siren,
  HeartPulse,
} from 'lucide-react'
import { symptomOptions, evaluateTriage } from '@/lib/hospital-data'

interface HealthRequirementsViewProps {
  onApplyTriageToSearch: (department: string, requiresICU: boolean, requiresAmbulance: boolean) => void
}

export function HealthRequirementsView({ onApplyTriageToSearch }: HealthRequirementsViewProps) {
  const [selectedSymptomIds, setSelectedSymptomIds] = useState<string[]>([symptomOptions[0].id])
  const [severity, setSeverity] = useState<string>('Moderate')
  const [duration, setDuration] = useState<string>('Past few hours')
  const [notes, setNotes] = useState<string>('')
  const [assessmentResult, setAssessmentResult] = useState<ReturnType<typeof evaluateTriage> | null>(null)

  const toggleSymptom = (id: string) => {
    setSelectedSymptomIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleAssess = (e: React.FormEvent) => {
    e.preventDefault()
    const result = evaluateTriage(selectedSymptomIds, severity, duration)
    setAssessmentResult(result)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            AI Symptom Triage & Healthcare Intake
          </span>
        </div>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
          Clinical Health Requirements Assessment
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Identify optimal specialty departments, determine clinical urgency, and match ready hospital capacities.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Form Panel */}
        <form onSubmit={handleAssess} className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-5">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-foreground">
              Step 1: Select Presenting Symptoms (Check all that apply)
            </label>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {symptomOptions.map((sym) => {
                const checked = selectedSymptomIds.includes(sym.id)
                return (
                  <button
                    type="button"
                    key={sym.id}
                    onClick={() => toggleSymptom(sym.id)}
                    className={`flex items-start gap-2.5 rounded-2xl border p-3 text-left transition ${
                      checked
                        ? 'border-primary bg-primary/10 text-foreground font-semibold shadow-xs'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-md border ${
                        checked ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-card'
                      }`}
                    >
                      {checked && <CheckCircle2 className="size-3.5" />}
                    </div>
                    <div>
                      <p className="text-xs text-foreground font-medium leading-tight">{sym.label}</p>
                      <span className="mt-1 inline-block rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                        {sym.category}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Severity & Duration */}
          <div className="grid gap-4 sm:grid-cols-2 border-t border-border pt-4">
            <div>
              <label className="text-xs font-bold text-foreground">Step 2: Severity Assessment</label>
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {(['Mild', 'Moderate', 'Severe', 'Critical'] as const).map((lvl) => (
                  <button
                    type="button"
                    key={lvl}
                    onClick={() => setSeverity(lvl)}
                    className={`rounded-xl border py-2 text-center text-xs font-semibold transition ${
                      severity === lvl
                        ? lvl === 'Critical'
                          ? 'border-destructive bg-destructive text-destructive-foreground font-bold shadow-xs'
                          : 'border-primary bg-primary text-primary-foreground font-bold shadow-xs'
                        : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground">Step 3: Onset Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="mt-2 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                <option>Past 30 minutes (Acute Sudden)</option>
                <option>Past few hours</option>
                <option>1 to 2 days</option>
                <option>Persistent (&gt; 1 week)</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-foreground">Additional Medical Context or Observations</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. History of high BP, taking blood thinners, allergic to penicillin..."
              rows={2}
              className="mt-1.5 w-full rounded-xl border border-input bg-background p-3 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs sm:text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition"
          >
            <Sparkles className="size-4" /> Run AI Clinical Assessment
          </button>
        </form>

        {/* AI Result Card */}
        <div className="space-y-4">
          {assessmentResult ? (
            <div className="rounded-3xl border border-border bg-card p-6 shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-2">
                <HeartPulse className="size-5 text-primary" />
                <h3 className="font-bold text-foreground text-base">Triage Recommendation</h3>
              </div>

              <div className={`mt-4 rounded-2xl border p-4 ${assessmentResult.color}`}>
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${assessmentResult.badgeColor}`}>
                  {assessmentResult.level}
                </span>
                <p className="mt-2 text-xs leading-relaxed font-semibold">{assessmentResult.urgency}</p>
              </div>

              <div className="mt-5 space-y-3 text-xs divide-y divide-border">
                <div className="flex items-center justify-between pt-2">
                  <span className="text-muted-foreground">Target Department:</span>
                  <strong className="text-foreground font-bold">{assessmentResult.recommendedDepartment}</strong>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-muted-foreground">ICU Readiness Advised:</span>
                  <strong className={assessmentResult.requiresICU ? 'text-destructive font-bold' : 'text-foreground font-semibold'}>
                    {assessmentResult.requiresICU ? 'Yes (Reserved Bed Needed)' : 'Not immediate'}
                  </strong>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-muted-foreground">Transit Mode:</span>
                  <strong className={assessmentResult.requiresAmbulance ? 'text-destructive font-bold' : 'text-foreground font-semibold'}>
                    {assessmentResult.requiresAmbulance ? '108 Ambulance Dispatch Recommended' : 'Direct Hospital OPD / Walk-in'}
                  </strong>
                </div>
              </div>

              <button
                onClick={() =>
                  onApplyTriageToSearch(
                    assessmentResult.recommendedDepartment,
                    assessmentResult.requiresICU,
                    assessmentResult.requiresAmbulance
                  )
                }
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition"
              >
                Match Hospitals for this Assessment <ArrowRight className="size-3.5" />
              </button>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border p-8 text-center">
              <Sparkles className="mx-auto size-8 text-primary" />
              <h4 className="mt-3 font-bold text-foreground text-sm">Awaiting Assessment</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Select your current symptoms and click &apos;Run AI Clinical Assessment&apos; to view triage recommendations.
              </p>
            </div>
          )}

          {/* Emergency Safety Notice */}
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-xs">
            <div className="flex items-start gap-2 text-destructive font-bold">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <span>Emergency Disclaimer</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
              If the patient is experiencing active loss of consciousness, choking, uncontrolled bleeding, or severe chest pain, bypass the form and dial <strong>108</strong> immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
