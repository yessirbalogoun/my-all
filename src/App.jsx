import { useState, useEffect, useRef, useCallback } from "react"
import {
  Home, DollarSign, Target, Users, MessageCircle, Plus, X, Check,
  Trash2, Star, TrendingUp, TrendingDown, Flame, Send, Loader,
  ChevronDown, ChevronUp, Settings, Bell, Sparkles
} from "lucide-react"

// ── Storage ───────────────────────────────────────────────────────────────────
const KEY = 'myall_v1'
const loadData = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null') } catch { return null } }
const saveData = (d) => { try { localStorage.setItem(KEY, JSON.stringify(d)) } catch {} }

// ── Utils ─────────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10)
const now = () => new Date().toISOString()
const today = () => new Date().toISOString().slice(0, 10)
const thisMonth = () => new Date().toISOString().slice(0, 7)
const daysSince = d => d ? Math.floor((Date.now() - new Date(d)) / 86400000) : 999
const fmtAmt = n => Math.abs(parseInt(n || 0)).toLocaleString('fr-FR')
const fmtDate = d => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
const fmtDateShort = d => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
const greet = () => { const h = new Date().getHours(); return h < 6 ? 'Bonne nuit' : h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir' }

const mkDefault = (name) => ({
  user: { name, createdAt: now(), apiKey: '' },
  finances: { transactions: [], objectifs: [], budget: 0 },
  objectifs: [],
  relations: [],
})

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: '#07090f',
  bg2: '#0d1119',
  surface: 'rgba(255,255,255,0.04)',
  surfaceHover: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.08)',
  gold: '#d4a853',
  goldLight: '#e8c57a',
  goldDim: 'rgba(212,168,83,0.12)',
  blue: '#4a9af4',
  blueDim: 'rgba(74,154,244,0.1)',
  green: '#4ade80',
  greenDim: 'rgba(74,222,128,0.1)',
  red: '#f87171',
  redDim: 'rgba(248,113,113,0.1)',
  orange: '#fb923c',
  text: '#f0ece4',
  textMid: '#a09c96',
  textDim: '#575350',
}
const CARD = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: '18px', padding: '18px' }
const INP = { background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: '12px', color: C.text, outline: 'none', fontFamily: 'DM Sans, sans-serif' }
const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  body { background: ${C.bg}; color: ${C.text}; font-family: 'DM Sans', sans-serif; }
  .serif { font-family: 'Cormorant Garamond', Georgia, serif; }
  @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }
  ::-webkit-scrollbar { width: 3px } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px }
`

// ── AI Context ────────────────────────────────────────────────────────────────
function buildContext(data) {
  const { user, finances, objectifs = [], relations = [] } = data
  const m = thisMonth()
  const txM = (finances?.transactions || []).filter(t => t.date.startsWith(m))
  const dep = txM.filter(t => t.type === 'depense').reduce((s, t) => s + t.amount, 0)
  const rev = txM.filter(t => t.type === 'revenu').reduce((s, t) => s + t.amount, 0)
  const habits = objectifs.filter(o => o.isHabit)
  const todayDone = habits.filter(h => h.lastDone === today())
  const goals = objectifs.filter(o => !o.isHabit)
  const overdue = relations.filter(r => daysSince(r.lastContact) > (r.reminderDays || 30))
  const daysKnown = daysSince(user.createdAt)

  return `Tu es l'assistant personnel exclusif de ${user.name}. Tu le/la connais depuis ${daysKnown} jours. Tu es chaleureux, direct, intelligent. Tu parles toujours en français. Tu es concis (max 3-4 phrases sauf si demandé autrement). Tu utilises les données ci-dessous pour personnaliser CHAQUE réponse.

━ PROFIL: ${user.name}

━ FINANCES CE MOIS (${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}):
  Revenus: ${fmtAmt(rev)} FCFA | Dépenses: ${fmtAmt(dep)} FCFA${finances?.budget ? ` | Budget: ${fmtAmt(finances.budget)} FCFA (${finances.budget > 0 ? Math.round(dep / finances.budget * 100) : 0}% consommé)` : ''}
  ${(finances?.objectifs || []).map(o => `Épargne "${o.label}": ${fmtAmt(o.actuel)}/${fmtAmt(o.cible)} FCFA (${o.cible > 0 ? Math.round(o.actuel / o.cible * 100) : 0}%)`).join(' | ') || 'Aucun objectif épargne'}

━ HABITUDES (${todayDone.length}/${habits.length} aujourd'hui):
${habits.map(h => `  ${h.lastDone === today() ? '✓' : '○'} ${h.label}: ${h.streak || 0}j de streak`).join('\n') || '  Aucune habitude définie'}

━ OBJECTIFS:
${goals.map(g => `  ${g.label}: ${g.progress || 0}%`).join('\n') || '  Aucun objectif'}

━ RELATIONS (${overdue.length} à recontacter):
${relations.map(r => `  ${r.name} (${r.category}): ${daysSince(r.lastContact) === 0 ? 'contacté aujourd\'hui' : `il y a ${daysSince(r.lastContact)}j`}${daysSince(r.lastContact) > (r.reminderDays || 30) ? ' ⚠️' : ''}`).join('\n') || '  Aucune relation enregistrée'}

Si tu vois des choses préoccupantes (budget dépassé, habitude abandonnée, relation négligée, objectif au point mort), mentionne-les spontanément avec bienveillance.`
}

async function callAI(messages, data) {
  const apiKey = data?.user?.apiKey || ''
  const headers = { 'Content-Type': 'application/json' }
  if (apiKey) headers['x-api-key'] = apiKey
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: buildContext(data),
      messages: messages.map(m => ({ role: m.role, content: m.content }))
    })
  })
  if (!res.ok) throw new Error('API error')
  const d = await res.json()
  return d.content?.[0]?.text || "Je n'ai pas pu répondre."
}

// ── UI Components ─────────────────────────────────────────────────────────────
function Btn({ children, onClick, variant = 'primary', small, full, disabled, style: s = {} }) {
  const base = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderRadius: '12px', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, cursor: disabled ? 'default' : 'pointer', border: 'none', opacity: disabled ? 0.4 : 1, transition: 'all 0.15s', width: full ? '100%' : 'auto', padding: small ? '8px 14px' : '12px 20px', fontSize: small ? '12px' : '14px' }
  const variants = {
    primary: { background: `linear-gradient(135deg, ${C.gold}, #b8893a)`, color: '#0a0800' },
    ghost: { background: C.surface, color: C.text, border: `1px solid ${C.border}` },
    danger: { background: C.redDim, color: C.red, border: `1px solid rgba(248,113,113,0.2)` },
    success: { background: C.greenDim, color: C.green, border: `1px solid rgba(74,222,128,0.2)` },
    gold: { background: C.goldDim, color: C.gold, border: `1px solid rgba(212,168,83,0.25)` },
  }
  return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant], ...s }}>{children}</button>
}

function Input({ label, value, onChange, type = 'text', placeholder, rows }) {
  const style = { ...INP, padding: '12px 14px', fontSize: '14px', width: '100%', display: 'block' }
  return (
    <div>
      {label && <label style={{ color: C.textMid, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>{label}</label>}
      {rows
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ ...style, resize: 'vertical' }} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={style} />
      }
    </div>
  )
}

function Modal({ title, onClose, children, subtitle }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(6px)' }}>
      <div style={{ background: '#0f1521', border: `1px solid ${C.border}`, borderRadius: '24px 24px 0 0', padding: '24px 20px', width: '100%', maxWidth: '480px', maxHeight: '88vh', overflowY: 'auto', animation: 'fadeIn 0.2s ease' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h3 className="serif" style={{ fontSize: '24px', fontWeight: 600, lineHeight: 1 }}>{title}</h3>
            {subtitle && <p style={{ color: C.textMid, fontSize: '13px', marginTop: '4px' }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ background: C.surface, border: 'none', color: C.textMid, cursor: 'pointer', borderRadius: '10px', padding: '8px', flexShrink: 0, marginLeft: '12px' }}><X size={15} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>{children}</div>
      </div>
    </div>
  )
}

function Tag({ label, selected, onClick }) {
  return (
    <button onClick={onClick} style={{ padding: '6px 13px', borderRadius: '999px', fontSize: '12px', cursor: 'pointer', background: selected ? C.goldDim : C.surface, color: selected ? C.gold : C.textMid, border: `1px solid ${selected ? 'rgba(212,168,83,0.35)' : C.border}`, fontFamily: 'DM Sans, sans-serif', fontWeight: selected ? 600 : 400 }}>
      {label}
    </button>
  )
}

// ── Onboarding ────────────────────────────────────────────────────────────────
function Onboarding({ onDone }) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')

  if (step === 0) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 28px', background: C.bg, textAlign: 'center' }}>
      <div style={{ maxWidth: '320px', animation: 'fadeIn 0.6s ease' }}>
        <div style={{ fontSize: '56px', marginBottom: '4px', letterSpacing: '-2px', color: C.gold, fontFamily: 'Cormorant Garamond, serif', fontWeight: 600 }}>✦</div>
        <h1 className="serif" style={{ fontSize: '58px', color: C.gold, lineHeight: 0.95, marginBottom: '20px', fontWeight: 600 }}>My<br />All</h1>
        <p style={{ color: C.textMid, fontSize: '15px', lineHeight: 1.7, marginBottom: '16px' }}>
          Ton espace de vie personnel.
        </p>
        <p style={{ color: C.textDim, fontSize: '13px', lineHeight: 1.7, marginBottom: '40px' }}>
          Finances · Objectifs · Relations<br />avec une IA qui te connaît vraiment.
        </p>
        <Btn onClick={() => setStep(1)} full>Créer mon espace →</Btn>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 28px', background: C.bg }}>
      <div style={{ maxWidth: '320px', width: '100%', animation: 'fadeIn 0.4s ease' }}>
        <h2 className="serif" style={{ fontSize: '36px', marginBottom: '8px' }}>Comment tu t'appelles ?</h2>
        <p style={{ color: C.textMid, fontSize: '14px', marginBottom: '28px', lineHeight: 1.6 }}>Ton IA personnelle s'adressera à toi par ce prénom.</p>
        <div style={{ marginBottom: '20px' }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Ton prénom…"
            onKeyDown={e => e.key === 'Enter' && name.trim() && onDone(name.trim())}
            style={{ ...INP, padding: '16px 18px', fontSize: '18px', width: '100%' }} autoFocus />
        </div>
        <Btn onClick={() => name.trim() && onDone(name.trim())} full disabled={!name.trim()}>
          <Sparkles size={15} /> Créer mon espace
        </Btn>
      </div>
    </div>
  )
}

// ── ACCUEIL + IA ──────────────────────────────────────────────────────────────
function HomeTab({ data, update }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const chatRef = useRef(null)
  const inputRef = useRef(null)

  const { user, finances = {}, objectifs = [], relations = [] } = data
  const m = thisMonth()
  const dep = (finances.transactions || []).filter(t => t.date.startsWith(m) && t.type === 'depense').reduce((s, t) => s + t.amount, 0)
  const habits = objectifs.filter(o => o.isHabit)
  const doneTodayCount = habits.filter(h => h.lastDone === today()).length
  const overdue = relations.filter(r => daysSince(r.lastContact) > (r.reminderDays || 30))

  const send = async (msg) => {
    const text = (msg || input).trim()
    if (!text || loading) return
    const userMsg = { role: 'user', content: text }
    const newMsgs = [...messages, userMsg]
    setMessages(newMsgs)
    setInput('')
    setLoading(true)
    try {
      const reply = await callAI(newMsgs, data)
      setMessages(ms => [...ms, { role: 'assistant', content: reply }])
    } catch {
      setMessages(ms => [...ms, { role: 'assistant', content: "Désolé, une erreur s'est produite. Si tu utilises l'app en dehors de Claude, tu dois configurer ta clé API dans les Réglages." }])
    }
    setLoading(false)
    setTimeout(() => chatRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }), 120)
  }

  const quickPrompts = [
    'Fais-moi un bilan rapide de ma situation',
    'Quelles habitudes je néglige ?',
    'Qui dois-je recontacter ?',
    'Donne-moi un conseil pour cette semaine',
  ]

  return (
    <div style={{ padding: '20px', paddingBottom: '90px', maxWidth: '480px', margin: '0 auto' }}>
      {/* Greeting */}
      <div style={{ marginBottom: '28px', animation: 'fadeIn 0.4s ease' }}>
        <p style={{ color: C.textDim, fontSize: '13px', marginBottom: '2px' }}>{greet()},</p>
        <h1 className="serif" style={{ fontSize: '52px', fontWeight: 600, color: C.text, lineHeight: 0.95, marginBottom: '6px' }}>{user.name}</h1>
        <p style={{ color: C.textDim, fontSize: '13px' }}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      {/* 3 stats rapides */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '24px' }}>
        {[
          { label: 'habitudes', value: `${doneTodayCount}/${habits.length}`, color: doneTodayCount === habits.length && habits.length > 0 ? C.green : C.text, sub: "aujourd'hui" },
          { label: 'dépensé', value: fmtAmt(dep), color: finances.budget > 0 && dep > finances.budget ? C.red : C.gold, sub: 'ce mois' },
          { label: 'à rappeler', value: overdue.length, color: overdue.length > 0 ? C.red : C.textDim, sub: 'contacts' },
        ].map(({ label, value, color, sub }) => (
          <div key={label} style={{ ...CARD, padding: '14px 12px', textAlign: 'center' }}>
            <div className="serif" style={{ fontSize: '26px', fontWeight: 600, color, lineHeight: 1 }}>{value}</div>
            <p style={{ fontSize: '10px', color: C.textDim, marginTop: '4px', lineHeight: 1.3 }}>{sub}<br />{label}</p>
          </div>
        ))}
      </div>

      {/* Chat */}
      {!showChat ? (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <button onClick={() => { setShowChat(true); setTimeout(() => inputRef.current?.focus(), 200) }}
            style={{ width: '100%', padding: '18px 20px', borderRadius: '20px', background: `linear-gradient(135deg, rgba(212,168,83,0.1), rgba(74,154,244,0.06))`, border: `1px solid rgba(212,168,83,0.25)`, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: C.goldDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid rgba(212,168,83,0.2)` }}>
              <Sparkles size={18} style={{ color: C.gold }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: C.text, fontSize: '14px', fontWeight: 600 }}>Parler à mon IA</p>
              <p style={{ color: C.textMid, fontSize: '12px', marginTop: '2px' }}>Elle connaît ta situation complète</p>
            </div>
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {quickPrompts.map((p, i) => (
              <button key={i} onClick={() => { setShowChat(true); setTimeout(() => send(p), 150) }}
                style={{ ...CARD, padding: '13px 16px', textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: C.textMid, transition: 'all 0.15s' }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ animation: 'fadeIn 0.25s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: C.goldDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={14} style={{ color: C.gold }} />
              </div>
              <span className="serif" style={{ fontSize: '20px', fontWeight: 500 }}>Mon IA</span>
            </div>
            <button onClick={() => setShowChat(false)} style={{ background: C.surface, border: 'none', color: C.textMid, cursor: 'pointer', borderRadius: '8px', padding: '7px' }}><X size={14} /></button>
          </div>
          <div ref={chatRef} style={{ height: '360px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px', paddingRight: '2px' }}>
            {messages.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
                <div className="serif" style={{ fontSize: '48px', color: C.gold, marginBottom: '12px', opacity: 0.4 }}>✦</div>
                <p style={{ color: C.textMid, fontSize: '14px' }}>Je connais ta situation.</p>
                <p style={{ color: C.textDim, fontSize: '13px', marginTop: '4px' }}>Parle-moi librement.</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', animation: 'fadeIn 0.2s ease' }}>
                <div style={{
                  maxWidth: '85%', padding: '12px 16px', lineHeight: 1.65, fontSize: '14px',
                  borderRadius: m.role === 'user' ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
                  background: m.role === 'user' ? `linear-gradient(135deg, ${C.gold}, #b8893a)` : C.surface,
                  color: m.role === 'user' ? '#0a0800' : C.text,
                  border: m.role === 'user' ? 'none' : `1px solid ${C.border}`,
                  fontWeight: m.role === 'user' ? 500 : 400,
                  whiteSpace: 'pre-wrap',
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '14px 18px', borderRadius: '20px 20px 20px 5px', background: C.surface, border: `1px solid ${C.border}` }}>
                  <Loader size={14} style={{ color: C.gold, animation: 'spin 0.9s linear infinite' }} />
                </div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && !loading && send()}
              placeholder="Écris ta question…"
              style={{ ...INP, padding: '13px 16px', fontSize: '14px', flex: 1 }} />
            <button onClick={() => send()} disabled={!input.trim() || loading}
              style={{ background: input.trim() && !loading ? `linear-gradient(135deg, ${C.gold}, #b8893a)` : C.surface, border: `1px solid ${!input.trim() || loading ? C.border : 'transparent'}`, borderRadius: '12px', padding: '0 16px', cursor: input.trim() && !loading ? 'pointer' : 'default', color: input.trim() && !loading ? '#0a0800' : C.textDim, transition: 'all 0.15s' }}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── FINANCES ──────────────────────────────────────────────────────────────────
const FIN_CAT = ['Alimentation', 'Transport', 'Logement', 'Santé', 'Loisirs', 'Famille', 'Épargne', 'Autre']

function FinancesTab({ data, update }) {
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const txs = data.finances?.transactions || []
  const objs = data.finances?.objectifs || []
  const budget = data.finances?.budget || 0
  const m = thisMonth()
  const monthTx = txs.filter(t => t.date.startsWith(m))
  const dep = monthTx.filter(t => t.type === 'depense').reduce((s, t) => s + t.amount, 0)
  const rev = monthTx.filter(t => t.type === 'revenu').reduce((s, t) => s + t.amount, 0)
  const pct = budget > 0 ? Math.min(100, Math.round(dep / budget * 100)) : 0
  const overBudget = budget > 0 && dep > budget

  const addTx = () => {
    if (!form.amount || !form.label) return
    update(d => ({ ...d, finances: { ...d.finances, transactions: [{ id: uid(), label: form.label, amount: parseInt(form.amount) || 0, type: form.type || 'depense', category: form.category || 'Autre', date: now() }, ...(d.finances.transactions || [])] } }))
    setModal(null); setForm({})
  }
  const addObj = () => {
    if (!form.label || !form.cible) return
    update(d => ({ ...d, finances: { ...d.finances, objectifs: [...(d.finances.objectifs || []), { id: uid(), label: form.label, cible: parseInt(form.cible) || 0, actuel: 0 }] } }))
    setModal(null); setForm({})
  }
  const setBudget = () => {
    update(d => ({ ...d, finances: { ...d.finances, budget: parseInt(form.budget) || 0 } }))
    setModal(null); setForm({})
  }
  const delTx = id => update(d => ({ ...d, finances: { ...d.finances, transactions: d.finances.transactions.filter(t => t.id !== id) } }))
  const updateObjActuel = (id, val) => update(d => ({ ...d, finances: { ...d.finances, objectifs: d.finances.objectifs.map(o => o.id === id ? { ...o, actuel: parseInt(val) || 0 } : o) } }))
  const delObj = id => update(d => ({ ...d, finances: { ...d.finances, objectifs: d.finances.objectifs.filter(o => o.id !== id) } }))

  return (
    <div style={{ padding: '16px', paddingBottom: '90px', maxWidth: '480px', margin: '0 auto' }}>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div style={{ ...CARD, background: C.greenDim, border: '1px solid rgba(74,222,128,0.15)' }}>
          <p style={{ color: C.textDim, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Revenus</p>
          <p className="serif" style={{ fontSize: '28px', color: C.green, fontWeight: 600, lineHeight: 1 }}>{fmtAmt(rev)}</p>
          <p style={{ color: C.textDim, fontSize: '11px', marginTop: '3px' }}>ce mois</p>
        </div>
        <div style={{ ...CARD, background: overBudget ? C.redDim : C.surface, border: `1px solid ${overBudget ? 'rgba(248,113,113,0.2)' : C.border}` }}>
          <p style={{ color: C.textDim, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Dépenses</p>
          <p className="serif" style={{ fontSize: '28px', color: overBudget ? C.red : C.text, fontWeight: 600, lineHeight: 1 }}>{fmtAmt(dep)}</p>
          <p style={{ color: C.textDim, fontSize: '11px', marginTop: '3px' }}>{budget > 0 ? `/ ${fmtAmt(budget)} budget` : 'ce mois'}</p>
        </div>
      </div>

      {/* Budget bar */}
      {budget > 0 && (
        <div style={{ ...CARD, marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', color: C.textMid }}>Budget mensuel</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: pct > 90 ? C.red : pct > 70 ? C.orange : C.green }}>{pct}%</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, borderRadius: '999px', background: pct > 90 ? C.red : pct > 70 ? C.orange : C.green, transition: 'width 0.5s ease' }} />
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <Btn onClick={() => { setForm({ type: 'depense', category: 'Autre' }); setModal('tx') }} small variant="danger"><Plus size={13} /> Dépense</Btn>
        <Btn onClick={() => { setForm({ type: 'revenu' }); setModal('tx') }} small variant="success"><Plus size={13} /> Revenu</Btn>
        <Btn onClick={() => { setForm({}); setModal('obj') }} small variant="gold"><Plus size={13} /> Épargne</Btn>
        <Btn onClick={() => { setForm({ budget }); setModal('budget') }} small variant="ghost"><Settings size={12} /> Budget</Btn>
      </div>

      {/* Objectifs épargne */}
      {objs.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 className="serif" style={{ fontSize: '22px', marginBottom: '12px' }}>Objectifs épargne</h3>
          {objs.map(o => {
            const p = o.cible > 0 ? Math.min(100, Math.round(o.actuel / o.cible * 100)) : 0
            return (
              <div key={o.id} style={{ ...CARD, marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{o.label}</span>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span className="serif" style={{ fontSize: '18px', color: C.gold }}>{p}%</span>
                    <button onClick={() => delObj(o.id)} style={{ background: 'none', border: 'none', color: C.textDim, cursor: 'pointer' }}><Trash2 size={12} /></button>
                  </div>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden', marginBottom: '10px' }}>
                  <div style={{ height: '100%', width: `${p}%`, background: `linear-gradient(90deg, ${C.gold}, #b8893a)`, borderRadius: '999px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="number" value={o.actuel} onChange={e => updateObjActuel(o.id, e.target.value)}
                    style={{ ...INP, padding: '7px 10px', fontSize: '13px', width: '110px' }} />
                  <span style={{ color: C.textDim, fontSize: '12px' }}>/ {fmtAmt(o.cible)} FCFA</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Transactions */}
      <h3 className="serif" style={{ fontSize: '22px', marginBottom: '12px' }}>Transactions</h3>
      {txs.length === 0 ? (
        <div style={{ ...CARD, textAlign: 'center', padding: '40px' }}>
          <DollarSign size={28} style={{ color: C.textDim, marginBottom: '10px' }} />
          <p style={{ color: C.textDim, fontSize: '13px' }}>Aucune transaction. Ajoute ta première dépense ou revenu.</p>
        </div>
      ) : txs.slice(0, 30).map(tx => (
        <div key={tx.id} style={{ ...CARD, padding: '13px 15px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: tx.type === 'revenu' ? C.greenDim : C.redDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {tx.type === 'revenu' ? <TrendingUp size={15} style={{ color: C.green }} /> : <TrendingDown size={15} style={{ color: C.red }} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '14px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.label}</p>
            <p style={{ fontSize: '11px', color: C.textDim, marginTop: '1px' }}>{tx.category} · {fmtDateShort(tx.date)}</p>
          </div>
          <p style={{ fontSize: '15px', fontWeight: 600, color: tx.type === 'revenu' ? C.green : C.red, flexShrink: 0 }}>{tx.type === 'revenu' ? '+' : '-'}{fmtAmt(tx.amount)}</p>
          <button onClick={() => delTx(tx.id)} style={{ background: 'none', border: 'none', color: C.textDim, cursor: 'pointer', padding: '3px', flexShrink: 0 }}><Trash2 size={12} /></button>
        </div>
      ))}

      {modal === 'tx' && (
        <Modal title={form.type === 'revenu' ? 'Ajouter un revenu' : 'Ajouter une dépense'} onClose={() => setModal(null)}>
          <Input label="Description" value={form.label || ''} onChange={v => setForm(f => ({ ...f, label: v }))} placeholder="Ex: Courses, Salaire…" />
          <Input label="Montant (FCFA)" type="number" value={form.amount || ''} onChange={v => setForm(f => ({ ...f, amount: v }))} placeholder="0" />
          {form.type === 'depense' && (
            <div>
              <label style={{ color: C.textMid, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>Catégorie</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                {FIN_CAT.map(c => <Tag key={c} label={c} selected={form.category === c} onClick={() => setForm(f => ({ ...f, category: c }))} />)}
              </div>
            </div>
          )}
          <Btn onClick={addTx} full disabled={!form.amount || !form.label}>Enregistrer</Btn>
        </Modal>
      )}
      {modal === 'obj' && (
        <Modal title="Objectif d'épargne" onClose={() => setModal(null)}>
          <Input label="Nom" value={form.label || ''} onChange={v => setForm(f => ({ ...f, label: v }))} placeholder="Ex: Voyage, Voiture…" />
          <Input label="Montant cible (FCFA)" type="number" value={form.cible || ''} onChange={v => setForm(f => ({ ...f, cible: v }))} placeholder="0" />
          <Btn onClick={addObj} full disabled={!form.label || !form.cible}>Créer</Btn>
        </Modal>
      )}
      {modal === 'budget' && (
        <Modal title="Budget mensuel" subtitle="L'IA te préviendra si tu le dépasses" onClose={() => setModal(null)}>
          <Input label="Plafond de dépenses (FCFA)" type="number" value={form.budget !== undefined ? form.budget : budget} onChange={v => setForm(f => ({ ...f, budget: v }))} placeholder="Ex: 150 000" />
          <Btn onClick={setBudget} full>Définir</Btn>
        </Modal>
      )}
    </div>
  )
}

// ── OBJECTIFS & HABITUDES ─────────────────────────────────────────────────────
function ObjectifsTab({ data, update }) {
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const items = data.objectifs || []
  const habits = items.filter(o => o.isHabit)
  const goals = items.filter(o => !o.isHabit)
  const todayStr = today()
  const doneCount = habits.filter(h => h.lastDone === todayStr).length

  const toggle = id => {
    update(d => ({ ...d, objectifs: d.objectifs.map(o => {
      if (o.id !== id) return o
      const done = o.lastDone === todayStr
      const streak = done ? Math.max(0, (o.streak || 0) - 1) : (daysSince(o.lastDone) <= 1 ? (o.streak || 0) + 1 : 1)
      return { ...o, lastDone: done ? null : todayStr, streak }
    })}))
  }

  const add = () => {
    if (!form.label) return
    update(d => ({ ...d, objectifs: [...(d.objectifs || []), { id: uid(), label: form.label, isHabit: !!form.isHabit, streak: 0, lastDone: null, progress: 0, notes: form.notes || '', createdAt: now() }] }))
    setModal(null); setForm({})
  }

  const del = id => update(d => ({ ...d, objectifs: d.objectifs.filter(o => o.id !== id) }))
  const setProgress = (id, val) => update(d => ({ ...d, objectifs: d.objectifs.map(o => o.id === id ? { ...o, progress: Math.min(100, Math.max(0, parseInt(val) || 0)) } : o) }))

  return (
    <div style={{ padding: '16px', paddingBottom: '90px', maxWidth: '480px', margin: '0 auto' }}>
      {/* Habitudes */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 className="serif" style={{ fontSize: '28px', lineHeight: 1 }}>Habitudes</h2>
          {habits.length > 0 && <p style={{ color: C.textDim, fontSize: '12px', marginTop: '3px' }}>{doneCount}/{habits.length} aujourd'hui</p>}
        </div>
        <Btn onClick={() => { setForm({ isHabit: true }); setModal('add') }} small><Plus size={13} /></Btn>
      </div>

      {habits.length === 0 ? (
        <div style={{ ...CARD, textAlign: 'center', padding: '32px', marginBottom: '28px' }}>
          <Flame size={26} style={{ color: C.textDim, marginBottom: '10px' }} />
          <p style={{ color: C.textDim, fontSize: '13px' }}>Commence par une seule habitude. Une seule.</p>
        </div>
      ) : (
        <div style={{ marginBottom: '28px' }}>
          {habits.map(h => {
            const done = h.lastDone === todayStr
            return (
              <div key={h.id} style={{ ...CARD, display: 'flex', alignItems: 'center', gap: '13px', marginBottom: '9px', background: done ? 'rgba(74,222,128,0.04)' : C.surface, border: `1px solid ${done ? 'rgba(74,222,128,0.15)' : C.border}` }}>
                <button onClick={() => toggle(h.id)} style={{ width: '34px', height: '34px', borderRadius: '10px', border: `2px solid ${done ? C.green : C.border}`, background: done ? C.greenDim : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                  {done && <Check size={16} style={{ color: C.green }} />}
                </button>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: done ? C.textMid : C.text, textDecoration: done ? 'line-through' : 'none' }}>{h.label}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <Flame size={11} style={{ color: h.streak > 0 ? C.orange : C.textDim }} />
                    <span style={{ fontSize: '11px', color: h.streak > 0 ? C.orange : C.textDim }}>{h.streak} jour{h.streak !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <button onClick={() => del(h.id)} style={{ background: 'none', border: 'none', color: C.textDim, cursor: 'pointer' }}><Trash2 size={12} /></button>
              </div>
            )
          })}
        </div>
      )}

      {/* Objectifs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 className="serif" style={{ fontSize: '28px' }}>Objectifs</h2>
        <Btn onClick={() => { setForm({ isHabit: false }); setModal('add') }} small><Plus size={13} /></Btn>
      </div>

      {goals.length === 0 ? (
        <div style={{ ...CARD, textAlign: 'center', padding: '32px' }}>
          <Target size={26} style={{ color: C.textDim, marginBottom: '10px' }} />
          <p style={{ color: C.textDim, fontSize: '13px' }}>Qu'est-ce que tu veux accomplir ?</p>
        </div>
      ) : goals.map(g => (
        <div key={g.id} style={{ ...CARD, marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: 500 }}>{g.label}</p>
              {g.notes && <p style={{ color: C.textDim, fontSize: '12px', marginTop: '3px' }}>{g.notes}</p>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, marginLeft: '12px' }}>
              <span className="serif" style={{ fontSize: '22px', color: g.progress === 100 ? C.green : C.gold }}>{g.progress}%</span>
              <button onClick={() => del(g.id)} style={{ background: 'none', border: 'none', color: C.textDim, cursor: 'pointer' }}><Trash2 size={12} /></button>
            </div>
          </div>
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden', marginBottom: '10px' }}>
            <div style={{ height: '100%', width: `${g.progress}%`, background: g.progress === 100 ? C.green : `linear-gradient(90deg, ${C.gold}, #b8893a)`, borderRadius: '999px', transition: 'width 0.4s ease' }} />
          </div>
          <input type="range" min={0} max={100} value={g.progress} onChange={e => setProgress(g.id, e.target.value)}
            style={{ width: '100%', cursor: 'pointer', accentColor: C.gold }} />
        </div>
      ))}

      {modal === 'add' && (
        <Modal title={form.isHabit ? 'Nouvelle habitude' : 'Nouvel objectif'} onClose={() => setModal(null)}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['Habitude', 'Objectif'].map((l, i) => (
              <button key={l} onClick={() => setForm(f => ({ ...f, isHabit: i === 0 }))}
                style={{ flex: 1, padding: '10px', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, border: 'none', background: (form.isHabit ? i === 0 : i === 1) ? C.goldDim : C.surface, color: (form.isHabit ? i === 0 : i === 1) ? C.gold : C.textMid, fontFamily: 'DM Sans, sans-serif' }}>
                {l}
              </button>
            ))}
          </div>
          <Input label="Nom" value={form.label || ''} onChange={v => setForm(f => ({ ...f, label: v }))} placeholder={form.isHabit ? 'Ex: Méditer 10 min, Lire…' : 'Ex: Apprendre la guitare…'} />
          {!form.isHabit && <Input label="Notes" value={form.notes || ''} onChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="Contexte, étapes clés…" />}
          <Btn onClick={add} full disabled={!form.label}>Créer</Btn>
        </Modal>
      )}
    </div>
  )
}

// ── RELATIONS ─────────────────────────────────────────────────────────────────
const REL_CAT = ['Famille', 'Ami·e', 'Collègue', 'Mentor', 'Partenaire', 'Réseau']

function RelationsTab({ data, update }) {
  const [modal, setModal] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [form, setForm] = useState({})
  const [note, setNote] = useState('')
  const relations = data.relations || []
  const overdue = relations.filter(r => daysSince(r.lastContact) > (r.reminderDays || 30))

  const add = () => {
    if (!form.name) return
    update(d => ({ ...d, relations: [...(d.relations || []), { id: uid(), name: form.name, category: form.category || 'Ami·e', lastContact: today(), notes: form.notes || '', importance: form.importance || 3, reminderDays: parseInt(form.reminderDays) || 30 }] }))
    setModal(null); setForm({})
  }
  const markContacted = id => update(d => ({ ...d, relations: d.relations.map(r => r.id === id ? { ...r, lastContact: today() } : r) }))
  const addNote = (id) => {
    if (!note.trim()) return
    update(d => ({ ...d, relations: d.relations.map(r => r.id === id ? { ...r, notes: [note.trim(), r.notes].filter(Boolean).join('\n\n— ') } : r) }))
    setNote('')
  }
  const del = id => { update(d => ({ ...d, relations: d.relations.filter(r => r.id !== id) })); setExpanded(null) }
  const sorted = [...relations].sort((a, b) => (b.importance - a.importance) || (daysSince(a.lastContact) - daysSince(b.lastContact)))

  return (
    <div style={{ padding: '16px', paddingBottom: '90px', maxWidth: '480px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h2 className="serif" style={{ fontSize: '28px', lineHeight: 1 }}>Relations</h2>
          {overdue.length > 0 && <p style={{ color: C.red, fontSize: '12px', marginTop: '3px' }}>{overdue.length} personne{overdue.length > 1 ? 's' : ''} à recontacter</p>}
        </div>
        <Btn onClick={() => { setForm({ importance: 3 }); setModal('add') }} small><Plus size={13} /> Ajouter</Btn>
      </div>

      {relations.length === 0 ? (
        <div style={{ ...CARD, textAlign: 'center', padding: '40px' }}>
          <Users size={28} style={{ color: C.textDim, marginBottom: '12px' }} />
          <p style={{ color: C.textDim, fontSize: '13px' }}>Qui compte dans ta vie ? Commence par 3 personnes.</p>
        </div>
      ) : sorted.map(r => {
        const days = daysSince(r.lastContact)
        const ov = days > (r.reminderDays || 30)
        const isExp = expanded === r.id
        return (
          <div key={r.id} style={{ ...CARD, marginBottom: '10px', border: `1px solid ${ov ? 'rgba(248,113,113,0.2)' : C.border}`, background: ov ? 'rgba(248,113,113,0.03)' : C.surface }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '13px', cursor: 'pointer' }} onClick={() => setExpanded(isExp ? null : r.id)}>
              <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: ov ? C.redDim : C.blueDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="serif" style={{ fontSize: '22px', fontWeight: 600, color: ov ? C.red : C.blue }}>{r.name[0].toUpperCase()}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 600 }}>{r.name}</p>
                  <span style={{ fontSize: '10px', color: C.textDim, background: C.surface, borderRadius: '999px', padding: '2px 8px', border: `1px solid ${C.border}` }}>{r.category}</span>
                </div>
                <p style={{ fontSize: '12px', color: ov ? C.red : C.textDim }}>{days === 0 ? "Contacté aujourd'hui" : `Il y a ${days} jour${days > 1 ? 's' : ''}`}{ov ? ' · À recontacter ⚠️' : ''}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} size={10} style={{ color: s <= r.importance ? C.gold : C.textDim, fill: s <= r.importance ? C.gold : 'none' }} />)}
                </div>
                {isExp ? <ChevronUp size={13} style={{ color: C.textDim }} /> : <ChevronDown size={13} style={{ color: C.textDim }} />}
              </div>
            </div>

            {isExp && (
              <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: `1px solid ${C.border}`, animation: 'fadeIn 0.2s ease' }}>
                {r.notes && <p style={{ color: C.textMid, fontSize: '13px', marginBottom: '14px', whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>{r.notes}</p>}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note rapide…"
                    onKeyDown={e => e.key === 'Enter' && addNote(r.id)}
                    style={{ ...INP, padding: '9px 12px', fontSize: '13px', flex: 1 }} />
                  <button onClick={() => addNote(r.id)} style={{ background: C.goldDim, border: `1px solid rgba(212,168,83,0.2)`, borderRadius: '10px', padding: '9px 13px', cursor: 'pointer', color: C.gold }}>
                    <Plus size={13} />
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Btn onClick={() => markContacted(r.id)} variant="success" small><Check size={12} /> Contacté</Btn>
                  <Btn onClick={() => del(r.id)} variant="danger" small><Trash2 size={12} /></Btn>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {modal === 'add' && (
        <Modal title="Nouveau contact" onClose={() => setModal(null)}>
          <Input label="Prénom / Nom" value={form.name || ''} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Ex: Marie Dupont" />
          <div>
            <label style={{ color: C.textMid, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>Relation</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              {REL_CAT.map(c => <Tag key={c} label={c} selected={form.category === c} onClick={() => setForm(f => ({ ...f, category: c }))} />)}
            </div>
          </div>
          <div>
            <label style={{ color: C.textMid, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>Importance</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setForm(f => ({ ...f, importance: s }))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                  <Star size={24} style={{ color: s <= (form.importance || 3) ? C.gold : C.textDim, fill: s <= (form.importance || 3) ? C.gold : 'none', transition: 'all 0.15s' }} />
                </button>
              ))}
            </div>
          </div>
          <Input label="Rappel (tous les X jours)" type="number" value={form.reminderDays || '30'} onChange={v => setForm(f => ({ ...f, reminderDays: v }))} placeholder="30" />
          <Input label="Notes (optionnel)" value={form.notes || ''} onChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="Ce qui compte pour cette personne…" />
          <Btn onClick={add} full disabled={!form.name}>Ajouter</Btn>
        </Modal>
      )}
    </div>
  )
}

// ── RÉGLAGES ──────────────────────────────────────────────────────────────────
function SettingsModal({ data, update, onClose }) {
  const [key, setKey] = useState(data?.user?.apiKey || '')
  const save = () => { update(d => ({ ...d, user: { ...d.user, apiKey: key.trim() } })); onClose() }
  return (
    <Modal title="Réglages" subtitle="Paramètres de ton espace" onClose={onClose}>
      <div style={{ ...CARD, background: C.goldDim, border: `1px solid rgba(212,168,83,0.2)`, padding: '14px 16px' }}>
        <p style={{ color: C.gold, fontSize: '13px', lineHeight: 1.6 }}>
          <strong>Clé API Anthropic</strong><br />
          Nécessaire uniquement si tu utilises l'app en dehors de Claude.ai (ex: Netlify). Dans Claude.ai, l'IA fonctionne gratuitement sans clé.
        </p>
      </div>
      <Input label="Clé API (optionnel)" value={key} onChange={setKey} placeholder="sk-ant-api03-..." />
      <Btn onClick={save} full>Enregistrer</Btn>
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '16px' }}>
        <p style={{ color: C.textDim, fontSize: '12px', marginBottom: '10px' }}>Données de l'app</p>
        <Btn onClick={() => { if (window.confirm('Supprimer toutes tes données ?')) { localStorage.removeItem(KEY); window.location.reload() } }} variant="danger" full small>
          <Trash2 size={12} /> Supprimer mes données
        </Btn>
      </div>
    </Modal>
  )
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
function MainApp({ data, update }) {
  const [tab, setTab] = useState('home')
  const [showSettings, setShowSettings] = useState(false)
  const TABS = [
    { id: 'home', Icon: Home, label: 'Accueil' },
    { id: 'finances', Icon: DollarSign, label: 'Finances' },
    { id: 'objectifs', Icon: Target, label: 'Objectifs' },
    { id: 'relations', Icon: Users, label: 'Relations' },
  ]
  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <header style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 20, background: `${C.bg}f2`, backdropFilter: 'blur(14px)' }}>
        <span className="serif" style={{ fontSize: '24px', color: C.gold, fontWeight: 600, letterSpacing: '-0.5px' }}>My All</span>
        <button onClick={() => setShowSettings(true)} style={{ background: 'none', border: 'none', color: C.textDim, cursor: 'pointer', padding: '6px', borderRadius: '8px' }}><Settings size={17} /></button>
      </header>
      <div style={{ paddingBottom: '70px' }}>
        {tab === 'home' && <HomeTab data={data} update={update} />}
        {tab === 'finances' && <FinancesTab data={data} update={update} />}
        {tab === 'objectifs' && <ObjectifsTab data={data} update={update} />}
        {tab === 'relations' && <RelationsTab data={data} update={update} />}
      </div>
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: `${C.bg}f2`, backdropFilter: 'blur(14px)', borderTop: `1px solid ${C.border}`, display: 'flex', padding: '8px 0 10px' }}>
        {TABS.map(({ id, Icon, label }) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', padding: '5px 0' }}>
            <Icon size={21} style={{ color: tab === id ? C.gold : C.textDim, transition: 'color 0.15s' }} />
            <span style={{ fontSize: '10px', fontWeight: tab === id ? 600 : 400, color: tab === id ? C.gold : C.textDim, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.15s' }}>{label}</span>
          </button>
        ))}
      </nav>
      {showSettings && <SettingsModal data={data} update={update} onClose={() => setShowSettings(false)} />}
    </div>
  )
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [state, setState] = useState('loading')
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!document.getElementById('myall-fonts')) {
      const s = document.createElement('style')
      s.id = 'myall-fonts'
      s.textContent = FONTS
      document.head.appendChild(s)
    }
    const d = loadData()
    if (d?.user?.name) { setData(d); setState('main') }
    else setState('onboarding')
  }, [])

  const update = useCallback((updater) => {
    setData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      saveData(next)
      return next
    })
  }, [])

  if (state === 'loading') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
      <span className="serif" style={{ fontSize: '36px', color: C.gold }}>My All</span>
    </div>
  )

  if (state === 'onboarding') return (
    <Onboarding onDone={name => {
      const d = mkDefault(name)
      setData(d); saveData(d); setState('main')
    }} />
  )

  return <MainApp data={data} update={update} />
}
