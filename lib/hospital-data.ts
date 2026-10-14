export type HospitalResource = {
  availableBeds: number
  icuBeds: number
  doctorsAvailable: number
  waitingTime: number
  oxygenBeds: number
  ventilatorBeds: number
}

export type Doctor = {
  name: string
  role: string
  experience: string
  fee: string
}

export type Hospital = {
  id: string
  name: string
  location: string
  distance: number
  type: string
  district?: string
  city?: string
  pincode?: string
  resource: HospitalResource
  emergency: boolean
  ambulance: boolean
  departments: string[]
  score: number
  address: string
  phone: string
  rating: number
  reviewsCount: number
  coordinates: { x: number; y: number }
  insuranceAccepted: string[]
  doctors: Doctor[]
}

export type PatientRequirement = {
  location: string
  specialty: string
  icuRequired: boolean
  emergency: boolean
  ambulanceRequired: boolean
  notes: string
}

export type Appointment = {
  id: string
  hospitalId: string
  hospitalName: string
  department: string
  doctorName: string
  date: string
  time: string
  status: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled'
  type: 'In-person OPD' | 'Emergency Admission' | 'Video Consultation'
  tokenNumber: string
  patientNotes?: string
}

export type NotificationItem = {
  id: string
  title: string
  message: string
  time: string
  unread: boolean
  type: 'urgent' | 'appointment' | 'system' | 'info'
  targetSection?: string
}

export type UserProfile = {
  fullName: string
  age: number
  gender: string
  bloodGroup: string
  phone: string
  email: string
  address: string
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyRelation: string
  allergies: string[]
  chronicConditions: string[]
  insuranceProvider: string
  policyNumber: string
  validTill: string
}

export type SymptomItem = {
  id: string
  label: string
  category: 'Cardiovascular' | 'Respiratory' | 'Neurology' | 'Trauma' | 'General' | 'Pediatric'
  recommendedDepartment: string
  severityWeight: number
}

export const hospitals: Hospital[] = [
  {
    id: 'ggh',
    name: 'Government General Hospital (Rajiv Gandhi)',
    location: 'Park Town, Chennai',
    distance: 2.4,
    type: 'Government Super Specialty Hospital',
    resource: {
      availableBeds: 120,
      icuBeds: 12,
      doctorsAvailable: 24,
      waitingTime: 15,
      oxygenBeds: 45,
      ventilatorBeds: 8,
    },
    emergency: true,
    ambulance: true,
    departments: ['Cardiology', 'General Medicine', 'Emergency Care', 'Neurology', 'Orthopedics'],
    score: 96,
    address: 'EVR Periyar Salai, Park Town, Chennai, Tamil Nadu 600003',
    phone: '+91 44 2530 5000',
    rating: 4.6,
    reviewsCount: 1420,
    coordinates: { x: 38, y: 32 },
    insuranceAccepted: ['CMCHIS (Govt)', 'Star Health', 'United India Insurance', 'Ayushman Bharat'],
    doctors: [
      { name: 'Dr. R. Ramanathan', role: 'Chief of Cardiology', experience: '18 yrs', fee: 'Free / Govt' },
      { name: 'Dr. Meena Swaminathan', role: 'Head of Emergency Medicine', experience: '14 yrs', fee: 'Free / Govt' },
      { name: 'Dr. Suresh Kumar', role: 'Senior Neurologist', experience: '16 yrs', fee: 'Free / Govt' },
    ],
  },
  {
    id: 'apollo',
    name: 'Apollo Hospitals Greams Road',
    location: 'Thousand Lights, Chennai',
    distance: 4.1,
    type: 'Multi-specialty Private Hospital',
    resource: {
      availableBeds: 68,
      icuBeds: 14,
      doctorsAvailable: 18,
      waitingTime: 20,
      oxygenBeds: 32,
      ventilatorBeds: 10,
    },
    emergency: true,
    ambulance: true,
    departments: ['Cardiology', 'Neurology', 'Orthopedics', 'Emergency Care', 'General Medicine'],
    score: 93,
    address: '21 Greams Lane, Thousand Lights, Chennai, Tamil Nadu 600006',
    phone: '+91 44 2829 3333',
    rating: 4.8,
    reviewsCount: 3850,
    coordinates: { x: 52, y: 48 },
    insuranceAccepted: ['Star Health', 'HDFC ERGO', 'ICICI Lombard', 'Max Bupa', 'Care Health'],
    doctors: [
      { name: 'Dr. Ramesh Babu', role: 'Senior Cardiologist & Interventionalist', experience: '22 yrs', fee: '₹1,000' },
      { name: 'Dr. Priya Varma', role: 'Consultant Neurologist', experience: '15 yrs', fee: '₹950' },
      { name: 'Dr. Arvind Sen', role: 'Orthopedic Trauma Surgeon', experience: '19 yrs', fee: '₹900' },
    ],
  },
  {
    id: 'fortis',
    name: 'Fortis Malar Hospital',
    location: 'Adyar, Chennai',
    distance: 6.8,
    type: 'Private Super-specialty Hospital',
    resource: {
      availableBeds: 45,
      icuBeds: 6,
      doctorsAvailable: 11,
      waitingTime: 28,
      oxygenBeds: 20,
      ventilatorBeds: 4,
    },
    emergency: true,
    ambulance: true,
    departments: ['Cardiology', 'General Medicine', 'Orthopedics', 'Emergency Care'],
    score: 88,
    address: 'No. 52, 1st Main Rd, Gandhi Nagar, Adyar, Chennai, Tamil Nadu 600020',
    phone: '+91 44 4289 2222',
    rating: 4.5,
    reviewsCount: 1980,
    coordinates: { x: 65, y: 72 },
    insuranceAccepted: ['Star Health', 'Care Health', 'Bajaj Allianz', 'Medi Assist'],
    doctors: [
      { name: 'Dr. K. G. Suresh', role: 'Interventional Cardiologist', experience: '16 yrs', fee: '₹850' },
      { name: 'Dr. Shobhana R.', role: 'General Physician & Diabetologist', experience: '12 yrs', fee: '₹700' },
    ],
  },
  {
    id: 'miot',
    name: 'MIOT International',
    location: 'Manapakkam, Chennai',
    distance: 8.5,
    type: 'Quaternary Care Multi-Specialty',
    resource: {
      availableBeds: 82,
      icuBeds: 18,
      doctorsAvailable: 22,
      waitingTime: 22,
      oxygenBeds: 40,
      ventilatorBeds: 12,
    },
    emergency: true,
    ambulance: true,
    departments: ['Orthopedics', 'Cardiology', 'Neurology', 'Emergency Care', 'General Medicine'],
    score: 90,
    address: '4/112 Mount Poonamallee Rd, Manapakkam, Chennai, Tamil Nadu 600089',
    phone: '+91 44 4200 2288',
    rating: 4.7,
    reviewsCount: 2640,
    coordinates: { x: 26, y: 68 },
    insuranceAccepted: ['Star Health', 'HDFC ERGO', 'United India', 'ICICI Lombard', 'All TPA'],
    doctors: [
      { name: 'Dr. P. V. Mohandas', role: 'Chief Orthopedic Surgeon', experience: '30 yrs', fee: '₹1,200' },
      { name: 'Dr. Deepa Nair', role: 'Critical Care Specialist', experience: '14 yrs', fee: '₹900' },
    ],
  },
  {
    id: 'kauvery',
    name: 'Kauvery Hospital Alwarpet',
    location: 'Alwarpet, Chennai',
    distance: 5.2,
    type: 'Multi-Specialty Care Hospital',
    resource: {
      availableBeds: 54,
      icuBeds: 9,
      doctorsAvailable: 15,
      waitingTime: 18,
      oxygenBeds: 28,
      ventilatorBeds: 6,
    },
    emergency: true,
    ambulance: true,
    departments: ['Cardiology', 'Neurology', 'General Medicine', 'Emergency Care'],
    score: 92,
    address: 'No. 81, TT Krishnamachari Rd, Alwarpet, Chennai, Tamil Nadu 600018',
    phone: '+91 44 4000 6000',
    rating: 4.7,
    reviewsCount: 2210,
    coordinates: { x: 48, y: 62 },
    insuranceAccepted: ['Star Health', 'Care Health', 'Niva Bupa', 'HDFC ERGO'],
    doctors: [
      { name: 'Dr. Manoj Balaji', role: 'Senior Cardiac Specialist', experience: '20 yrs', fee: '₹950' },
      { name: 'Dr. Sunita Rao', role: 'Consultant Physician', experience: '11 yrs', fee: '₹750' },
    ],
  },
  {
    id: 'sims',
    name: 'SIMS Hospital Vadapalani',
    location: 'Vadapalani, Chennai',
    distance: 6.1,
    type: 'Advanced Multi-Specialty Centre',
    resource: {
      availableBeds: 60,
      icuBeds: 11,
      doctorsAvailable: 16,
      waitingTime: 25,
      oxygenBeds: 30,
      ventilatorBeds: 7,
    },
    emergency: true,
    ambulance: false,
    departments: ['Cardiology', 'Neurology', 'Orthopedics', 'General Medicine'],
    score: 87,
    address: 'No. 1 Jawaharlal Nehru Salai, Vadapalani, Chennai, Tamil Nadu 600026',
    phone: '+91 44 4567 4567',
    rating: 4.6,
    reviewsCount: 1730,
    coordinates: { x: 34, y: 52 },
    insuranceAccepted: ['Star Health', 'HDFC ERGO', 'United India', 'SBI General'],
    doctors: [
      { name: 'Dr. Karthik Sundar', role: 'Head of Neurosciences', experience: '17 yrs', fee: '₹1,000' },
      { name: 'Dr. Ananya Ray', role: 'General Medicine', experience: '9 yrs', fee: '₹700' },
    ],
  },
]

export const specialties = [
  'All Specialties',
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'General Medicine',
  'Emergency Care',
  'Other',
]

export function rankHospitals(requirement: PatientRequirement) {
  return hospitals
    .filter((hospital) => {
      const locationMatch =
        !requirement.location ||
        hospital.location.toLowerCase().includes(requirement.location.toLowerCase()) ||
        hospital.address.toLowerCase().includes(requirement.location.toLowerCase())
      const specialtyMatch =
        requirement.specialty === 'Other' ||
        requirement.specialty === 'All Specialties' ||
        !requirement.specialty ||
        hospital.departments.includes(requirement.specialty)
      const emergencyMatch = !requirement.emergency || hospital.emergency
      const ambulanceMatch = !requirement.ambulanceRequired || hospital.ambulance
      const icuMatch = !requirement.icuRequired || hospital.resource.icuBeds > 0
      return locationMatch && specialtyMatch && emergencyMatch && ambulanceMatch && icuMatch
    })
    .sort((a, b) => b.score - a.score)
}

export const defaultReasons = [
  'ICU currently available with active ventilators',
  '24/7 dedicated Emergency Trauma response ready',
  'Advanced Cardiology & Catheterization Lab active',
  'Shortest average triage waiting time in your zone',
  'Direct verified ambulance fleet availability',
]

export const recentSearches = [
  { label: 'Cardiology', location: 'Chennai' },
  { label: 'Emergency Care', location: 'Chennai' },
  { label: 'ICU', location: 'Chennai' },
  { label: 'Neurology', location: 'Chennai' },
  { label: 'Orthopedics', location: 'Chennai' },
]

export const navItems = [
  ['Dashboard', 'LayoutDashboard'],
  ['My Location', 'MapPin'],
  ['Find a Hospital', 'Search'],
  ['My Recommendations', 'Sparkles'],
  ['Emergency Support', 'Siren'],
  ['Saved Hospitals', 'Heart'],
  ['Appointment / Requests', 'CalendarDays'],
  ['Health Requirements', 'ClipboardList'],
  ['Notifications', 'Bell'],
  ['Profile', 'UserRound'],
] as const

export const initialAppointments: Appointment[] = [
  {
    id: 'apt-101',
    hospitalId: 'apollo',
    hospitalName: 'Apollo Hospitals Greams Road',
    department: 'Cardiology',
    doctorName: 'Dr. Ramesh Babu',
    date: 'Tomorrow, 10:30 AM',
    time: '10:30 AM',
    status: 'Confirmed',
    type: 'In-person OPD',
    tokenNumber: 'OPD-CARD-24',
    patientNotes: 'Routine cardiology follow-up and blood pressure check.',
  },
  {
    id: 'apt-102',
    hospitalId: 'ggh',
    hospitalName: 'Government General Hospital (Rajiv Gandhi)',
    department: 'General Medicine',
    doctorName: 'Dr. Meena Swaminathan',
    date: '18 Sep 2026, 02:00 PM',
    time: '02:00 PM',
    status: 'Pending',
    type: 'In-person OPD',
    tokenNumber: 'MED-119',
    patientNotes: 'Seasonal allergy consultation.',
  },
  {
    id: 'apt-100',
    hospitalId: 'kauvery',
    hospitalName: 'Kauvery Hospital Alwarpet',
    department: 'Cardiology',
    doctorName: 'Dr. Manoj Balaji',
    date: '28 Aug 2026, 11:00 AM',
    time: '11:00 AM',
    status: 'Completed',
    type: 'In-person OPD',
    tokenNumber: 'OPD-90',
    patientNotes: 'ECG review and lipid profile analysis completed.',
  },
]

export const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Appointment Confirmed',
    message: 'Your Cardiology consultation with Dr. Ramesh Babu at Apollo Hospitals is confirmed for Tomorrow at 10:30 AM (Token #OPD-CARD-24).',
    time: '10 mins ago',
    unread: true,
    type: 'appointment',
    targetSection: 'Appointment / Requests',
  },
  {
    id: 'notif-2',
    title: 'ICU Capacity Alert in Park Town',
    message: 'Government General Hospital just reported 4 additional ICU beds and 2 ventilators ready for emergency triage.',
    time: '35 mins ago',
    unread: true,
    type: 'urgent',
    targetSection: 'Find a Hospital',
  },
  {
    id: 'notif-3',
    title: 'Ambulance GPS Corridor Active',
    message: 'Emergency green corridor established on Mount Road corridor for emergency transfers.',
    time: '2 hours ago',
    unread: false,
    type: 'info',
    targetSection: 'Emergency Support',
  },
  {
    id: 'notif-4',
    title: 'Profile Insurance Verified',
    message: 'Star Health Comprehensive policy #SH-884920 verified for cashless admission across 5 network hospitals.',
    time: 'Yesterday',
    unread: false,
    type: 'system',
    targetSection: 'Profile',
  },
]

export const initialProfile: UserProfile = {
  fullName: 'Ananya Krishnan',
  age: 28,
  gender: 'Female',
  bloodGroup: 'O+',
  phone: '+91 98401 23456',
  email: 'ananya.krishnan@gmail.com',
  address: 'No. 14, 4th Seaward Road, Valmiki Nagar, Thiruvanmiyur, Chennai 600041',
  emergencyContactName: 'Rahul Krishnan (Brother)',
  emergencyContactPhone: '+91 98765 43210',
  emergencyRelation: 'Brother',
  allergies: ['Penicillin', 'Sulfa drugs'],
  chronicConditions: ['Mild Hypertension', 'Asthma (Mild exercise-induced)'],
  insuranceProvider: 'Star Health Comprehensive Insurance',
  policyNumber: 'SH-884920-CHN',
  validTill: '31 Dec 2027',
}

export const symptomOptions: SymptomItem[] = [
  { id: 'sym-1', label: 'Severe chest pain / pressure radiating to arm', category: 'Cardiovascular', recommendedDepartment: 'Cardiology', severityWeight: 4 },
  { id: 'sym-2', label: 'Shortness of breath / gasping', category: 'Respiratory', recommendedDepartment: 'Emergency Care', severityWeight: 4 },
  { id: 'sym-3', label: 'Sudden weakness / facial drooping / slurred speech', category: 'Neurology', recommendedDepartment: 'Neurology', severityWeight: 4 },
  { id: 'sym-4', label: 'Severe bone fracture / bleeding trauma', category: 'Trauma', recommendedDepartment: 'Orthopedics', severityWeight: 3 },
  { id: 'sym-5', label: 'High fever (>102°F) with body chills', category: 'General', recommendedDepartment: 'General Medicine', severityWeight: 2 },
  { id: 'sym-6', label: 'Persistent dizziness or fainting spell', category: 'Neurology', recommendedDepartment: 'Neurology', severityWeight: 3 },
  { id: 'sym-7', label: 'Severe abdominal pain / continuous vomiting', category: 'General', recommendedDepartment: 'General Medicine', severityWeight: 2 },
  { id: 'sym-8', label: 'Mild palpitations or irregular heartbeats', category: 'Cardiovascular', recommendedDepartment: 'Cardiology', severityWeight: 2 },
]

export function evaluateTriage(selectedSymptomIds: string[], severityLevel: string, duration: string) {
  const selectedSymptoms = symptomOptions.filter((s) => selectedSymptomIds.includes(s.id))
  let maxWeight = 1
  selectedSymptoms.forEach((s) => {
    if (s.severityWeight > maxWeight) maxWeight = s.severityWeight
  })

  if (severityLevel === 'Critical' || maxWeight >= 4) {
    return {
      level: 'Level 1: Immediate Emergency Resuscitation',
      color: 'text-destructive bg-destructive/10 border-destructive/30',
      badgeColor: 'bg-destructive text-destructive-foreground',
      urgency: 'Immediate action required. Dial 108 or proceed to nearest Emergency Trauma ICU immediately.',
      recommendedDepartment: selectedSymptoms[0]?.recommendedDepartment || 'Emergency Care',
      requiresICU: true,
      requiresAmbulance: true,
    }
  } else if (severityLevel === 'Severe' || maxWeight === 3) {
    return {
      level: 'Level 2: Urgent Care Required (<30 mins)',
      color: 'text-amber-800 bg-amber-50 border-amber-200',
      badgeColor: 'bg-amber-600 text-white',
      urgency: 'Patient requires emergency evaluation within 30 minutes. Visit hospital ER.',
      recommendedDepartment: selectedSymptoms[0]?.recommendedDepartment || 'Emergency Care',
      requiresICU: true,
      requiresAmbulance: false,
    }
  } else if (severityLevel === 'Moderate' || maxWeight === 2) {
    return {
      level: 'Level 3: Semi-Urgent OPD Evaluation',
      color: 'text-teal-800 bg-teal-50 border-teal-200',
      badgeColor: 'bg-primary text-primary-foreground',
      urgency: 'Scheduled hospital visit or same-day OPD consultation recommended.',
      recommendedDepartment: selectedSymptoms[0]?.recommendedDepartment || 'General Medicine',
      requiresICU: false,
      requiresAmbulance: false,
    }
  } else {
    return {
      level: 'Level 4: Routine Consultation',
      color: 'text-emerald-800 bg-emerald-50 border-emerald-200',
      badgeColor: 'bg-emerald-600 text-white',
      urgency: 'Routine general consultation or follow-up advice appropriate.',
      recommendedDepartment: selectedSymptoms[0]?.recommendedDepartment || 'General Medicine',
      requiresICU: false,
      requiresAmbulance: false,
    }
  }
}
