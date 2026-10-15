/**
 * symptom-interpreter.ts
 *
 * Preliminary clinical symptom-to-care requirement interpreter for SwasthyaConnect AI.
 *
 * IMPORTANT MEDICAL SAFETY PRINCIPLES:
 * 1. Preliminary routing suggestions only — NEVER definitive diagnoses.
 * 2. Does NOT replace evaluation by a qualified healthcare professional.
 * 3. Immediate warning for critical emergency symptoms (chest pain, dyspnea, stroke signs).
 * 4. Transparent, explainable rationale distinguishing inferred suggestions from verified facility departments.
 * 5. Does not log sensitive patient health text in unprotected logs.
 */

export interface SymptomInterpretation {
  /** The clean text analyzed */
  rawInput: string
  /** Matched clinical keywords or phrases */
  matchedKeywords: string[]
  /** Suggested department for hospital matching, or null if unclear */
  suggestedSpecialty: string | null
  /** Alias for suggestedSpecialty used in UI and search routing */
  inferredSpecialty: string | null
  /** Urgent emergency warning flag */
  isEmergency: boolean
  /** Warning description if emergency signs are present */
  emergencyWarning?: string
  /** Human-readable rationale for the patient */
  explanation: string
  /** Confidence category */
  confidence: 'high' | 'moderate' | 'unclear'
}

interface SpecialtyRule {
  specialty: string
  keywords: string[]
  explanationTemplate: (keywords: string[]) => string
}

// Emergency warning sign triggers that require immediate triage advice
const EMERGENCY_TRIGGERS: { pattern: RegExp; description: string }[] = [
  {
    pattern: /\b(chest\s*pain|heart\s*attack|crushing\s*chest|pressure\s*in\s*chest|angina)\b/i,
    description: 'Chest pain or pressure may indicate an acute cardiovascular emergency.',
  },
  {
    pattern: /\b(difficulty\s*breath|shortness\s*of\s*breath|breathless|gasping|can'?t\s*breathe|choking|severe\s*asthma)\b/i,
    description: 'Respiratory distress or difficulty breathing requires urgent clinical evaluation.',
  },
  {
    pattern: /\b(stroke|facial\s*droop|slurred\s*speech|sudden\s*numbness|sudden\s*weakness|paralysis)\b/i,
    description: 'Sudden weakness, facial drooping, or speech difficulty are potential stroke symptoms.',
  },
  {
    pattern: /\b(unconscious|fainting\s*spell|syncope|passed\s*out|unresponsive)\b/i,
    description: 'Loss of consciousness requires immediate medical assessment.',
  },
  {
    pattern: /\b(severe\s*bleeding|hemorrhage|uncontrolled\s*bleeding|major\s*trauma)\b/i,
    description: 'Severe hemorrhage or acute trauma requires immediate trauma department stabilization.',
  },
]

// Specialty routing keyword patterns
const SPECIALTY_RULES: SpecialtyRule[] = [
  {
    specialty: 'Orthopedics',
    keywords: [
      'knee pain',
      'joint pain',
      'knee',
      'joint',
      'shoulder pain',
      'back pain',
      'hip pain',
      'bone fracture',
      'fracture',
      'broken bone',
      'sprain',
      'ligament',
      'arthritis',
      'swollen joint',
      'ankle pain',
      'elbow pain',
      'tendon',
      'spine',
      'orthopedic',
    ],
    explanationTemplate: (kw) =>
      `Your notes mention ${kw.join(', ')}. This suggests a possible musculoskeletal or orthopedic concern. These hospitals list orthopedic care services.`,
  },
  {
    specialty: 'Cardiology',
    keywords: [
      'chest pain',
      'chest discomfort',
      'palpitation',
      'palpitations',
      'irregular heartbeat',
      'heart problem',
      'cardiac',
      'arrhythmia',
      'high blood pressure',
      'hypertension',
    ],
    explanationTemplate: (kw) =>
      `Your notes mention ${kw.join(', ')}. This suggests a cardiovascular checkup or cardiology consultation may be appropriate.`,
  },
  {
    specialty: 'Emergency Care',
    keywords: [
      'difficulty breathing',
      'breathlessness',
      'shortness of breath',
      'severe bleeding',
      'acute trauma',
      'stroke',
      'facial drooping',
      'unconscious',
      'fainted',
      'emergency',
    ],
    explanationTemplate: (kw) =>
      `Your notes describe urgent symptoms (${kw.join(', ')}). Prioritizing facilities with 24/7 emergency departments, trauma readiness, and ICU capacity.`,
  },
  {
    specialty: 'General Medicine',
    keywords: [
      'fever',
      'high temperature',
      'chills',
      'body ache',
      'body pain',
      'fatigue',
      'weakness',
      'flu',
      'cold',
      'viral',
      'infection',
      'stomach pain',
      'abdominal pain',
      'gastric',
      'acidity',
      'vomiting',
      'nausea',
      'diarrhea',
      'headache',
      'malaise',
      'cough',
      'throat pain',
    ],
    explanationTemplate: (kw) =>
      `Your notes mention ${kw.join(', ')}. General Medicine departments evaluate acute infections, fevers, and internal medicine concerns.`,
  },
  {
    specialty: 'Ophthalmology',
    keywords: [
      'eye pain',
      'vision problem',
      'blurred vision',
      'eye redness',
      'eye infection',
      'cataract',
      'double vision',
      'eye irritation',
      'loss of vision',
      'eye discharge',
    ],
    explanationTemplate: (kw) =>
      `Your notes mention ${kw.join(', ')}. An ophthalmology evaluation is recommended for eye health and vision symptoms.`,
  },
  {
    specialty: 'Dermatology',
    keywords: [
      'skin rash',
      'rash',
      'skin itching',
      'itching',
      'eczema',
      'hives',
      'skin lesion',
      'dermatitis',
      'psoriasis',
      'skin allergy',
      'acne',
      'boils',
    ],
    explanationTemplate: (kw) =>
      `Your notes mention ${kw.join(', ')}. A dermatology consultation is suggested for skin conditions and allergies.`,
  },
  {
    specialty: 'Neurology',
    keywords: [
      'migraine',
      'severe headache',
      'seizure',
      'seizures',
      'numbness',
      'tingling',
      'nerve pain',
      'dizziness',
      'vertigo',
      'tremor',
      'loss of balance',
    ],
    explanationTemplate: (kw) =>
      `Your notes mention ${kw.join(', ')}. A neurology consultation is recommended for neurological symptoms.`,
  },
]

/**
 * Analyze free-text symptoms or clinical notes.
 * Returns structured interpretation including emergency warnings, suggested specialty, and explanation.
 */
export function interpretSymptoms(input: string): SymptomInterpretation {
  const clean = (input || '').trim()
  if (!clean) {
    return {
      rawInput: '',
      matchedKeywords: [],
      suggestedSpecialty: null,
      inferredSpecialty: null,
      isEmergency: false,
      explanation: '',
      confidence: 'unclear',
    }
  }

  const lower = clean.toLowerCase()

  // 1. Check for emergency warning signs first
  let isEmergency = false
  const emergencyReasons: string[] = []

  for (const trigger of EMERGENCY_TRIGGERS) {
    if (trigger.pattern.test(lower)) {
      isEmergency = true
      emergencyReasons.push(trigger.description)
    }
  }

  // 2. Identify clinical keywords matching specialties
  const matches: { specialty: string; keyword: string; priority: number }[] = []

  for (const rule of SPECIALTY_RULES) {
    for (const kw of rule.keywords) {
      // Word boundary match or substring for multi-word phrases
      const regex = new RegExp(`(^|\\W)${kw.replace(/\s+/g, '\\s+')}(\\W|$)`, 'i')
      if (regex.test(lower)) {
        // Multi-word matches take higher precedence over single generic words
        const priority = kw.includes(' ') ? 2 : 1
        matches.push({ specialty: rule.specialty, keyword: kw, priority })
      }
    }
  }

  // 3. Resolve the most appropriate suggested specialty
  let suggestedSpecialty: string | null = null
  let matchedKws: string[] = []
  let explanation = ''
  let confidence: 'high' | 'moderate' | 'unclear' = 'unclear'

  if (isEmergency) {
    // If acute chest pain / respiratory, prioritize Emergency Care
    suggestedSpecialty = 'Emergency Care'
    matchedKws = matches.filter((m) => m.specialty === 'Emergency Care' || m.specialty === 'Cardiology').map((m) => m.keyword)
    if (!matchedKws.length && matches.length) {
      matchedKws = [matches[0].keyword]
    }
    explanation =
      'Possible emergency warning signs detected. Prioritizing emergency-ready hospitals with 24/7 trauma & ICU readiness.'
    confidence = 'high'
  } else if (matches.length > 0) {
    // Sort matches by multi-word priority first
    matches.sort((a, b) => b.priority - a.priority)
    const topMatch = matches[0]
    suggestedSpecialty = topMatch.specialty
    matchedKws = Array.from(new Set(matches.filter((m) => m.specialty === topMatch.specialty).map((m) => m.keyword)))
    const rule = SPECIALTY_RULES.find((r) => r.specialty === topMatch.specialty)
    explanation = rule ? rule.explanationTemplate(matchedKws) : `Your notes suggest a ${suggestedSpecialty} consultation.`
    confidence = topMatch.priority > 1 || matchedKws.length > 1 ? 'high' : 'moderate'
  } else {
    // Unrecognized text
    suggestedSpecialty = null
    explanation =
      'Your notes do not clearly indicate a specific specialty department. Please choose a specialty from the dropdown or consult General Medicine for an initial evaluation.'
    confidence = 'unclear'
  }

  return {
    rawInput: clean,
    matchedKeywords: matchedKws,
    suggestedSpecialty,
    inferredSpecialty: suggestedSpecialty,
    isEmergency,
    emergencyWarning: isEmergency
      ? emergencyReasons.join(' ') + ' Please dial 108 immediately or proceed to the nearest emergency department.'
      : undefined,
    explanation,
    confidence,
  }
}
