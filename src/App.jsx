import { useState, useEffect, useRef, useCallback } from "react"
import {
  Home, DollarSign, Flame, Users, Plus, X, Check, Trash2,
  Star, TrendingUp, TrendingDown, Send, Loader,
  ChevronDown, ChevronUp, Settings, Sparkles,
  Play, Gamepad2, Music, Dumbbell, Target
} from "lucide-react"

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE
// ─────────────────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'myall_v3'

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

function makeDefaultData(name, tabs, profile) {
  return {
    user: {
      name,
      tabs,
      profile,
      createdAt: new Date().toISOString(),
    },
    finances: {
      transactions: [],
      savings: [],
      budget: 0,
    },
    habits: [],
    goals: [],
    relations: [],
    dynamic: {},
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function nowISO() {
  return new Date().toISOString()
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function thisMonthStr() {
  return new Date().toISOString().slice(0, 7)
}

function daysSince(dateStr) {
  if (!dateStr) return 999
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000)
}

function fmtAmount(n) {
  return Math.abs(parseInt(n) || 0).toLocaleString('fr-FR')
}

function fmtDateShort(isoStr) {
  return new Date(isoStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 6)  return 'Bonne nuit'
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

function getTodayLabel() {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// DYNAMIC TABS CATALOGUE
// ─────────────────────────────────────────────────────────────────────────────
const DYN_TABS = {
  anime: {
    id: 'anime',
    label: 'Animés',
    Icon: Play,
    color: '#e879f9',
    dimColor: 'rgba(232,121,249,0.12)',
    keywords: ['animé', 'anime', 'manga', 'one piece', 'naruto', 'demon slayer', 'jujutsu'],
  },
  gaming: {
    id: 'gaming',
    label: 'Gaming',
    Icon: Gamepad2,
    color: '#38bdf8',
    dimColor: 'rgba(56,189,248,0.12)',
    keywords: ['jeu', 'pubg', 'gaming', 'fps', 'free fire', 'cod', 'fortnite', 'jeux vidéo', 'jeux video'],
  },
  musique: {
    id: 'musique',
    label: 'Musique',
    Icon: Music,
    color: '#fb7185',
    dimColor: 'rgba(251,113,133,0.12)',
    keywords: ['musique', 'music', 'playlist', 'artiste', 'rap', 'afrobeat', 'concert', 'spotify'],
  },
  sport: {
    id: 'sport',
    label: 'Sport',
    Icon: Dumbbell,
    color: '#4ade80',
    dimColor: 'rgba(74,222,128,0.12)',
    keywords: ['sport', 'fitness', 'gym', 'musculation', 'football', 'courir', 'entraînement', 'entrainement'],
  },
}

function detectDynamicTabs(answers) {
  const text = Object.values(answers).join(' ').toLowerCase()
  const detected = []
  for (const tab of Object.values(DYN_TABS)) {
    if (tab.keywords.some(kw => text.includes(kw))) {
      detected.push(tab.id)
    }
  }
  return detected.slice(0, 3)
}

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  bg:         '#07090f',
  surface:    'rgba(255,255,255,0.04)',
  border:     'rgba(255,255,255,0.08)',
  gold:       '#d4a853',
  goldDim:    'rgba(212,168,83,0.12)',
  blue:       '#4a9af4',
  blueDim:    'rgba(74,154,244,0.1)',
  green:      '#4ade80',
  greenDim:   'rgba(74,222,128,0.1)',
  red:        '#f87171',
  redDim:     'rgba(248,113,113,0.1)',
  orange:     '#fb923c',
  text:       '#f0ece4',
  textMid:    '#a09c96',
  textDim:    '#575350',
}

const cardStyle = {
  background:   C.surface,
  border:       `1px solid ${C.border}`,
  borderRadius: '18px',
  padding:      '16px',
}

const inputStyle = {
  background:  'rgba(255,255,255,0.05)',
  border:      `1px solid ${C.border}`,
  borderRadius:'12px',
  color:       C.text,
  outline:     'none',
  fontFamily:  'DM Sans, sans-serif',
}

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-tap-highlight-color: transparent;
  }

  body {
    background: #07090f;
    color: #f0ece4;
    font-family: 'DM Sans', sans-serif;
  }

  .serif {
    font-family: 'Cormorant Garamond', Georgia, serif;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

  input[type=range] { accent-color: #d4a853; width: 100%; cursor: pointer; }
  select option { background: #0f1521; }
`

// ─────────────────────────────────────────────────────────────────────────────
// AI
// ─────────────────────────────────────────────────────────────────────────────
function buildSystemPrompt(data) {
  const { user, finances, habits, goals, relations, dynamic } = data
  const m = thisMonthStr()

  const monthTx   = (finances.transactions || []).filter(t => t.date.startsWith(m))
  const totalDep  = monthTx.filter(t => t.type === 'out').reduce((s, t) => s + t.amount, 0)
  const totalRev  = monthTx.filter(t => t.type === 'in').reduce((s, t) => s + t.amount, 0)

  const doneHabits = (habits || []).filter(h => h.lastDone === todayStr())
  const overdueRel = (relations || []).filter(r => daysSince(r.lastContact) > (r.reminderDays || 30))

  const dynLines = []
  if (dynamic.anime?.list?.length) {
    const watching = dynamic.anime.list.filter(a => a.status === 'watching').length
    dynLines.push(`Animés: ${watching} en cours, ${dynamic.anime.list.filter(a => a.status === 'done').length} terminés`)
  }
  if (dynamic.gaming?.sessions?.length) {
    const wins = dynamic.gaming.sessions.filter(s => s.result === 'win').length
    dynLines.push(`Gaming: ${dynamic.gaming.sessions.length} sessions, ${wins} victoires`)
  }
  if (dynamic.sport?.sessions?.length) {
    const weekSess = dynamic.sport.sessions.filter(s => daysSince(s.date) < 7).length
    dynLines.push(`Sport: ${weekSess} séance(s) cette semaine`)
  }

  return `Tu es l'assistant personnel exclusif de ${user.name}. Tu parles uniquement français. Tu es chaleureux, direct, comme un ami proche qui te connaît vraiment. Sois concis (2-4 phrases max sauf si l'utilisateur demande plus).

━ PROFIL DE ${user.name}
  Passions: ${(user.tabs || []).map(id => DYN_TABS[id]?.label || id).join(', ') || 'non renseignées'}
  Objectif principal: ${user.profile?.goal || 'non renseigné'}
  Défi actuel: ${user.profile?.challenge || 'non renseigné'}

━ FINANCES (${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })})
  Revenus: ${fmtAmount(totalRev)} FCFA | Dépenses: ${fmtAmount(totalDep)} FCFA${finances.budget ? ` | Budget: ${fmtAmount(finances.budget)} FCFA (${Math.round(totalDep / finances.budget * 100)}% utilisé)` : ''}

━ HABITUDES: ${doneHabits.length}/${habits.length} faites aujourd'hui
  ${habits.map(h => `${h.lastDone === todayStr() ? '✓' : '○'} ${h.label} — ${h.streak || 0}j streak`).join(' | ') || 'aucune'}

━ OBJECTIFS: ${goals.map(g => `${g.label} ${g.progress || 0}%`).join(', ') || 'aucun'}

━ RELATIONS: ${overdueRel.length} personne(s) à recontacter sur ${relations.length} total

${dynLines.length ? `━ LOISIRS: ${dynLines.join(' | ')}` : ''}

Quand tu vois quelque chose d'important (budget dépassé, habitude abandonnée, ami négligé), dis-le spontanément avec bienveillance.`
}

async function sendToAI(messages, data) {
  const response = await fetch('/.netlify/functions/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system:   buildSystemPrompt(data),
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || `Erreur ${response.status}`)
  }

  const result = await response.json()

  if (result.error) {
    throw new Error(result.error.message || 'Erreur API')
  }

  return result.content?.[0]?.text || "Je n'ai pas pu répondre."
}

// ─────────────────────────────────────────────────────────────────────────────
// UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function Button({ children, onClick, variant = 'primary', small = false, full = false, disabled = false, style: extraStyle = {} }) {
  const base = {
    display:        'inline-flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '6px',
    borderRadius:   '12px',
    fontFamily:     'DM Sans, sans-serif',
    fontWeight:     600,
    cursor:         disabled ? 'not-allowed' : 'pointer',
    border:         'none',
    opacity:        disabled ? 0.4 : 1,
    transition:     'opacity 0.15s',
    width:          full ? '100%' : 'auto',
    padding:        small ? '8px 14px' : '12px 20px',
    fontSize:       small ? '12px' : '14px',
  }

  const variants = {
    primary: { background: `linear-gradient(135deg, ${C.gold}, #b8893a)`, color: '#0a0800' },
    ghost:   { background: C.surface, color: C.text, border: `1px solid ${C.border}` },
    danger:  { background: C.redDim,  color: C.red,  border: '1px solid rgba(248,113,113,0.25)' },
    success: { background: C.greenDim,color: C.green,border: '1px solid rgba(74,222,128,0.25)' },
    gold:    { background: C.goldDim, color: C.gold, border: 'rgba(212,168,83,0.25)' },
  }

  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...variants[variant], ...extraStyle }}
    >
      {children}
    </button>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder, rows, autoFocus }) {
  const st = {
    ...inputStyle,
    padding:  '12px 14px',
    fontSize: '14px',
    width:    '100%',
    display:  'block',
  }

  const labelEl = label ? (
    <label style={{ color: C.textMid, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '7px' }}>
      {label}
    </label>
  ) : null

  return (
    <div>
      {labelEl}
      {rows
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ ...st, resize: 'vertical' }} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus} style={st} />
      }
    </div>
  )
}

function BottomSheet({ title, subtitle, onClose, children }) {
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(6px)' }}
    >
      <div style={{ background: '#0f1521', border: `1px solid ${C.border}`, borderRadius: '24px 24px 0 0', padding: '24px 20px', width: '100%', maxWidth: '480px', maxHeight: '88vh', overflowY: 'auto', animation: 'fadeUp 0.22s ease' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h3 className="serif" style={{ fontSize: '24px', fontWeight: 600, lineHeight: 1 }}>{title}</h3>
            {subtitle && <p style={{ color: C.textMid, fontSize: '13px', marginTop: '4px' }}>{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            style={{ background: C.surface, border: 'none', color: C.textMid, cursor: 'pointer', borderRadius: '10px', padding: '8px', flexShrink: 0, marginLeft: '12px' }}
          >
            <X size={15} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function Chip({ label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding:     '7px 14px',
        borderRadius:'999px',
        fontSize:    '12px',
        cursor:      'pointer',
        fontFamily:  'DM Sans, sans-serif',
        fontWeight:  selected ? 600 : 400,
        background:  selected ? C.goldDim : C.surface,
        color:       selected ? C.gold : C.textMid,
        border:      `1px solid ${selected ? 'rgba(212,168,83,0.4)' : C.border}`,
        transition:  'all 0.15s',
      }}
    >
      {label}
    </button>
  )
}

function SectionLabel({ children }) {
  return (
    <label style={{ color: C.textMid, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
      {children}
    </label>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ONBOARDING
// ─────────────────────────────────────────────────────────────────────────────

const OB_QUESTIONS = [
  {
    id:      'passions',
    title:   "Qu'est-ce qui te passionne ?",
    hint:    'Choisis tout ce qui te correspond',
    type:    'multi',
    options: [
      { label: '🎌 Animés / Manga',  value: 'animé anime manga' },
      { label: '🎮 Jeux vidéo',      value: 'gaming pubg jeu jeux vidéo' },
      { label: '🎵 Musique',         value: 'musique playlist artiste' },
      { label: '💪 Sport / Fitness', value: 'sport fitness gym entraînement' },
      { label: '📚 Lecture',         value: 'lecture livre' },
      { label: '✈️ Voyages',         value: 'voyage' },
    ],
  },
  {
    id:          'goal',
    title:       'Ton grand objectif en ce moment ?',
    hint:        'Ce que tu veux vraiment accomplir',
    type:        'text',
    placeholder: 'Ex: économiser pour un projet, progresser au gaming…',
  },
  {
    id:          'challenge',
    title:       'Ton plus grand défi du moment ?',
    hint:        'Ce qui te freine ou te préoccupe',
    type:        'text',
    placeholder: 'Ex: gérer mon argent, être régulier, trouver du temps…',
  },
]

function Onboarding({ onComplete }) {
  const [step,     setStep]     = useState(0)  // 0=splash, 1=name, 2+= questions
  const [name,     setName]     = useState('')
  const [answers,  setAnswers]  = useState({})
  const [selected, setSelected] = useState([]) // for multi questions

  const totalSteps = 1 + OB_QUESTIONS.length  // name + questions

  function handleNext() {
    if (step === 0) {
      setStep(1)
      return
    }

    if (step === 1) {
      if (!name.trim()) return
      setStep(2)
      return
    }

    // step >= 2 → question step
    const qIndex = step - 2
    const q = OB_QUESTIONS[qIndex]

    if (q.type === 'multi' && selected.length === 0) return
    if (q.type === 'text' && !answers[q.id]?.trim()) return

    const newAnswers = { ...answers }
    if (q.type === 'multi') {
      newAnswers[q.id] = selected.join(' ')
    }
    setAnswers(newAnswers)
    setSelected([])

    const isLast = qIndex === OB_QUESTIONS.length - 1

    if (isLast) {
      const tabs    = detectDynamicTabs(newAnswers)
      const profile = { goal: newAnswers.goal || '', challenge: newAnswers.challenge || '' }
      onComplete(name.trim(), tabs, profile)
    } else {
      setStep(step + 1)
    }
  }

  function toggleOption(val) {
    setSelected(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    )
  }

  function canContinue() {
    if (step === 0) return true
    if (step === 1) return name.trim().length > 0
    const q = OB_QUESTIONS[step - 2]
    if (q.type === 'multi') return selected.length > 0
    return (answers[q.id] || '').trim().length > 0
  }

  // ── SPLASH ──
  if (step === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 28px', background: C.bg, textAlign: 'center' }}>
        <div style={{ maxWidth: '300px', animation: 'fadeUp 0.7s ease' }}>
          <div className="serif" style={{ fontSize: '80px', color: C.gold, lineHeight: 0.85, marginBottom: '24px', fontWeight: 600 }}>
            My<br />All
          </div>
          <p style={{ color: C.textMid, fontSize: '15px', lineHeight: 1.8, marginBottom: '40px' }}>
            Ton espace de vie personnel.<br />
            Une IA qui te connaît vraiment.
          </p>
          <Button onClick={handleNext} full>Commencer →</Button>
        </div>
      </div>
    )
  }

  // ── PROGRESS BAR ──
  const progress = step === 1 ? 1 / (totalSteps + 1) : (step - 1) / totalSteps
  const progressBar = (
    <div style={{ height: '3px', background: 'rgba(255,255,255,0.07)', borderRadius: '999px', marginBottom: '28px', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${progress * 100}%`, background: `linear-gradient(90deg, ${C.gold}, #b8893a)`, borderRadius: '999px', transition: 'width 0.4s ease' }} />
    </div>
  )

  // ── NAME ──
  if (step === 1) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 28px', background: C.bg }}>
        <div style={{ maxWidth: '340px', width: '100%', animation: 'fadeUp 0.35s ease' }}>
          <p style={{ color: C.textDim, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
            Étape 1 / {totalSteps}
          </p>
          {progressBar}
          <h2 className="serif" style={{ fontSize: '38px', marginBottom: '8px', lineHeight: 1.1 }}>
            Comment tu t'appelles ?
          </h2>
          <p style={{ color: C.textMid, fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
            Ton IA personnelle s'adressera à toi par ce prénom.
          </p>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ton prénom…"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter' && name.trim()) handleNext() }}
            style={{ ...inputStyle, padding: '16px 18px', fontSize: '20px', width: '100%', marginBottom: '16px' }}
          />
          <Button onClick={handleNext} full disabled={!name.trim()}>
            <Sparkles size={15} /> Continuer
          </Button>
        </div>
      </div>
    )
  }

  // ── QUESTION ──
  const qIndex = step - 2
  const q = OB_QUESTIONS[qIndex]
  const isLastQ = qIndex === OB_QUESTIONS.length - 1

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 28px', background: C.bg }}>
      <div style={{ maxWidth: '380px', width: '100%', animation: 'fadeUp 0.35s ease' }}>
        <p style={{ color: C.textDim, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
          Étape {step} / {totalSteps}
        </p>
        {progressBar}
        <h2 className="serif" style={{ fontSize: '32px', marginBottom: '6px', lineHeight: 1.15 }}>
          {q.title}
        </h2>
        <p style={{ color: C.textMid, fontSize: '13px', marginBottom: '22px' }}>
          {q.hint}
        </p>

        {q.type === 'multi' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '28px' }}>
            {q.options.map(opt => (
              <button
                key={opt.value}
                onClick={() => toggleOption(opt.value)}
                style={{
                  padding:    '10px 16px',
                  borderRadius:'14px',
                  fontSize:   '14px',
                  cursor:     'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: selected.includes(opt.value) ? 600 : 400,
                  background: selected.includes(opt.value) ? C.goldDim : C.surface,
                  color:      selected.includes(opt.value) ? C.gold : C.textMid,
                  border:     `1px solid ${selected.includes(opt.value) ? 'rgba(212,168,83,0.4)' : C.border}`,
                  transition: 'all 0.15s',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {q.type === 'text' && (
          <textarea
            value={answers[q.id] || ''}
            onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
            placeholder={q.placeholder}
            rows={3}
            style={{ ...inputStyle, padding: '14px', fontSize: '14px', width: '100%', resize: 'none', marginBottom: '20px' }}
          />
        )}

        <Button onClick={handleNext} full disabled={!canContinue()}>
          {isLastQ ? 'Créer mon espace ✦' : 'Continuer →'}
        </Button>

        {step > 2 && (
          <button
            onClick={() => setStep(step - 1)}
            style={{ background: 'none', border: 'none', color: C.textDim, fontSize: '13px', cursor: 'pointer', marginTop: '14px', display: 'block', textAlign: 'center', width: '100%' }}
          >
            ← Retour
          </button>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HOME TAB
// ─────────────────────────────────────────────────────────────────────────────

function HomeTab({ data, update }) {
  const [messages, setMessages] = useState([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const chatEndRef = useRef(null)
  const inputRef   = useRef(null)

  const { user, finances, habits, goals, relations } = data
  const m        = thisMonthStr()
  const totalDep = (finances.transactions || []).filter(t => t.date.startsWith(m) && t.type === 'out').reduce((s, t) => s + t.amount, 0)
  const doneN    = (habits || []).filter(h => h.lastDone === todayStr()).length
  const overdueN = (relations || []).filter(r => daysSince(r.lastContact) > (r.reminderDays || 30)).length

  async function handleSend(preset) {
    const text = (preset || input).trim()
    if (!text || loading) return

    const newMessages = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const reply = await sendToAI(newMessages, data)
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Erreur : ${e.message}` }])
    }

    setLoading(false)
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  function openWithPreset(text) {
    setChatOpen(true)
    setTimeout(() => handleSend(text), 200)
  }

  const firstDynLabel = (user.tabs || []).map(id => DYN_TABS[id]?.label).filter(Boolean)[0]

  const quickPrompts = [
    'Fais-moi un bilan rapide de ma situation',
    "Qu'est-ce que je devrais améliorer en ce moment ?",
    'Donne-moi un conseil pour cette semaine',
    firstDynLabel
      ? `Comment je gère mes ${firstDynLabel} cette semaine ?`
      : 'Qu\'est-ce qui me freine en ce moment ?',
  ]

  const stats = [
    {
      value: `${doneN}/${habits.length}`,
      label: 'habitudes',
      sub:   "aujourd'hui",
      color: doneN === habits.length && habits.length > 0 ? C.green : C.text,
    },
    {
      value: fmtAmount(totalDep),
      label: 'dépensé',
      sub:   'ce mois',
      color: finances.budget > 0 && totalDep > finances.budget ? C.red : C.gold,
    },
    {
      value: overdueN,
      label: 'à rappeler',
      sub:   'contacts',
      color: overdueN > 0 ? C.red : C.textDim,
    },
  ]

  return (
    <div style={{ padding: '20px', paddingBottom: '90px', maxWidth: '480px', margin: '0 auto' }}>

      {/* Greeting */}
      <div style={{ marginBottom: '22px', animation: 'fadeUp 0.4s ease' }}>
        <p style={{ color: C.textDim, fontSize: '13px' }}>{getGreeting()},</p>
        <h1 className="serif" style={{ fontSize: '52px', fontWeight: 600, lineHeight: 0.9, marginBottom: '4px' }}>
          {user.name}
        </h1>
        <p style={{ color: C.textDim, fontSize: '12px' }}>{getTodayLabel()}</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '18px' }}>
        {stats.map(s => (
          <div key={s.label} style={{ ...cardStyle, padding: '12px', textAlign: 'center' }}>
            <div className="serif" style={{ fontSize: '22px', fontWeight: 600, color: s.color, lineHeight: 1 }}>
              {s.value}
            </div>
            <p style={{ fontSize: '10px', color: C.textDim, marginTop: '3px', lineHeight: 1.4 }}>
              {s.sub}<br />{s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Chat */}
      {!chatOpen ? (
        <div>
          {/* Open button */}
          <button
            onClick={() => { setChatOpen(true); setTimeout(() => inputRef.current?.focus(), 200) }}
            style={{ width: '100%', padding: '16px 18px', borderRadius: '20px', background: `linear-gradient(135deg, rgba(212,168,83,0.1), rgba(74,154,244,0.06))`, border: `1px solid rgba(212,168,83,0.22)`, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '13px', marginBottom: '10px' }}
          >
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: C.goldDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles size={16} style={{ color: C.gold }} />
            </div>
            <div>
              <p style={{ color: C.text, fontSize: '14px', fontWeight: 600 }}>Parler à mon IA</p>
              <p style={{ color: C.textMid, fontSize: '12px', marginTop: '1px' }}>Elle connaît tout ton univers</p>
            </div>
          </button>

          {/* Quick prompts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {quickPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => openWithPreset(p)}
                style={{ ...cardStyle, padding: '12px 15px', textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: C.textMid }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          {/* Chat header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: C.goldDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={12} style={{ color: C.gold }} />
              </div>
              <span className="serif" style={{ fontSize: '20px' }}>Mon IA</span>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              style={{ background: C.surface, border: 'none', color: C.textMid, cursor: 'pointer', borderRadius: '8px', padding: '6px' }}
            >
              <X size={13} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ height: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>
            {messages.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
                <div className="serif" style={{ fontSize: '44px', color: C.gold, opacity: 0.3, marginBottom: '10px' }}>✦</div>
                <p style={{ color: C.textMid, fontSize: '14px' }}>Parle-moi librement.</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth:    '85%',
                  padding:     '11px 15px',
                  lineHeight:  1.65,
                  fontSize:    '14px',
                  borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background:  m.role === 'user' ? `linear-gradient(135deg, ${C.gold}, #b8893a)` : C.surface,
                  color:       m.role === 'user' ? '#0a0800' : C.text,
                  border:      m.role === 'user' ? 'none' : `1px solid ${C.border}`,
                  whiteSpace:  'pre-wrap',
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '13px 16px', borderRadius: '18px 18px 18px 4px', background: C.surface, border: `1px solid ${C.border}` }}>
                  <Loader size={13} style={{ color: C.gold, animation: 'spin 0.9s linear infinite' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !loading) handleSend() }}
              placeholder="Écris ta question…"
              style={{ ...inputStyle, padding: '12px 15px', fontSize: '14px', flex: 1 }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              style={{
                background:   input.trim() && !loading ? `linear-gradient(135deg, ${C.gold}, #b8893a)` : C.surface,
                border:       `1px solid ${input.trim() && !loading ? 'transparent' : C.border}`,
                borderRadius: '12px',
                padding:      '0 15px',
                cursor:       input.trim() && !loading ? 'pointer' : 'default',
                color:        input.trim() && !loading ? '#0a0800' : C.textDim,
              }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FINANCES TAB
// ─────────────────────────────────────────────────────────────────────────────

const FIN_CATEGORIES = ['Alimentation', 'Transport', 'Logement', 'Santé', 'Loisirs', 'Famille', 'Épargne', 'Autre']

function FinancesTab({ data, update }) {
  const [modal, setModal] = useState(null)
  const [form,  setForm]  = useState({})

  const txs    = data.finances?.transactions || []
  const savings= data.finances?.savings      || []
  const budget = data.finances?.budget       || 0
  const m      = thisMonthStr()
  const mTxs   = txs.filter(t => t.date.startsWith(m))
  const totalIn  = mTxs.filter(t => t.type === 'in').reduce((s, t) => s + t.amount, 0)
  const totalOut = mTxs.filter(t => t.type === 'out').reduce((s, t) => s + t.amount, 0)
  const budgetPct = budget > 0 ? Math.min(100, Math.round(totalOut / budget * 100)) : 0
  const overBudget = budget > 0 && totalOut > budget

  function addTransaction() {
    if (!form.amount || !form.label) return
    const tx = {
      id:       uid(),
      label:    form.label,
      amount:   parseInt(form.amount) || 0,
      type:     form.type || 'out',
      category: form.category || 'Autre',
      date:     nowISO(),
    }
    update(d => ({ ...d, finances: { ...d.finances, transactions: [tx, ...(d.finances.transactions || [])] } }))
    setModal(null)
    setForm({})
  }

  function addSaving() {
    if (!form.label || !form.target) return
    const sv = { id: uid(), label: form.label, target: parseInt(form.target) || 0, current: 0 }
    update(d => ({ ...d, finances: { ...d.finances, savings: [...(d.finances.savings || []), sv] } }))
    setModal(null)
    setForm({})
  }

  function updateSavingCurrent(id, val) {
    update(d => ({ ...d, finances: { ...d.finances, savings: d.finances.savings.map(s => s.id === id ? { ...s, current: parseInt(val) || 0 } : s) } }))
  }

  function deleteTx(id) {
    update(d => ({ ...d, finances: { ...d.finances, transactions: d.finances.transactions.filter(t => t.id !== id) } }))
  }

  function deleteSaving(id) {
    update(d => ({ ...d, finances: { ...d.finances, savings: d.finances.savings.filter(s => s.id !== id) } }))
  }

  function setBudget() {
    update(d => ({ ...d, finances: { ...d.finances, budget: parseInt(form.budget) || 0 } }))
    setModal(null)
    setForm({})
  }

  return (
    <div style={{ padding: '16px', paddingBottom: '90px', maxWidth: '480px', margin: '0 auto' }}>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
        <div style={{ ...cardStyle, background: C.greenDim, border: '1px solid rgba(74,222,128,0.15)' }}>
          <p style={{ color: C.textDim, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Revenus</p>
          <p className="serif" style={{ fontSize: '26px', color: C.green, fontWeight: 600, lineHeight: 1 }}>{fmtAmount(totalIn)}</p>
          <p style={{ color: C.textDim, fontSize: '11px', marginTop: '2px' }}>ce mois</p>
        </div>
        <div style={{ ...cardStyle, background: overBudget ? C.redDim : C.surface, border: `1px solid ${overBudget ? 'rgba(248,113,113,0.2)' : C.border}` }}>
          <p style={{ color: C.textDim, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Dépenses</p>
          <p className="serif" style={{ fontSize: '26px', color: overBudget ? C.red : C.text, fontWeight: 600, lineHeight: 1 }}>{fmtAmount(totalOut)}</p>
          <p style={{ color: C.textDim, fontSize: '11px', marginTop: '2px' }}>
            {budget > 0 ? `/ ${fmtAmount(budget)} budget` : 'ce mois'}
          </p>
        </div>
      </div>

      {/* Budget bar */}
      {budget > 0 && (
        <div style={{ ...cardStyle, marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
            <span style={{ fontSize: '13px', color: C.textMid }}>Budget mensuel</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: budgetPct > 90 ? C.red : budgetPct > 70 ? C.orange : C.green }}>
              {budgetPct}%
            </span>
          </div>
          <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${budgetPct}%`, background: budgetPct > 90 ? C.red : budgetPct > 70 ? C.orange : C.green, borderRadius: '999px', transition: 'width 0.5s ease' }} />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <Button variant="danger"  small onClick={() => { setForm({ type: 'out', category: 'Autre' }); setModal('tx') }}>
          <Plus size={12} /> Dépense
        </Button>
        <Button variant="success" small onClick={() => { setForm({ type: 'in' }); setModal('tx') }}>
          <Plus size={12} /> Revenu
        </Button>
        <Button variant="gold"    small onClick={() => { setForm({}); setModal('saving') }}>
          <Plus size={12} /> Épargne
        </Button>
        <Button variant="ghost"   small onClick={() => { setForm({ budget }); setModal('budget') }}>
          <Settings size={11} /> Budget
        </Button>
      </div>

      {/* Savings */}
      {savings.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <h3 className="serif" style={{ fontSize: '22px', marginBottom: '10px' }}>Objectifs épargne</h3>
          {savings.map(sv => {
            const pct = sv.target > 0 ? Math.min(100, Math.round(sv.current / sv.target * 100)) : 0
            return (
              <div key={sv.id} style={{ ...cardStyle, marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{sv.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <span className="serif" style={{ fontSize: '18px', color: C.gold }}>{pct}%</span>
                    <button onClick={() => deleteSaving(sv.id)} style={{ background: 'none', border: 'none', color: C.textDim, cursor: 'pointer' }}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${C.gold}, #b8893a)`, borderRadius: '999px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    value={sv.current}
                    onChange={e => updateSavingCurrent(sv.id, e.target.value)}
                    style={{ ...inputStyle, padding: '6px 10px', fontSize: '13px', width: '110px' }}
                  />
                  <span style={{ color: C.textDim, fontSize: '12px' }}>/ {fmtAmount(sv.target)} FCFA</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Transactions */}
      <h3 className="serif" style={{ fontSize: '22px', marginBottom: '10px' }}>Transactions</h3>
      {txs.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '34px' }}>
          <p style={{ color: C.textDim, fontSize: '13px' }}>Aucune transaction pour l'instant.</p>
        </div>
      ) : (
        txs.slice(0, 30).map(tx => (
          <div key={tx.id} style={{ ...cardStyle, padding: '11px 14px', marginBottom: '7px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: tx.type === 'in' ? C.greenDim : C.redDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {tx.type === 'in'
                ? <TrendingUp   size={13} style={{ color: C.green }} />
                : <TrendingDown size={13} style={{ color: C.red   }} />
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.label}</p>
              <p style={{ fontSize: '11px', color: C.textDim }}>{tx.category} · {fmtDateShort(tx.date)}</p>
            </div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: tx.type === 'in' ? C.green : C.red, flexShrink: 0 }}>
              {tx.type === 'in' ? '+' : '-'}{fmtAmount(tx.amount)}
            </p>
            <button onClick={() => deleteTx(tx.id)} style={{ background: 'none', border: 'none', color: C.textDim, cursor: 'pointer', flexShrink: 0 }}>
              <Trash2 size={11} />
            </button>
          </div>
        ))
      )}

      {/* Modals */}
      {modal === 'tx' && (
        <BottomSheet title={form.type === 'in' ? 'Ajouter un revenu' : 'Ajouter une dépense'} onClose={() => setModal(null)}>
          <Field label="Description" value={form.label || ''} onChange={v => setForm(f => ({ ...f, label: v }))} placeholder="Ex: Courses, Salaire…" />
          <Field label="Montant (FCFA)" type="number" value={form.amount || ''} onChange={v => setForm(f => ({ ...f, amount: v }))} placeholder="0" />
          {form.type === 'out' && (
            <div>
              <SectionLabel>Catégorie</SectionLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                {FIN_CATEGORIES.map(c => <Chip key={c} label={c} selected={form.category === c} onClick={() => setForm(f => ({ ...f, category: c }))} />)}
              </div>
            </div>
          )}
          <Button onClick={addTransaction} full disabled={!form.amount || !form.label}>Enregistrer</Button>
        </BottomSheet>
      )}
      {modal === 'saving' && (
        <BottomSheet title="Objectif d'épargne" onClose={() => setModal(null)}>
          <Field label="Nom" value={form.label || ''} onChange={v => setForm(f => ({ ...f, label: v }))} placeholder="Ex: Voyage, Téléphone…" />
          <Field label="Montant cible (FCFA)" type="number" value={form.target || ''} onChange={v => setForm(f => ({ ...f, target: v }))} placeholder="0" />
          <Button onClick={addSaving} full disabled={!form.label || !form.target}>Créer</Button>
        </BottomSheet>
      )}
      {modal === 'budget' && (
        <BottomSheet title="Budget mensuel" onClose={() => setModal(null)}>
          <Field label="Plafond (FCFA)" type="number" value={form.budget !== undefined ? form.budget : budget} onChange={v => setForm(f => ({ ...f, budget: v }))} placeholder="150 000" />
          <Button onClick={setBudget} full>Définir</Button>
        </BottomSheet>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HABITS TAB
// ─────────────────────────────────────────────────────────────────────────────

function HabitsTab({ data, update }) {
  const [modal, setModal] = useState(null)
  const [form,  setForm]  = useState({})

  const habits = data.habits || []
  const goals  = data.goals  || []
  const doneN  = habits.filter(h => h.lastDone === todayStr()).length

  function addItem() {
    if (!form.label) return
    if (form.kind === 'goal') {
      const goal = { id: uid(), label: form.label, notes: form.notes || '', progress: 0, createdAt: nowISO() }
      update(d => ({ ...d, goals: [...(d.goals || []), goal] }))
    } else {
      const habit = { id: uid(), label: form.label, streak: 0, lastDone: null, createdAt: nowISO() }
      update(d => ({ ...d, habits: [...(d.habits || []), habit] }))
    }
    setModal(null)
    setForm({})
  }

  function toggleHabit(id) {
    update(d => ({
      ...d,
      habits: d.habits.map(h => {
        if (h.id !== id) return h
        const wasDone = h.lastDone === todayStr()
        const streak  = wasDone
          ? Math.max(0, (h.streak || 0) - 1)
          : daysSince(h.lastDone) <= 1
            ? (h.streak || 0) + 1
            : 1
        return { ...h, lastDone: wasDone ? null : todayStr(), streak }
      }),
    }))
  }

  function setGoalProgress(id, val) {
    update(d => ({
      ...d,
      goals: d.goals.map(g => g.id === id ? { ...g, progress: Math.min(100, Math.max(0, parseInt(val) || 0)) } : g),
    }))
  }

  function deleteHabit(id) { update(d => ({ ...d, habits: d.habits.filter(h => h.id !== id) })) }
  function deleteGoal(id)  { update(d => ({ ...d, goals:  d.goals.filter(g => g.id !== id) })) }

  return (
    <div style={{ padding: '16px', paddingBottom: '90px', maxWidth: '480px', margin: '0 auto' }}>

      {/* Habits section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <h2 className="serif" style={{ fontSize: '28px', lineHeight: 1 }}>Habitudes</h2>
          {habits.length > 0 && (
            <p style={{ color: C.textDim, fontSize: '12px', marginTop: '2px' }}>{doneN} / {habits.length} aujourd'hui</p>
          )}
        </div>
        <Button small onClick={() => { setForm({ kind: 'habit' }); setModal('add') }}>
          <Plus size={13} />
        </Button>
      </div>

      {habits.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '28px', marginBottom: '22px' }}>
          <Flame size={22} style={{ color: C.textDim, marginBottom: '8px' }} />
          <p style={{ color: C.textDim, fontSize: '13px' }}>Commence par une seule habitude.</p>
        </div>
      ) : (
        habits.map(h => {
          const done = h.lastDone === todayStr()
          return (
            <div key={h.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '11px', marginBottom: '7px', background: done ? 'rgba(74,222,128,0.04)' : C.surface, border: `1px solid ${done ? 'rgba(74,222,128,0.15)' : C.border}` }}>
              <button
                onClick={() => toggleHabit(h.id)}
                style={{ width: '32px', height: '32px', borderRadius: '10px', border: `2px solid ${done ? C.green : C.border}`, background: done ? C.greenDim : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}
              >
                {done && <Check size={14} style={{ color: C.green }} />}
              </button>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: 500, color: done ? C.textMid : C.text, textDecoration: done ? 'line-through' : 'none' }}>
                  {h.label}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                  <Flame size={10} style={{ color: h.streak > 0 ? C.orange : C.textDim }} />
                  <span style={{ fontSize: '11px', color: h.streak > 0 ? C.orange : C.textDim }}>{h.streak}j</span>
                </div>
              </div>
              <button onClick={() => deleteHabit(h.id)} style={{ background: 'none', border: 'none', color: C.textDim, cursor: 'pointer' }}>
                <Trash2 size={11} />
              </button>
            </div>
          )
        })
      )}

      {/* Goals section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', marginTop: '24px' }}>
        <h2 className="serif" style={{ fontSize: '28px' }}>Objectifs</h2>
        <Button small onClick={() => { setForm({ kind: 'goal' }); setModal('add') }}>
          <Plus size={13} />
        </Button>
      </div>

      {goals.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '28px' }}>
          <Target size={22} style={{ color: C.textDim, marginBottom: '8px' }} />
          <p style={{ color: C.textDim, fontSize: '13px' }}>Qu'est-ce que tu veux accomplir ?</p>
        </div>
      ) : (
        goals.map(g => (
          <div key={g.id} style={{ ...cardStyle, marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '7px' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: 500 }}>{g.label}</p>
                {g.notes && <p style={{ color: C.textDim, fontSize: '12px', marginTop: '2px' }}>{g.notes}</p>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '10px' }}>
                <span className="serif" style={{ fontSize: '20px', color: g.progress === 100 ? C.green : C.gold }}>
                  {g.progress}%
                </span>
                <button onClick={() => deleteGoal(g.id)} style={{ background: 'none', border: 'none', color: C.textDim, cursor: 'pointer' }}>
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden', marginBottom: '7px' }}>
              <div style={{ height: '100%', width: `${g.progress}%`, background: g.progress === 100 ? C.green : `linear-gradient(90deg, ${C.gold}, #b8893a)`, borderRadius: '999px', transition: 'width 0.4s ease' }} />
            </div>
            <input type="range" min={0} max={100} value={g.progress} onChange={e => setGoalProgress(g.id, e.target.value)} />
          </div>
        ))
      )}

      {/* Modal */}
      {modal === 'add' && (
        <BottomSheet title={form.kind === 'goal' ? 'Nouvel objectif' : 'Nouvelle habitude'} onClose={() => setModal(null)}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[['habit', 'Habitude'], ['goal', 'Objectif']].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setForm(f => ({ ...f, kind: k }))}
                style={{ flex: 1, padding: '10px', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, border: 'none', background: form.kind === k ? C.goldDim : C.surface, color: form.kind === k ? C.gold : C.textMid, fontFamily: 'DM Sans, sans-serif' }}
              >
                {l}
              </button>
            ))}
          </div>
          <Field
            label="Nom"
            value={form.label || ''}
            onChange={v => setForm(f => ({ ...f, label: v }))}
            placeholder={form.kind === 'goal' ? 'Ex: Apprendre le code…' : 'Ex: Méditer, Lire 20min…'}
          />
          {form.kind === 'goal' && (
            <Field label="Notes (optionnel)" value={form.notes || ''} onChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="Contexte, étapes…" />
          )}
          <Button onClick={addItem} full disabled={!form.label}>Créer</Button>
        </BottomSheet>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// RELATIONS TAB
// ─────────────────────────────────────────────────────────────────────────────

const REL_CATEGORIES = ['Famille', 'Ami·e', 'Collègue', 'Mentor', 'Partenaire', 'Réseau']

function RelationsTab({ data, update }) {
  const [modal,    setModal]    = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [form,     setForm]     = useState({})
  const [noteText, setNoteText] = useState('')

  const relations = data.relations || []
  const overdueRels = relations.filter(r => daysSince(r.lastContact) > (r.reminderDays || 30))

  function addRelation() {
    if (!form.name) return
    const rel = {
      id:           uid(),
      name:         form.name,
      category:     form.category || 'Ami·e',
      importance:   form.importance || 3,
      lastContact:  todayStr(),
      reminderDays: parseInt(form.reminderDays) || 30,
      notes:        form.notes || '',
    }
    update(d => ({ ...d, relations: [...(d.relations || []), rel] }))
    setModal(null)
    setForm({})
  }

  function markContacted(id) {
    update(d => ({ ...d, relations: d.relations.map(r => r.id === id ? { ...r, lastContact: todayStr() } : r) }))
  }

  function addNote(id) {
    if (!noteText.trim()) return
    update(d => ({
      ...d,
      relations: d.relations.map(r => {
        if (r.id !== id) return r
        const existing = r.notes || ''
        const newNotes = existing ? `${noteText.trim()}\n\n— ${existing}` : noteText.trim()
        return { ...r, notes: newNotes }
      }),
    }))
    setNoteText('')
  }

  function deleteRelation(id) {
    update(d => ({ ...d, relations: d.relations.filter(r => r.id !== id) }))
    setExpanded(null)
  }

  const sorted = [...relations].sort((a, b) =>
    (b.importance - a.importance) || (daysSince(a.lastContact) - daysSince(b.lastContact))
  )

  return (
    <div style={{ padding: '16px', paddingBottom: '90px', maxWidth: '480px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div>
          <h2 className="serif" style={{ fontSize: '28px', lineHeight: 1 }}>Relations</h2>
          {overdueRels.length > 0 && (
            <p style={{ color: C.red, fontSize: '12px', marginTop: '2px' }}>{overdueRels.length} à recontacter</p>
          )}
        </div>
        <Button small onClick={() => { setForm({ importance: 3 }); setModal('add') }}>
          <Plus size={13} /> Ajouter
        </Button>
      </div>

      {relations.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '36px' }}>
          <Users size={24} style={{ color: C.textDim, marginBottom: '10px' }} />
          <p style={{ color: C.textDim, fontSize: '13px' }}>Qui compte dans ta vie ?</p>
        </div>
      ) : (
        sorted.map(r => {
          const d      = daysSince(r.lastContact)
          const isOver = d > (r.reminderDays || 30)
          const isExp  = expanded === r.id

          return (
            <div key={r.id} style={{ ...cardStyle, marginBottom: '8px', border: `1px solid ${isOver ? 'rgba(248,113,113,0.2)' : C.border}`, background: isOver ? 'rgba(248,113,113,0.03)' : C.surface }}>
              {/* Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '11px', cursor: 'pointer' }} onClick={() => setExpanded(isExp ? null : r.id)}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: isOver ? C.redDim : C.blueDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="serif" style={{ fontSize: '20px', fontWeight: 600, color: isOver ? C.red : C.blue }}>
                    {r.name[0].toUpperCase()}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '2px' }}>
                    <p style={{ fontSize: '14px', fontWeight: 600 }}>{r.name}</p>
                    <span style={{ fontSize: '10px', color: C.textDim, background: C.surface, borderRadius: '999px', padding: '2px 7px', border: `1px solid ${C.border}` }}>
                      {r.category}
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: isOver ? C.red : C.textDim }}>
                    {d === 0 ? "Aujourd'hui" : `Il y a ${d}j`}
                    {isOver ? ' · ⚠️ À recontacter' : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', flexShrink: 0 }}>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} size={9} style={{ color: s <= r.importance ? C.gold : C.textDim, fill: s <= r.importance ? C.gold : 'none' }} />
                    ))}
                  </div>
                  {isExp ? <ChevronUp size={12} style={{ color: C.textDim }} /> : <ChevronDown size={12} style={{ color: C.textDim }} />}
                </div>
              </div>

              {/* Expanded */}
              {isExp && (
                <div style={{ marginTop: '13px', paddingTop: '12px', borderTop: `1px solid ${C.border}`, animation: 'fadeUp 0.2s ease' }}>
                  {r.notes && (
                    <p style={{ color: C.textMid, fontSize: '13px', marginBottom: '10px', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                      {r.notes}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '7px', marginBottom: '9px' }}>
                    <input
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      placeholder="Note rapide…"
                      onKeyDown={e => { if (e.key === 'Enter') addNote(r.id) }}
                      style={{ ...inputStyle, padding: '8px 11px', fontSize: '12px', flex: 1 }}
                    />
                    <button
                      onClick={() => addNote(r.id)}
                      style={{ background: C.goldDim, border: '1px solid rgba(212,168,83,0.2)', borderRadius: '10px', padding: '8px 11px', cursor: 'pointer', color: C.gold }}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '7px' }}>
                    <Button variant="success" small onClick={() => markContacted(r.id)}>
                      <Check size={11} /> Contacté
                    </Button>
                    <Button variant="danger" small onClick={() => deleteRelation(r.id)}>
                      <Trash2 size={11} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )
        })
      )}

      {modal === 'add' && (
        <BottomSheet title="Nouveau contact" onClose={() => setModal(null)}>
          <Field label="Prénom / Nom" value={form.name || ''} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Ex: Kofi, Aminata…" />
          <div>
            <SectionLabel>Relation</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              {REL_CATEGORIES.map(c => <Chip key={c} label={c} selected={form.category === c} onClick={() => setForm(f => ({ ...f, category: c }))} />)}
            </div>
          </div>
          <div>
            <SectionLabel>Importance</SectionLabel>
            <div style={{ display: 'flex', gap: '7px' }}>
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setForm(f => ({ ...f, importance: s }))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px' }}>
                  <Star size={22} style={{ color: s <= (form.importance || 3) ? C.gold : C.textDim, fill: s <= (form.importance || 3) ? C.gold : 'none', transition: 'all 0.15s' }} />
                </button>
              ))}
            </div>
          </div>
          <Field label="Rappel (jours)" type="number" value={form.reminderDays || '30'} onChange={v => setForm(f => ({ ...f, reminderDays: v }))} placeholder="30" />
          <Field label="Notes (optionnel)" value={form.notes || ''} onChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="Ce qui compte pour elle/lui…" />
          <Button onClick={addRelation} full disabled={!form.name}>Ajouter</Button>
        </BottomSheet>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DYNAMIC TABS
// ─────────────────────────────────────────────────────────────────────────────

// ── ANIMÉS ───────────────────────────────────────────────────────────────────
const ANIME_STATUSES = { watching: 'En cours', done: 'Terminé', plan: 'À regarder', dropped: 'Abandonné' }
const ANIME_STATUS_COLOR = { watching: C.blue, done: C.green, plan: C.textDim, dropped: C.red }

function AnimeTab({ data, update }) {
  const [modal, setModal] = useState(null)
  const [form,  setForm]  = useState({})

  const list = data.dynamic?.anime?.list || []

  function setAnime(val) { update(d => ({ ...d, dynamic: { ...d.dynamic, anime: { ...(d.dynamic?.anime || {}), ...val } } })) }

  function addAnime() {
    if (!form.title) return
    const item = { id: uid(), title: form.title, status: form.status || 'watching', episodes: parseInt(form.episodes) || 0, currentEp: 0, notes: form.notes || '' }
    setAnime({ list: [item, ...list] })
    setModal(null); setForm({})
  }

  function updateEpisode(id, val) {
    setAnime({ list: list.map(a => a.id === id ? { ...a, currentEp: parseInt(val) || 0 } : a) })
  }

  function updateStatus(id, status) {
    setAnime({ list: list.map(a => a.id === id ? { ...a, status } : a) })
  }

  function deleteAnime(id) { setAnime({ list: list.filter(a => a.id !== id) }) }

  return (
    <div style={{ padding: '16px', paddingBottom: '90px', maxWidth: '480px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <h2 className="serif" style={{ fontSize: '28px', lineHeight: 1 }}>Animés</h2>
          <p style={{ color: C.textDim, fontSize: '12px', marginTop: '2px' }}>
            {list.filter(a => a.status === 'watching').length} en cours · {list.filter(a => a.status === 'done').length} terminés
          </p>
        </div>
        <Button small onClick={() => { setForm({ status: 'watching' }); setModal('add') }}>
          <Plus size={13} /> Ajouter
        </Button>
      </div>

      {list.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '40px' }}>
          <Play size={24} style={{ color: C.textDim, marginBottom: '10px' }} />
          <p style={{ color: C.textDim, fontSize: '13px' }}>Ajoute tes animés en cours ou à regarder.</p>
        </div>
      ) : (
        list.map(a => {
          const pct = a.episodes > 0 ? Math.min(100, Math.round(a.currentEp / a.episodes * 100)) : 0
          return (
            <div key={a.id} style={{ ...cardStyle, marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <p style={{ fontSize: '14px', fontWeight: 600, flex: 1 }}>{a.title}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '10px' }}>
                  <select
                    value={a.status}
                    onChange={e => updateStatus(a.id, e.target.value)}
                    style={{ ...inputStyle, padding: '4px 8px', fontSize: '11px', color: ANIME_STATUS_COLOR[a.status] }}
                  >
                    {Object.entries(ANIME_STATUSES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <button onClick={() => deleteAnime(a.id)} style={{ background: 'none', border: 'none', color: C.textDim, cursor: 'pointer' }}>
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
              {a.status === 'watching' && (
                <>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden', marginBottom: '8px' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${C.blue}, #3b82f6)`, borderRadius: '999px' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: C.textDim, fontSize: '12px' }}>Épisode</span>
                    <input
                      type="number" value={a.currentEp}
                      onChange={e => updateEpisode(a.id, e.target.value)}
                      min={0} max={a.episodes || 9999}
                      style={{ ...inputStyle, padding: '5px 9px', fontSize: '13px', width: '62px', textAlign: 'center' }}
                    />
                    {a.episodes > 0 && <span style={{ color: C.textDim, fontSize: '12px' }}>/ {a.episodes}</span>}
                  </div>
                </>
              )}
              {a.notes && <p style={{ color: C.textDim, fontSize: '12px', marginTop: '6px' }}>{a.notes}</p>}
            </div>
          )
        })
      )}

      {modal === 'add' && (
        <BottomSheet title="Ajouter un animé" onClose={() => setModal(null)}>
          <Field label="Titre" value={form.title || ''} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="Ex: One Piece, Demon Slayer…" />
          <div>
            <SectionLabel>Statut</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              {Object.entries(ANIME_STATUSES).map(([v, l]) => (
                <Chip key={v} label={l} selected={form.status === v} onClick={() => setForm(f => ({ ...f, status: v }))} />
              ))}
            </div>
          </div>
          <Field label="Nb d'épisodes (optionnel)" type="number" value={form.episodes || ''} onChange={v => setForm(f => ({ ...f, episodes: v }))} placeholder="0 = inconnu" />
          <Field label="Notes" value={form.notes || ''} onChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="Avis, recommandé par…" />
          <Button onClick={addAnime} full disabled={!form.title}>Ajouter</Button>
        </BottomSheet>
      )}
    </div>
  )
}

// ── GAMING ────────────────────────────────────────────────────────────────────
function GamingTab({ data, update }) {
  const [modal, setModal] = useState(null)
  const [form,  setForm]  = useState({})

  const dd       = data.dynamic?.gaming || {}
  const sessions = dd.sessions || []
  const games    = dd.games    || []

  function setGaming(val) { update(d => ({ ...d, dynamic: { ...d.dynamic, gaming: { ...(d.dynamic?.gaming || {}), ...val } } })) }

  function addGame() {
    if (!form.gameName) return
    setGaming({ games: [...games, { id: uid(), name: form.gameName, platform: form.platform || 'Mobile' }] })
    setModal(null); setForm({})
  }

  function addSession() {
    if (!form.game) return
    const s = { id: uid(), game: form.game, duration: parseInt(form.duration) || 0, result: form.result || '', notes: form.notes || '', date: todayStr(), createdAt: nowISO() }
    setGaming({ sessions: [s, ...sessions] })
    setModal(null); setForm({})
  }

  function deleteSession(id) { setGaming({ sessions: sessions.filter(s => s.id !== id) }) }

  const totalMin = sessions.reduce((s, x) => s + (x.duration || 0), 0)
  const wins     = sessions.filter(s => s.result === 'win').length

  return (
    <div style={{ padding: '16px', paddingBottom: '90px', maxWidth: '480px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <h2 className="serif" style={{ fontSize: '28px', lineHeight: 1 }}>Gaming</h2>
          <p style={{ color: C.textDim, fontSize: '12px', marginTop: '2px' }}>
            {sessions.filter(s => s.date === todayStr()).length} session(s) aujourd'hui
          </p>
        </div>
        <Button small variant="gold" disabled={games.length === 0} onClick={() => { setForm({ game: games[0]?.name || '' }); setModal('session') }}>
          <Plus size={13} /> Session
        </Button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
        {[
          { v: sessions.length,            label: 'sessions',  c: C.blue  },
          { v: `${Math.floor(totalMin/60)}h`, label: 'de jeu', c: C.gold  },
          { v: wins,                       label: 'victoires', c: C.green },
        ].map(({ v, label, c }) => (
          <div key={label} style={{ ...cardStyle, padding: '12px', textAlign: 'center' }}>
            <div className="serif" style={{ fontSize: '22px', fontWeight: 600, color: c, lineHeight: 1 }}>{v}</div>
            <p style={{ fontSize: '10px', color: C.textDim, marginTop: '3px' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Games list */}
      {games.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '28px', marginBottom: '12px' }}>
          <Gamepad2 size={22} style={{ color: C.textDim, marginBottom: '8px' }} />
          <p style={{ color: C.textDim, fontSize: '13px', marginBottom: '12px' }}>Ajoute d'abord tes jeux.</p>
          <Button small onClick={() => { setForm({ platform: 'Mobile' }); setModal('game') }}>
            <Plus size={12} /> Ajouter un jeu
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '14px' }}>
          {games.map(g => (
            <div key={g.id} style={{ ...cardStyle, padding: '7px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Gamepad2 size={11} style={{ color: C.blue }} />
              <span style={{ fontSize: '13px', fontWeight: 500 }}>{g.name}</span>
              <span style={{ fontSize: '10px', color: C.textDim }}>{g.platform}</span>
            </div>
          ))}
          <Button small variant="ghost" onClick={() => { setForm({ platform: 'Mobile' }); setModal('game') }}>
            <Plus size={11} />
          </Button>
        </div>
      )}

      {/* Sessions */}
      <h3 className="serif" style={{ fontSize: '20px', marginBottom: '10px' }}>Sessions</h3>
      {sessions.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '28px' }}>
          <p style={{ color: C.textDim, fontSize: '13px' }}>Enregistre ta prochaine session.</p>
        </div>
      ) : (
        sessions.slice(0, 20).map(s => (
          <div key={s.id} style={{ ...cardStyle, padding: '11px 14px', marginBottom: '7px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: s.result === 'win' ? C.greenDim : s.result === 'loss' ? C.redDim : C.blueDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Gamepad2 size={13} style={{ color: s.result === 'win' ? C.green : s.result === 'loss' ? C.red : C.blue }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 500 }}>{s.game}</p>
              <p style={{ fontSize: '11px', color: C.textDim }}>
                {s.duration ? `${s.duration}min · ` : ''}
                {s.result === 'win' ? 'Victoire 🏆' : s.result === 'loss' ? 'Défaite' : 'Entraînement'}
                {' · '}{fmtDateShort(s.createdAt || s.date)}
              </p>
            </div>
            <button onClick={() => deleteSession(s.id)} style={{ background: 'none', border: 'none', color: C.textDim, cursor: 'pointer' }}>
              <Trash2 size={11} />
            </button>
          </div>
        ))
      )}

      {modal === 'session' && (
        <BottomSheet title="Nouvelle session" onClose={() => setModal(null)}>
          <div>
            <SectionLabel>Jeu</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              {games.map(g => <Chip key={g.id} label={g.name} selected={form.game === g.name} onClick={() => setForm(f => ({ ...f, game: g.name }))} />)}
            </div>
          </div>
          <Field label="Durée (minutes)" type="number" value={form.duration || ''} onChange={v => setForm(f => ({ ...f, duration: v }))} placeholder="60" />
          <div>
            <SectionLabel>Résultat</SectionLabel>
            <div style={{ display: 'flex', gap: '7px' }}>
              {[['win', 'Victoire 🏆'], ['loss', 'Défaite'], ['neutral', 'Entraînement']].map(([v, l]) => (
                <Chip key={v} label={l} selected={form.result === v} onClick={() => setForm(f => ({ ...f, result: v }))} />
              ))}
            </div>
          </div>
          <Field label="Notes (optionnel)" value={form.notes || ''} onChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="Stats, impressions…" />
          <Button onClick={addSession} full disabled={!form.game}>Enregistrer</Button>
        </BottomSheet>
      )}
      {modal === 'game' && (
        <BottomSheet title="Ajouter un jeu" onClose={() => setModal(null)}>
          <Field label="Nom du jeu" value={form.gameName || ''} onChange={v => setForm(f => ({ ...f, gameName: v }))} placeholder="Ex: PUBG Mobile, Free Fire…" />
          <div>
            <SectionLabel>Plateforme</SectionLabel>
            <div style={{ display: 'flex', gap: '7px' }}>
              {['Mobile', 'PC', 'Console'].map(p => <Chip key={p} label={p} selected={form.platform === p} onClick={() => setForm(f => ({ ...f, platform: p }))} />)}
            </div>
          </div>
          <Button onClick={addGame} full disabled={!form.gameName}>Ajouter</Button>
        </BottomSheet>
      )}
    </div>
  )
}

// ── MUSIQUE ───────────────────────────────────────────────────────────────────
const MUSIC_MOODS = ['Motivé', 'Relaxé', 'Triste', 'Euphorie', 'Focus', 'Nostalgique']

function MusiqueTab({ data, update }) {
  const [modal, setModal] = useState(null)
  const [form,  setForm]  = useState({})

  const tracks = data.dynamic?.musique?.tracks || []

  function setMusique(val) { update(d => ({ ...d, dynamic: { ...d.dynamic, musique: { ...(d.dynamic?.musique || {}), ...val } } })) }

  function addTrack() {
    if (!form.title && !form.artist) return
    const t = { id: uid(), title: form.title || '', artist: form.artist || '', genre: form.genre || '', mood: form.mood || '', date: nowISO() }
    setMusique({ tracks: [t, ...tracks] })
    setModal(null); setForm({})
  }

  function deleteTrack(id) { setMusique({ tracks: tracks.filter(t => t.id !== id) }) }

  const moodGroups = MUSIC_MOODS.filter(m => tracks.some(t => t.mood === m))
  const noMood     = tracks.filter(t => !t.mood)

  return (
    <div style={{ padding: '16px', paddingBottom: '90px', maxWidth: '480px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <h2 className="serif" style={{ fontSize: '28px', lineHeight: 1 }}>Musique</h2>
          <p style={{ color: C.textDim, fontSize: '12px', marginTop: '2px' }}>{tracks.length} titre(s)</p>
        </div>
        <Button small onClick={() => { setForm({}); setModal('add') }}>
          <Plus size={13} /> Ajouter
        </Button>
      </div>

      {tracks.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '40px' }}>
          <Music size={24} style={{ color: C.textDim, marginBottom: '10px' }} />
          <p style={{ color: C.textDim, fontSize: '13px' }}>Note tes coups de cœur musicaux.</p>
        </div>
      ) : (
        <>
          {moodGroups.map(mood => (
            <div key={mood} style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', color: C.textMid, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{mood}</p>
              {tracks.filter(t => t.mood === mood).map(t => (
                <div key={t.id} style={{ ...cardStyle, padding: '11px 14px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(251,113,133,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Music size={13} style={{ color: '#fb7185' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title || t.artist}</p>
                    {t.title && t.artist && <p style={{ fontSize: '11px', color: C.textDim }}>{t.artist}{t.genre ? ` · ${t.genre}` : ''}</p>}
                  </div>
                  <button onClick={() => deleteTrack(t.id)} style={{ background: 'none', border: 'none', color: C.textDim, cursor: 'pointer' }}>
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          ))}
          {noMood.map(t => (
            <div key={t.id} style={{ ...cardStyle, padding: '11px 14px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(251,113,133,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Music size={13} style={{ color: '#fb7185' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '13px', fontWeight: 500 }}>{t.title || t.artist}</p>
                {t.title && t.artist && <p style={{ fontSize: '11px', color: C.textDim }}>{t.artist}</p>}
              </div>
              <button onClick={() => deleteTrack(t.id)} style={{ background: 'none', border: 'none', color: C.textDim, cursor: 'pointer' }}>
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </>
      )}

      {modal === 'add' && (
        <BottomSheet title="Ajouter un titre" onClose={() => setModal(null)}>
          <Field label="Titre" value={form.title || ''} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="Nom de la chanson…" />
          <Field label="Artiste" value={form.artist || ''} onChange={v => setForm(f => ({ ...f, artist: v }))} placeholder="Nom de l'artiste…" />
          <Field label="Genre (optionnel)" value={form.genre || ''} onChange={v => setForm(f => ({ ...f, genre: v }))} placeholder="Afrobeat, Rap, RnB…" />
          <div>
            <SectionLabel>Mood</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              {MUSIC_MOODS.map(m => <Chip key={m} label={m} selected={form.mood === m} onClick={() => setForm(f => ({ ...f, mood: m }))} />)}
            </div>
          </div>
          <Button onClick={addTrack} full disabled={!form.title && !form.artist}>Ajouter</Button>
        </BottomSheet>
      )}
    </div>
  )
}

// ── SPORT ─────────────────────────────────────────────────────────────────────
const SPORT_TYPES = ['Musculation', 'Course', 'Football', 'Basketball', 'Natation', 'HIIT', 'Yoga', 'Autre']

function SportTab({ data, update }) {
  const [modal, setModal] = useState(null)
  const [form,  setForm]  = useState({})

  const sessions = data.dynamic?.sport?.sessions || []

  function setSport(val) { update(d => ({ ...d, dynamic: { ...d.dynamic, sport: { ...(d.dynamic?.sport || {}), ...val } } })) }

  function addSession() {
    if (!form.type) return
    const s = { id: uid(), type: form.type, duration: parseInt(form.duration) || 0, feeling: form.feeling || 3, notes: form.notes || '', date: todayStr(), createdAt: nowISO() }
    setSport({ sessions: [s, ...sessions] })
    setModal(null); setForm({})
  }

  function deleteSession(id) { setSport({ sessions: sessions.filter(s => s.id !== id) }) }

  const weekN    = sessions.filter(s => daysSince(s.date) < 7).length
  const totalMin = sessions.reduce((s, x) => s + (x.duration || 0), 0)

  return (
    <div style={{ padding: '16px', paddingBottom: '90px', maxWidth: '480px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <h2 className="serif" style={{ fontSize: '28px', lineHeight: 1 }}>Sport</h2>
          <p style={{ color: C.textDim, fontSize: '12px', marginTop: '2px' }}>{weekN} séance(s) cette semaine</p>
        </div>
        <Button small onClick={() => { setForm({ type: 'Musculation', feeling: 3 }); setModal('add') }}>
          <Plus size={13} /> Séance
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
        {[
          { v: sessions.length,              label: 'séances total',    c: C.green },
          { v: `${Math.floor(totalMin/60)}h`, label: 'de sport',        c: C.gold  },
          { v: weekN,                         label: 'cette semaine',   c: weekN >= 3 ? C.green : weekN >= 1 ? C.gold : C.red },
        ].map(({ v, label, c }) => (
          <div key={label} style={{ ...cardStyle, padding: '12px', textAlign: 'center' }}>
            <div className="serif" style={{ fontSize: '22px', fontWeight: 600, color: c, lineHeight: 1 }}>{v}</div>
            <p style={{ fontSize: '10px', color: C.textDim, marginTop: '3px', lineHeight: 1.4 }}>{label}</p>
          </div>
        ))}
      </div>

      {sessions.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '36px' }}>
          <Dumbbell size={24} style={{ color: C.textDim, marginBottom: '10px' }} />
          <p style={{ color: C.textDim, fontSize: '13px' }}>Enregistre ta première séance.</p>
        </div>
      ) : (
        sessions.slice(0, 20).map(s => (
          <div key={s.id} style={{ ...cardStyle, padding: '11px 14px', marginBottom: '7px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: C.greenDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Dumbbell size={13} style={{ color: C.green }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 500 }}>{s.type}</p>
              <p style={{ fontSize: '11px', color: C.textDim }}>
                {s.duration ? `${s.duration}min · ` : ''}{'⭐'.repeat(s.feeling || 3)} · {fmtDateShort(s.createdAt || s.date)}
              </p>
              {s.notes && <p style={{ fontSize: '11px', color: C.textDim, marginTop: '1px' }}>{s.notes}</p>}
            </div>
            <button onClick={() => deleteSession(s.id)} style={{ background: 'none', border: 'none', color: C.textDim, cursor: 'pointer' }}>
              <Trash2 size={11} />
            </button>
          </div>
        ))
      )}

      {modal === 'add' && (
        <BottomSheet title="Nouvelle séance" onClose={() => setModal(null)}>
          <div>
            <SectionLabel>Type</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              {SPORT_TYPES.map(t => <Chip key={t} label={t} selected={form.type === t} onClick={() => setForm(f => ({ ...f, type: t }))} />)}
            </div>
          </div>
          <Field label="Durée (minutes)" type="number" value={form.duration || ''} onChange={v => setForm(f => ({ ...f, duration: v }))} placeholder="45" />
          <div>
            <SectionLabel>Ressenti</SectionLabel>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setForm(f => ({ ...f, feeling: n }))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', opacity: n <= (form.feeling || 3) ? 1 : 0.25, transition: 'opacity 0.15s' }}>
                  ⭐
                </button>
              ))}
            </div>
          </div>
          <Field label="Notes (optionnel)" value={form.notes || ''} onChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="Exercices, performances…" />
          <Button onClick={addSession} full disabled={!form.type}>Enregistrer</Button>
        </BottomSheet>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────────────────────────────────────

function SettingsSheet({ data, onClose }) {
  return (
    <BottomSheet title="Réglages" subtitle={`Espace de ${data?.user?.name || ''}`} onClose={onClose}>
      <div style={{ ...cardStyle, background: C.goldDim, border: '1px solid rgba(212,168,83,0.2)', padding: '14px 16px' }}>
        <p style={{ color: C.gold, fontSize: '13px', lineHeight: 1.6 }}>
          <strong>IA connectée ✓</strong><br />
          Clé API sécurisée via variables d'environnement Netlify.
        </p>
      </div>
      <div style={{ ...cardStyle, padding: '14px 16px' }}>
        <p style={{ color: C.textDim, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Compte</p>
        <p style={{ fontSize: '15px', fontWeight: 600 }}>{data?.user?.name}</p>
        <p style={{ color: C.textDim, fontSize: '12px', marginTop: '2px' }}>
          Membre depuis {new Date(data?.user?.createdAt || Date.now()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        {data?.user?.tabs?.length > 0 && (
          <p style={{ color: C.textDim, fontSize: '12px', marginTop: '3px' }}>
            Onglets actifs : {data.user.tabs.map(id => DYN_TABS[id]?.label).filter(Boolean).join(', ')}
          </p>
        )}
      </div>
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '14px' }}>
        <Button
          variant="danger" full small
          onClick={() => {
            if (window.confirm('Supprimer toutes tes données ? Cette action est irréversible.')) {
              localStorage.removeItem(STORAGE_KEY)
              window.location.reload()
            }
          }}
        >
          <Trash2 size={12} /> Supprimer mes données
        </Button>
      </div>
    </BottomSheet>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────

const FIXED_TABS = [
  { id: 'home',      label: 'Accueil',   Icon: Home        },
  { id: 'finances',  label: 'Finances',  Icon: DollarSign  },
  { id: 'habits',    label: 'Habitudes', Icon: Flame       },
  { id: 'relations', label: 'Relations', Icon: Users       },
]

function MainApp({ data, update }) {
  const [activeTab,   setActiveTab]   = useState('home')
  const [showSettings, setShowSettings] = useState(false)

  // Build nav from fixed + detected dynamic tabs (max 5 total)
  const dynNavItems = (data.user?.tabs || [])
    .map(id => DYN_TABS[id])
    .filter(Boolean)

  const navTabs = [...FIXED_TABS, ...dynNavItems].slice(0, 5)

  function renderTab() {
    switch (activeTab) {
      case 'home':      return <HomeTab      data={data} update={update} />
      case 'finances':  return <FinancesTab  data={data} update={update} />
      case 'habits':    return <HabitsTab    data={data} update={update} />
      case 'relations': return <RelationsTab data={data} update={update} />
      case 'anime':     return <AnimeTab     data={data} update={update} />
      case 'gaming':    return <GamingTab    data={data} update={update} />
      case 'musique':   return <MusiqueTab   data={data} update={update} />
      case 'sport':     return <SportTab     data={data} update={update} />
      default:          return null
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>

      {/* Header */}
      <header style={{ padding: '12px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 20, background: `${C.bg}f0`, backdropFilter: 'blur(14px)' }}>
        <span className="serif" style={{ fontSize: '22px', color: C.gold, fontWeight: 600 }}>My All</span>
        <button
          onClick={() => setShowSettings(true)}
          style={{ background: 'none', border: 'none', color: C.textDim, cursor: 'pointer', padding: '5px', borderRadius: '8px' }}
        >
          <Settings size={16} />
        </button>
      </header>

      {/* Content */}
      <div style={{ paddingBottom: '70px' }}>
        {renderTab()}
      </div>

      {/* Bottom nav */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: `${C.bg}f0`, backdropFilter: 'blur(14px)', borderTop: `1px solid ${C.border}`, display: 'flex', padding: '7px 0 10px' }}>
        {navTabs.map(({ id, Icon, label, color }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
          >
            <Icon size={19} style={{ color: activeTab === id ? (color || C.gold) : C.textDim, transition: 'color 0.15s' }} />
            <span style={{ fontSize: '9px', fontWeight: activeTab === id ? 600 : 400, color: activeTab === id ? (color || C.gold) : C.textDim, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.15s' }}>
              {label}
            </span>
          </button>
        ))}
      </nav>

      {showSettings && <SettingsSheet data={data} onClose={() => setShowSettings(false)} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState('loading')
  const [data,   setData]   = useState(null)

  // Inject fonts once
  useEffect(() => {
    if (!document.getElementById('myall-css')) {
      const style = document.createElement('style')
      style.id = 'myall-css'
      style.textContent = GLOBAL_CSS
      document.head.appendChild(style)
    }

    const saved = loadData()
    if (saved?.user?.name) {
      setData(saved)
      setScreen('app')
    } else {
      setScreen('onboarding')
    }
  }, [])

  const update = useCallback(fn => {
    setData(prev => {
      const next = typeof fn === 'function' ? fn(prev) : fn
      saveData(next)
      return next
    })
  }, [])

  if (screen === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#07090f' }}>
        <span style={{ fontFamily: 'serif', fontSize: '36px', color: '#d4a853' }}>My All</span>
      </div>
    )
  }

  if (screen === 'onboarding') {
    return (
      <Onboarding
        onComplete={(name, tabs, profile) => {
          const fresh = makeDefaultData(name, tabs, profile)
          setData(fresh)
          saveData(fresh)
          setScreen('app')
        }}
      />
    )
  }

  return <MainApp data={data} update={update} />
}
