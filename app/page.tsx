'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { searchHospitals, searchHospitalsSync } from '@/lib/hospital-search'
import { MyLocationSection } from '@/components/sections/my-location-section'
import {
  LayoutDashboard,
  Search,
  Sparkles,
  Siren,
  Heart,
  CalendarDays,
  ClipboardList,
  Bell,
  UserRound,
  CircleHelp,
  ArrowRight,
  LogOut,
  Cross,
  Menu,
  X,
  Check,
  Phone,
  MapPin,
  BedDouble,
  Clock,
  Stethoscope,
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Navigation,
  User,
} from 'lucide-react'
import {
  hospitals as initialHospitals,
  navItems,
  initialAppointments,
  initialNotifications,
  initialProfile,
  type Hospital,
  type Appointment,
  type NotificationItem,
  type UserProfile,
  type PatientRequirement,
} from '@/lib/hospital-data'

import { DashboardView } from '@/components/sections/dashboard-view'
import { FindHospitalView } from '@/components/sections/find-hospital-view'
import { RecommendationsView } from '@/components/sections/recommendations-view'
import { EmergencyView } from '@/components/sections/emergency-view'
import { SavedHospitalsView } from '@/components/sections/saved-hospitals-view'
import { AppointmentsView } from '@/components/sections/appointments-view'
import { HealthRequirementsView } from '@/components/sections/health-requirements-view'
import { NotificationsView } from '@/components/sections/notifications-view'
import { ProfileView } from '@/components/sections/profile-view'

import { BookingModal } from '@/components/modals/booking-modal'
import { MapModal } from '@/components/modals/map-modal'
import { SupportModal } from '@/components/modals/support-modal'
import { LoginView } from '@/components/auth/login-view'
import {
  setActiveUserEmail,
  getUserPartition,
  saveUserPartition,
  getInitials,
} from '@/lib/users-data'

const iconMap = {
  LayoutDashboard,
  MapPin,
  Search,
  Sparkles,
  Siren,
  Heart,
  CalendarDays,
  ClipboardList,
  Bell,
  UserRound,
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <Cross className="size-5" strokeWidth={2.5} />
      </div>
      <div>
        <p className="font-bold tracking-tight text-foreground text-base">SwasthyaConnect</p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
          AI Healthcare Intelligence
        </p>
      </div>
    </div>
  )
}

export default function Page() {
  const [mounted, setMounted] = useState<boolean>(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('')
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [activeTab, setActiveTab] = useState<string>('Dashboard')
  const [mobileOpen, setMobileOpen] = useState<boolean>(false)

  // Core Data States
  const [hospitals, setHospitals] = useState<Hospital[]>(initialHospitals)
  const [savedHospitalIds, setSavedHospitalIds] = useState<string[]>(['ggh', 'apollo'])
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications)
  const [userProfile, setUserProfile] = useState<UserProfile>(initialProfile)

  // Dialog & Modal States
  const [detailsHospital, setDetailsHospital] = useState<Hospital | null>(null)
  const [bookingHospital, setBookingHospital] = useState<Hospital | null>(null)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false)
  const [isMapModalOpen, setIsMapModalOpen] = useState<boolean>(false)
  const [isSupportModalOpen, setIsSupportModalOpen] = useState<boolean>(false)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false)
  const [slipAppointment, setSlipAppointment] = useState<Appointment | null>(null)
  const [toast, setToast] = useState<string>('')

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(''), 3200)
  }

  // Load User Partition Session
  const loadUserSession = (email: string, showWelcome = true) => {
    const cleanEmail = email.toLowerCase().trim()
    setActiveUserEmail(cleanEmail)
    setCurrentUserEmail(cleanEmail)
    const partition = getUserPartition(cleanEmail)
    setUserProfile(partition.profile)
    setAppointments(partition.appointments)
    setSavedHospitalIds(partition.savedHospitalIds)
    setNotifications(partition.notifications)
    setIsAuthenticated(true)
    setActiveTab('Dashboard')
    if (showWelcome) {
      showToast(`Welcome back, ${partition.profile.fullName.split(' ')[0]}`)
    }
  }

  // Hydration & Supabase session check
  useEffect(() => {
    setMounted(true)

    // Check for an existing Supabase session on first load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        loadUserSession(session.user.email, false)
      }
      if (session?.user?.id) {
        setCurrentUserId(session.user.id)
      }
    })

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setActiveUserEmail(null)
        setIsAuthenticated(false)
        setCurrentUserId('')
      } else if (session.user?.id) {
        setCurrentUserId(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = async (email: string) => {
    loadUserSession(email, true)
    // Capture the Supabase user ID right after login
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.id) {
      setCurrentUserId(session.user.id)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setActiveUserEmail(null)
    setIsAuthenticated(false)
    setIsLogoutModalOpen(false)
    showToast('Logged out of patient portal')
  }

  // Favorite toggle handler (with user-wise persistence)
  const toggleSaveHospital = (id: string) => {
    setSavedHospitalIds((prev) => {
      const exists = prev.includes(id)
      const targetHospital = hospitals.find((h) => h.id === id)
      const name = targetHospital?.name.split(' ')[0] ?? 'Hospital'
      const updated = exists ? prev.filter((item) => item !== id) : [...prev, id]
      if (currentUserEmail) {
        saveUserPartition(currentUserEmail, { savedHospitalIds: updated })
      }
      if (exists) {
        showToast(`${name} removed from saved facilities`)
      } else {
        showToast(`${name} bookmarked to saved facilities`)
      }
      return updated
    })
  }

  // Filter hospitals handler — async, Supabase-first
  const handleFilterHospitals = async (req: PatientRequirement) => {
    try {
      const result = await searchHospitals(req)
      setHospitals(result.hospitals)
    } catch {
      // Fallback to synchronous static search on unexpected error
      setHospitals(searchHospitalsSync(req))
    }
  }

  // Emergency Search handler — synchronous for speed
  const handleEmergencySearch = () => {
    const emergencyHospitals = searchHospitalsSync({
      location: '',
      specialty: 'Emergency Care',
      icuRequired: false,
      emergency: true,
      ambulanceRequired: false,
      notes: '',
    })
    setHospitals(emergencyHospitals)
    showToast('Filtered for 24/7 Emergency and Trauma ready hospitals')
  }

  // Appointment Actions (with user-wise persistence)
  const handleConfirmBooking = (data: Omit<Appointment, 'id' | 'tokenNumber' | 'status'>) => {
    const tokenNumber = `SW-${Math.floor(100 + Math.random() * 900)}`
    const newAppointment: Appointment = {
      ...data,
      id: `apt-${Date.now()}`,
      tokenNumber,
      status: 'Confirmed',
    }

    const updatedAppointments = [newAppointment, ...appointments]
    setAppointments(updatedAppointments)

    // Generate notification
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Appointment Confirmed',
      message: `Your booking at ${data.hospitalName} with ${data.doctorName} is confirmed (Token #${tokenNumber}).`,
      time: 'Just now',
      unread: true,
      type: 'appointment',
      targetSection: 'Appointment / Requests',
    }
    const updatedNotifications = [newNotif, ...notifications]
    setNotifications(updatedNotifications)

    if (currentUserEmail) {
      saveUserPartition(currentUserEmail, {
        appointments: updatedAppointments,
        notifications: updatedNotifications,
      })
    }

    setIsBookingModalOpen(false)
    setBookingHospital(null)
    showToast(`Token #${tokenNumber} generated for ${data.hospitalName}`)
  }

  const handleCancelAppointment = (id: string) => {
    const updated = appointments.map((a) => (a.id === id ? { ...a, status: 'Cancelled' as const } : a))
    setAppointments(updated)
    if (currentUserEmail) {
      saveUserPartition(currentUserEmail, { appointments: updated })
    }
    showToast('Appointment cancelled')
  }

  const handleRescheduleAppointment = (apt: Appointment) => {
    setBookingHospital(hospitals.find((h) => h.id === apt.hospitalId) || hospitals[0])
    setIsBookingModalOpen(true)
  }

  // AI Triage Apply Handler
  const handleApplyTriageToSearch = (department: string, requiresICU: boolean, requiresAmbulance: boolean) => {
    handleFilterHospitals({
      location: '',
      specialty: department,
      icuRequired: requiresICU,
      emergency: requiresICU,
      ambulanceRequired: requiresAmbulance,
      notes: 'AI Triage Recommended',
    })
    setActiveTab('Find a Hospital')
    showToast(`Matching facilities with active ${department} departments`)
  }

  // Notifications Actions
  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
    showToast('All notifications marked as read')
  }

  const handleClearNotifications = () => {
    setNotifications([])
    showToast('Notifications cleared')
  }

  const handleSelectNotification = (item: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
    )
    if (item.targetSection) {
      setActiveTab(item.targetSection)
    }
  }

  // Profile update handler
  const handleUpdateProfile = (updated: UserProfile) => {
    setUserProfile(updated)
    if (currentUserEmail) {
      saveUserPartition(currentUserEmail, { profile: updated })
    }
    showToast('Patient profile updated successfully')
  }

  const unreadCount = notifications.filter((n) => n.unread).length

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="flex items-center gap-3 animate-pulse">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Cross className="size-5" strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-bold tracking-tight text-foreground text-base">SwasthyaConnect</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
              AI Healthcare Intelligence
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} defaultEmail={currentUserEmail} />
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        {/* Sidebar Navigation */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card px-4 py-5 transition-transform lg:static lg:translate-x-0 ${
            mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          }`}
        >
          <div className="mb-8 px-2">
            <Logo />
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto" aria-label="Primary navigation">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Patient Portal
            </p>
            {navItems.map(([label, icon]) => {
              const Icon = iconMap[icon as keyof typeof iconMap]
              const selected = activeTab === label

              // Counter badges
              let badgeText = ''
              if (label === 'Notifications' && unreadCount > 0) {
                badgeText = String(unreadCount)
              } else if (label === 'Saved Hospitals' && savedHospitalIds.length > 0) {
                badgeText = String(savedHospitalIds.length)
              } else if (label === 'Appointment / Requests') {
                const activeCount = appointments.filter((a) => a.status === 'Confirmed' || a.status === 'Pending').length
                if (activeCount > 0) badgeText = String(activeCount)
              }

              return (
                <button
                  key={label}
                  aria-label={label === 'Find a Hospital' ? 'Find Hospital' : label === 'Emergency Support' ? 'Emergency' : label}
                  onClick={() => {
                    setActiveTab(label)
                    setMobileOpen(false)
                  }}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs sm:text-sm font-semibold transition cursor-pointer ${
                    selected
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="size-[17px] shrink-0" />
                    {label}
                  </span>
                  {badgeText && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        selected
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : label === 'Notifications'
                          ? 'bg-destructive text-destructive-foreground'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {badgeText}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Contact Support Trigger */}
          <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <div className="mb-2.5 flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CircleHelp className="size-4" />
            </div>
            <p className="text-xs font-bold text-foreground">Need help finding care?</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              Our 24/7 care concierge is ready to assist your search.
            </p>
            <button
              onClick={() => setIsSupportModalOpen(true)}
              className="mt-3 flex items-center text-xs font-bold text-primary hover:underline"
            >
              Contact AI Concierge <ArrowRight className="ml-1 inline size-3" />
            </button>
          </div>

          {/* Active User Pill in Sidebar */}
          <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-muted/40 p-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                {getInitials(userProfile.fullName)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{userProfile.fullName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{userProfile.email}</p>
              </div>
            </div>
            <button
              onClick={() => setIsLogoutModalOpen(true)}
              title="Log out or switch user"
              className="p-1 text-muted-foreground hover:text-destructive transition cursor-pointer"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-destructive transition cursor-pointer"
          >
            <LogOut className="size-4" /> Log out / Switch User
          </button>
        </aside>

        {/* Backdrop for Mobile Sidebar */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-foreground/30 backdrop-blur-xs lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <div className="min-w-0 flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-20 flex h-[74px] items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-md sm:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="rounded-xl border border-border p-2 text-muted-foreground hover:bg-muted lg:hidden"
                aria-label="Open navigation drawer"
              >
                <Menu className="size-5" />
              </button>
              <div>
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">{activeTab}</h1>
                <p className="hidden text-xs text-muted-foreground sm:block">
                  Personalized hospital recommendations & live healthcare resources
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Emergency Quick SOS in Header */}
              <button
                onClick={() => setActiveTab('Emergency Support')}
                aria-label="Emergency"
                className="hidden sm:flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive hover:text-destructive-foreground transition cursor-pointer"
              >
                <Siren className="size-3.5" /> Emergency SOS
              </button>

              {/* Notification Bell */}
              <button
                onClick={() => setActiveTab('Notifications')}
                className="relative rounded-xl border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="size-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* User Profile Trigger */}
              <button
                onClick={() => setActiveTab('Profile')}
                title="View active patient profile"
                className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-1.5 pr-3 text-left transition hover:border-primary/40 hover:bg-primary/5 cursor-pointer"
              >
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                  {getInitials(userProfile.fullName)}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-foreground leading-none">{userProfile.fullName}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[120px]">{userProfile.email}</p>
                </div>
              </button>
            </div>
          </header>

          {/* Main Body with Active Section */}
          <main className="mx-auto w-full max-w-[1440px] flex-1 p-4 sm:p-8">
            {activeTab === 'Dashboard' && (
              <DashboardView
                userProfile={userProfile}
                hospitals={hospitals}
                appointments={appointments}
                savedHospitalIds={savedHospitalIds}
                onToggleSave={toggleSaveHospital}
                onNavigateTab={setActiveTab}
                onViewDetails={setDetailsHospital}
                onBookAppointment={(h) => {
                  setBookingHospital(h)
                  setIsBookingModalOpen(true)
                }}
                onOpenMap={() => setIsMapModalOpen(true)}
                onEmergencySOS={() => setActiveTab('Emergency Support')}
              />
            )}

            {activeTab === 'My Location' && currentUserId && (
              <MyLocationSection userId={currentUserId} />
            )}
            {activeTab === 'My Location' && !currentUserId && (
              <MyLocationSection userId={currentUserEmail} />
            )}

            {activeTab === 'Find a Hospital' && (
              <FindHospitalView
                hospitals={hospitals}
                savedHospitalIds={savedHospitalIds}
                onToggleSave={toggleSaveHospital}
                onViewDetails={setDetailsHospital}
                onBookHospital={(h) => {
                  setBookingHospital(h)
                  setIsBookingModalOpen(true)
                }}
                onOpenMap={() => setIsMapModalOpen(true)}
                onEmergencySearch={handleEmergencySearch}
                onFilterChange={handleFilterHospitals}
              />
            )}

            {activeTab === 'My Recommendations' && (
              <RecommendationsView
                hospitals={hospitals}
                savedHospitalIds={savedHospitalIds}
                onToggleSave={toggleSaveHospital}
                onViewDetails={setDetailsHospital}
                onBookHospital={(h) => {
                  setBookingHospital(h)
                  setIsBookingModalOpen(true)
                }}
              />
            )}

            {activeTab === 'Emergency Support' && (
              <EmergencyView
                hospitals={hospitals}
                userProfile={userProfile}
                onViewDetails={setDetailsHospital}
              />
            )}

            {activeTab === 'Saved Hospitals' && (
              <SavedHospitalsView
                hospitals={hospitals}
                savedHospitalIds={savedHospitalIds}
                onToggleSave={toggleSaveHospital}
                onViewDetails={setDetailsHospital}
                onBookHospital={(h) => {
                  setBookingHospital(h)
                  setIsBookingModalOpen(true)
                }}
                onNavigateSearch={() => setActiveTab('Find a Hospital')}
              />
            )}

            {activeTab === 'Appointment / Requests' && (
              <AppointmentsView
                appointments={appointments}
                onOpenBookingModal={() => {
                  setBookingHospital(hospitals[0])
                  setIsBookingModalOpen(true)
                }}
                onCancelAppointment={handleCancelAppointment}
                onRescheduleAppointment={handleRescheduleAppointment}
                onDownloadSlip={(apt) => setSlipAppointment(apt)}
              />
            )}

            {activeTab === 'Health Requirements' && (
              <HealthRequirementsView onApplyTriageToSearch={handleApplyTriageToSearch} />
            )}

            {activeTab === 'Notifications' && (
              <NotificationsView
                notifications={notifications}
                onMarkAllAsRead={handleMarkAllNotificationsRead}
                onClearAll={handleClearNotifications}
                onSelectNotification={handleSelectNotification}
              />
            )}

            {activeTab === 'Profile' && (
              <ProfileView
                profile={userProfile}
                onUpdateProfile={handleUpdateProfile}
                onDownloadMedicalId={() => {
                  showToast('Emergency Medical ID Card downloaded')
                }}
              />
            )}

            {/* Footer */}
            <footer className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                <p className="font-bold text-foreground">SwasthyaConnect AI Patient Portal</p>
              </div>
              <p>Tamil Nadu Healthcare Radar & Real-Time Emergency Triage</p>
              <div className="flex items-center gap-4">
                <button onClick={() => setIsSupportModalOpen(true)} className="hover:text-primary transition">
                  Help Desk
                </button>
                <span>·</span>
                <span>support@swasthyaconnect.ai</span>
              </div>
            </footer>
          </main>
        </div>
      </div>

      {/* Hospital Details Dialog Modal */}
      {detailsHospital && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-xs"
          role="presentation"
          onClick={() => setDetailsHospital(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="hospital-dialog-title"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                  {detailsHospital.type}
                </span>
                <h2 id="hospital-dialog-title" className="mt-2 text-xl font-bold text-foreground">
                  {detailsHospital.name}
                </h2>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3.5 text-primary" /> {detailsHospital.address}
                </p>
              </div>
              <button
                onClick={() => setDetailsHospital(null)}
                aria-label="Close details"
                className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Live Metrics */}
            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <div className="rounded-xl bg-muted/50 p-3">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground">Total Beds</span>
                <p className="text-base font-bold text-foreground mt-0.5">
                  {detailsHospital.resource.availableBeds} units
                </p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground">ICU Beds</span>
                <p className="text-base font-bold text-foreground mt-0.5">
                  {detailsHospital.resource.icuBeds} Ready
                </p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground">Ventilators</span>
                <p className="text-base font-bold text-foreground mt-0.5">
                  {detailsHospital.resource.ventilatorBeds} Units
                </p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground">Wait Time</span>
                <p className="text-base font-bold text-foreground mt-0.5">
                  {detailsHospital.resource.waitingTime} mins
                </p>
              </div>
            </div>

            {/* Departments */}
            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Clinical Departments & Centers of Excellence
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {detailsHospital.departments.map((dept) => (
                  <span
                    key={dept}
                    className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
                  >
                    {dept}
                  </span>
                ))}
              </div>
            </div>

            {/* Available Doctors List */}
            {detailsHospital.doctors && detailsHospital.doctors.length > 0 && (
              <div className="mt-5 border-t border-border pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Consulting Specialists
                </p>
                <div className="mt-2 divide-y divide-border">
                  {detailsHospital.doctors.map((doc) => (
                    <div key={doc.name} className="flex items-center justify-between py-2 text-xs">
                      <div>
                        <p className="font-bold text-foreground">{doc.name}</p>
                        <p className="text-muted-foreground text-[11px]">{doc.role} · {doc.experience}</p>
                      </div>
                      <span className="font-semibold text-primary">{doc.fee}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Phone & Contact */}
            <div className="mt-5 flex items-center justify-between rounded-2xl bg-primary/5 p-4">
              <div className="flex items-center gap-3">
                <Phone className="size-4 text-primary" />
                <div>
                  <p className="text-xs font-bold text-foreground">{detailsHospital.phone}</p>
                  <p className="text-[10px] text-muted-foreground">24/7 Emergency & Admission Desk</p>
                </div>
              </div>
              <a
                href={`tel:${detailsHospital.phone}`}
                className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90"
              >
                Call Now
              </a>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3 pt-2 border-t border-border">
              <button
                onClick={() => toggleSaveHospital(detailsHospital.id)}
                className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition"
              >
                <Heart
                  className={`size-4 ${
                    savedHospitalIds.includes(detailsHospital.id) ? 'fill-rose-600 text-rose-600' : ''
                  }`}
                />
                {savedHospitalIds.includes(detailsHospital.id) ? 'Saved' : 'Save'}
              </button>
              <button
                onClick={() => {
                  const target = detailsHospital
                  setDetailsHospital(null)
                  setBookingHospital(target)
                  setIsBookingModalOpen(true)
                }}
                className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition"
              >
                Book Priority Appointment Here
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Booking Wizard Modal */}
      {isBookingModalOpen && (
        <BookingModal
          hospital={bookingHospital}
          allHospitals={hospitals}
          onClose={() => {
            setIsBookingModalOpen(false)
            setBookingHospital(null)
          }}
          onConfirm={handleConfirmBooking}
        />
      )}

      {/* Interactive Map Modal */}
      {isMapModalOpen && (
        <MapModal
          hospitals={hospitals}
          onClose={() => setIsMapModalOpen(false)}
          onSelectHospital={(h) => setDetailsHospital(h)}
          onBookHospital={(h) => {
            setBookingHospital(h)
            setIsBookingModalOpen(true)
          }}
        />
      )}

      {/* 24/7 Support Modal */}
      {isSupportModalOpen && <SupportModal onClose={() => setIsSupportModalOpen(false)} />}

      {/* Appointment Slip View / Print Modal */}
      {slipAppointment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-xs"
          role="presentation"
          onClick={() => setSlipAppointment(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-emerald-600" />
                <h3 className="font-bold text-foreground text-base">Confirmed Outpatient Pass</h3>
              </div>
              <button
                onClick={() => setSlipAppointment(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-5 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Digital Token Number</span>
              <p className="mt-1 text-2xl font-black font-mono text-primary">#{slipAppointment.tokenNumber}</p>
              <p className="mt-2 text-xs font-semibold text-foreground">{slipAppointment.doctorName}</p>
              <p className="text-[11px] text-muted-foreground">{slipAppointment.department} · {slipAppointment.hospitalName}</p>

              <div className="mt-4 flex items-center justify-around rounded-xl bg-card p-3 text-xs border border-border font-semibold">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Date</span>
                  {slipAppointment.date}
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Time</span>
                  {slipAppointment.time}
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Mode</span>
                  {slipAppointment.type}
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  showToast('Pass saved to downloads')
                  setSlipAppointment(null)
                }}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90"
              >
                <Download className="size-3.5" /> Save Digital PDF
              </button>
              <button
                onClick={() => setSlipAppointment(null)}
                className="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Dialog */}
      {isLogoutModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-xs"
          role="presentation"
          onClick={() => setIsLogoutModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <LogOut className="size-6" />
            </div>
            <h3 className="mt-4 font-bold text-foreground text-lg">Log Out of Patient Portal?</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              You are currently signed in as <strong>{userProfile.fullName}</strong> ({userProfile.email}). You can sign back in anytime to access your medical records.
            </p>
            <div className="mt-6 flex gap-2.5">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 rounded-xl border border-border py-2.5 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 rounded-xl bg-destructive py-2.5 text-xs font-bold text-destructive-foreground hover:bg-destructive/90 shadow-xs cursor-pointer"
              >
                Confirm Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Feedback */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-foreground px-5 py-3 text-xs font-bold text-background shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <Check className="size-4 text-emerald-400" />
          {toast}
        </div>
      )}
    </div>
  )
}
