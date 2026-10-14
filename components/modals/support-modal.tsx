'use client'

import { useState } from 'react'
import { X, Send, Bot, User, PhoneCall, Sparkles, ShieldCheck } from 'lucide-react'

interface SupportModalProps {
  onClose: () => void
}

export function SupportModal({ onClose }: SupportModalProps) {
  const [messages, setMessages] = useState<{ id: string; sender: 'ai' | 'user'; text: string; time: string }[]>([
    {
      id: 'm-1',
      sender: 'ai',
      text: 'Namaste Ananya! I am your SwasthyaConnect AI Patient Concierge. How can I help you find care, navigate admissions, or check live hospital bed availability right now?',
      time: 'Just now',
    },
  ])
  const [input, setInput] = useState('')

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userText = input
    setInput('')
    const newMsg = {
      id: `u-${Date.now()}`,
      sender: 'user' as const,
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, newMsg])

    // Generate intelligent contextual response
    setTimeout(() => {
      let reply = "I've checked our live database. For your inquiry, Government General Hospital has 12 ICU beds open right now, and Apollo Greams Road has top cardiologists available with under 20 mins wait time."
      if (userText.toLowerCase().includes('emergency') || userText.toLowerCase().includes('ambulance')) {
        reply = '🚨 If this is an emergency, please use our 1-click Emergency Support tab or call 108 directly. Ambulances in Adyar and Greams Road have active GPS response times under 7 minutes.'
      } else if (userText.toLowerCase().includes('insurance') || userText.toLowerCase().includes('cashless')) {
        reply = 'Your Star Health policy #SH-884920 is verified for direct cashless admission at Apollo, MIOT, Kauvery, and Fortis Malar.'
      } else if (userText.toLowerCase().includes('appointment') || userText.toLowerCase().includes('book')) {
        reply = 'You can book priority OPD or video consultations from the "Appointment / Requests" or "Find a Hospital" tab. Tokens are confirmed in real time.'
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: 'ai',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    }, 600)
  }

  const quickPrompts = [
    'How do I find open ICU beds?',
    'Is cashless insurance covered at Apollo?',
    'Request 108 emergency ambulance',
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-xs" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-dialog-title"
        className="flex h-[82vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-primary/5 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <Bot className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 id="support-dialog-title" className="font-bold text-foreground">
                  Swasthya AI Care Concierge
                </h2>
                <span className="flex size-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="size-3 text-primary" /> 24/7 Verified Medical Resource Guidance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close support modal"
            className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Bot className="size-4" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-primary text-primary-foreground font-medium rounded-tr-none'
                    : 'bg-muted/70 text-foreground border border-border/70 rounded-tl-none'
                }`}
              >
                <p>{m.text}</p>
                <span
                  className={`mt-1 block text-[10px] ${
                    m.sender === 'user' ? 'text-primary-foreground/75 text-right' : 'text-muted-foreground'
                  }`}
                >
                  {m.time}
                </span>
              </div>
              {m.sender === 'user' && (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
                  AK
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="border-t border-border/50 bg-card px-4 pt-2">
          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setInput(q)}
                className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form & Hotline */}
        <div className="border-t border-border bg-card p-4">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about doctors, beds, ambulance, or insurance..."
              className="flex-1 rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs sm:text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="size-4" />
            </button>
          </form>

          <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <PhoneCall className="size-3 text-destructive" /> Emergency Triage Toll-Free:{' '}
              <strong className="text-foreground font-semibold">1800-425-1080</strong>
            </span>
            <span className="text-[10px]">Avg reply: Instant</span>
          </div>
        </div>
      </div>
    </div>
  )
}
