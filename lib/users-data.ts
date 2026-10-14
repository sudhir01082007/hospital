import { UserProfile, Appointment, NotificationItem, initialAppointments, initialNotifications, initialProfile } from '@/lib/hospital-data'

export interface UserPartition {
  profile: UserProfile
  appointments: Appointment[]
  savedHospitalIds: string[]
  notifications: NotificationItem[]
  tag?: string
  avatarBg?: string
}

export const DEMO_USERS: Record<string, UserPartition> = {
  'ananya.krishnan@gmail.com': {
    tag: 'Cardiology Patient',
    avatarBg: 'bg-emerald-600 text-white',
    profile: {
      ...initialProfile,
      email: 'ananya.krishnan@gmail.com',
    },
    appointments: initialAppointments,
    savedHospitalIds: ['ggh', 'apollo'],
    notifications: initialNotifications,
  },
  'rajesh.kumar@gmail.com': {
    tag: 'Orthopedics & Diabetology',
    avatarBg: 'bg-blue-600 text-white',
    profile: {
      fullName: 'Rajesh Kumar',
      age: 52,
      gender: 'Male',
      bloodGroup: 'B+',
      phone: '+91 98412 87654',
      email: 'rajesh.kumar@gmail.com',
      address: 'Flat 3B, Ceebros Heights, Cenotaph Road, Teynampet, Chennai 600018',
      emergencyContactName: 'Sunita Kumar (Wife)',
      emergencyContactPhone: '+91 98412 87655',
      emergencyRelation: 'Spouse',
      allergies: ['Aspirin', 'Ibuprofen'],
      chronicConditions: ['Type 2 Diabetes Mellitus', 'Bilateral Knee Osteoarthritis', 'Dyslipidemia'],
      insuranceProvider: 'HDFC ERGO Optima Secure',
      policyNumber: 'HE-904312-CHN',
      validTill: '15 Aug 2028',
    },
    appointments: [
      {
        id: 'apt-201',
        hospitalId: 'fortis',
        hospitalName: 'Fortis Malar Hospital',
        department: 'Orthopedics',
        doctorName: 'Dr. S. Ramanathan',
        date: 'Friday, 11:30 AM',
        time: '11:30 AM',
        status: 'Confirmed',
        type: 'In-person OPD',
        tokenNumber: 'OPD-ORTH-12',
        patientNotes: 'Right knee acute joint effusion assessment and X-ray review.',
      },
      {
        id: 'apt-202',
        hospitalId: 'kauvery',
        hospitalName: 'Kauvery Hospital',
        department: 'General Medicine',
        doctorName: 'Dr. M. Jayashree',
        date: 'Next Monday, 09:00 AM',
        time: '09:00 AM',
        status: 'Pending',
        type: 'In-person OPD',
        tokenNumber: 'OPD-DIAB-05',
        patientNotes: 'Quarterly HbA1c screening and insulin dosage calibration.',
      },
    ],
    savedHospitalIds: ['fortis', 'kauvery'],
    notifications: [
      {
        id: 'notif-r1',
        title: 'Joint Replacement OPD Slot Confirmed',
        message: 'Your orthopedic consultation at Fortis Malar is confirmed for Friday, 11:30 AM (Token #OPD-ORTH-12).',
        time: '1 hour ago',
        unread: true,
        type: 'appointment',
        targetSection: 'Appointment / Requests',
      },
      {
        id: 'notif-r2',
        title: 'Fasting Blood Sugar Alert',
        message: 'Pre-consultation fasting metabolic panel required 48 hours prior to appointment.',
        time: 'Yesterday',
        unread: false,
        type: 'info',
        targetSection: 'Profile',
      },
    ],
  },
  'priya.sharma@gmail.com': {
    tag: 'Neurology & Emergency Care',
    avatarBg: 'bg-purple-600 text-white',
    profile: {
      fullName: 'Priya Sharma',
      age: 34,
      gender: 'Female',
      bloodGroup: 'A-',
      phone: '+91 97908 12389',
      email: 'priya.sharma@gmail.com',
      address: 'Plot 22, 2nd Cross, Indira Nagar, Adyar, Chennai 600020',
      emergencyContactName: 'Vikram Sharma (Husband)',
      emergencyContactPhone: '+91 97908 12390',
      emergencyRelation: 'Spouse',
      allergies: ['Ciprofloxacin', 'Shellfish'],
      chronicConditions: ['Migraine with Aura', 'Hypothyroidism'],
      insuranceProvider: 'ICICI Lombard Complete Health',
      policyNumber: 'IL-552190-CHN',
      validTill: '20 Nov 2026',
    },
    appointments: [
      {
        id: 'apt-301',
        hospitalId: 'miot',
        hospitalName: 'MIOT International',
        department: 'Neurology',
        doctorName: 'Dr. P. Sangeetha',
        date: 'Thursday, 04:00 PM',
        time: '04:00 PM',
        status: 'Confirmed',
        type: 'In-person OPD',
        tokenNumber: 'OPD-NEURO-77',
        patientNotes: 'Evaluation of recurrent migraine aura episodes and brain MRI review.',
      },
    ],
    savedHospitalIds: ['miot', 'gleneagles'],
    notifications: [
      {
        id: 'notif-p1',
        title: 'Neurology Specialist Consultation Ready',
        message: 'Dr. P. Sangeetha has confirmed token #OPD-NEURO-77 at MIOT International.',
        time: '30 mins ago',
        unread: true,
        type: 'appointment',
        targetSection: 'Appointment / Requests',
      },
      {
        id: 'notif-p2',
        title: 'Digital Emergency Card Synchronized',
        message: 'Emergency contact Vikram Sharma (+91 97908 12390) configured for one-touch SOS GPS broadcast.',
        time: '3 hours ago',
        unread: false,
        type: 'urgent',
        targetSection: 'Emergency Support',
      },
    ],
  },
}

const STORAGE_PREFIX = 'swasthya_user_partition_'
const CURRENT_AUTH_KEY = 'swasthya_active_user_email'

export function getActiveUserEmail(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(CURRENT_AUTH_KEY)
  } catch {
    return null
  }
}

export function setActiveUserEmail(email: string | null): void {
  if (typeof window === 'undefined') return
  try {
    if (email) {
      localStorage.setItem(CURRENT_AUTH_KEY, email.toLowerCase().trim())
    } else {
      localStorage.removeItem(CURRENT_AUTH_KEY)
    }
  } catch {
    // Ignore storage errors
  }
}

export function getUserPartition(email: string): UserPartition {
  const cleanEmail = email.toLowerCase().trim()

  // 1. Check localStorage first
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}${cleanEmail}`)
      if (stored) {
        return JSON.parse(stored) as UserPartition
      }
    } catch {
      // Fall through on JSON parse error
    }
  }

  // 2. Check demo users
  if (DEMO_USERS[cleanEmail]) {
    return DEMO_USERS[cleanEmail]
  }

  // 3. Generate default new patient partition for custom email
  const nameFromEmail = cleanEmail.split('@')[0].replace(/[._-]/g, ' ')
  const formattedName = nameFromEmail
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ') || 'Registered Patient'

  const newPartition: UserPartition = {
    tag: 'General Healthcare Patient',
    avatarBg: 'bg-teal-600 text-white',
    profile: {
      fullName: formattedName,
      age: 30,
      gender: 'Other',
      bloodGroup: 'B+',
      phone: '+91 98400 00000',
      email: cleanEmail,
      address: 'Chennai Metropolitan Region, Tamil Nadu',
      emergencyContactName: 'Primary Emergency Contact',
      emergencyContactPhone: '+91 108',
      emergencyRelation: 'Family Member',
      allergies: ['None known'],
      chronicConditions: ['None reported'],
      insuranceProvider: 'Ayushman Bharat PM-JAY / CMCHIS',
      policyNumber: `AB-${Math.floor(100000 + Math.random() * 900000)}-CHN`,
      validTill: '31 Dec 2029',
    },
    appointments: [],
    savedHospitalIds: ['ggh'],
    notifications: [
      {
        id: `notif-welcome-${Date.now()}`,
        title: 'Welcome to SwasthyaConnect AI',
        message: `Your account (${cleanEmail}) has been activated. You can search hospitals, book OPD slots, and access 24/7 emergency care.`,
        time: 'Just now',
        unread: true,
        type: 'info',
        targetSection: 'Dashboard',
      },
    ],
  }

  saveUserPartition(cleanEmail, newPartition)
  return newPartition
}

export function saveUserPartition(email: string, partition: Partial<UserPartition>): void {
  if (typeof window === 'undefined') return
  const cleanEmail = email.toLowerCase().trim()
  try {
    const existing = getUserPartition(cleanEmail)
    const merged: UserPartition = {
      ...existing,
      ...partition,
      profile: partition.profile ? { ...existing.profile, ...partition.profile } : existing.profile,
    }
    localStorage.setItem(`${STORAGE_PREFIX}${cleanEmail}`, JSON.stringify(merged))
  } catch {
    // Ignore storage errors
  }
}

export function getInitials(name: string): string {
  if (!name) return 'PT'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}
