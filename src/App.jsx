import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import AuthScreen from "./AuthScreen";
import ProfileSetup from "./ProfileSetup";

/* ═══════════════════════════════════════════
   SWINGERS — Golf Tee Time Marketplace
   ═══════════════════════════════════════════ */

// ── Mock Data ──────────────────────────────
const COURSES_NASHVILLE = [
  "Gaylord Springs", "Hermitage Golf Course", "McCabe Golf Course",
  "Ted Rhodes Golf Course", "Harpeth Hills", "Temple Hills",
  "Nashboro Golf Club", "Windtree Golf Course", "The Grove",
  "Greystone Golf Club", "Indian Hills Golf Course",
];

const MOCK_TEE_TIMES = [
  {
    id: "tt1",
    hostName: "Chris H.",
    hostHandicap: 8.2,
    hostAvatar: "🧢",
    hostVerified: true,
    course: "Gaylord Springs",
    date: "Sat, Mar 14",
    time: "8:40 AM",
    holes: 18,
    spotsOpen: 2,
    spotsTotal: 4,
    riding: true,
    walking: false,
    music: false,
    drinking: true,
    smoking: false,
    pace: "4hr 15min",
    groupHandicapRange: "6-14",
    note: "Playing from the tips. Competitive but friendly. $10 nassau if you're in.",
    applicants: [
      { id: "a1", name: "Tyler R.", handicap: 18.7, avatar: "🍺", verified: true, note: "Down for the nassau. Might need a few strokes though!", preferences: { riding: true, music: false, drinking: true } },
      { id: "a2", name: "David K.", handicap: 11.4, avatar: "🎯", verified: true, note: "Love Gaylord Springs. Consistent ball striker, won't slow you down.", preferences: { riding: true, music: false, drinking: false } },
    ],
  },
  {
    id: "tt2",
    hostName: "Jordan E.",
    hostHandicap: 14.5,
    hostAvatar: "⛳",
    hostVerified: true,
    course: "McCabe Golf Course",
    date: "Sun, Mar 15",
    time: "10:20 AM",
    holes: 9,
    spotsOpen: 3,
    spotsTotal: 4,
    riding: false,
    walking: true,
    music: true,
    drinking: true,
    smoking: false,
    pace: "2hr 10min",
    groupHandicapRange: "Any",
    note: "Casual 9 holes. Walking, speakers on, beers in the bag. All skill levels welcome.",
    applicants: [],
  },
  {
    id: "tt3",
    hostName: "Marcus W.",
    hostHandicap: 3.1,
    hostAvatar: "🏆",
    hostVerified: true,
    course: "The Grove",
    date: "Mon, Mar 16",
    time: "7:00 AM",
    holes: 18,
    spotsOpen: 1,
    spotsTotal: 4,
    riding: false,
    walking: true,
    music: false,
    drinking: false,
    smoking: false,
    pace: "3hr 50min",
    groupHandicapRange: "0-8",
    note: "Serious round. Walking only, no distractions. Looking for a single digit who can keep pace.",
    applicants: [
      { id: "a3", name: "Ryan O.", handicap: 6.0, avatar: "🌅", verified: true, note: "6 handicap, walk every round. Let's compete.", preferences: { riding: false, music: false, drinking: false } },
    ],
  },
];

// ── Style Constants ────────────────────────
const C = {
  bg: "#060e06",
  card: "#0c1a0c",
  cardBorder: "rgba(168,148,96,0.1)",
  gold: "#c4b482",
  goldDim: "rgba(168,148,96,0.5)",
  goldFaint: "rgba(168,148,96,0.08)",
  cream: "#f0ead6",
  creamDim: "rgba(240,234,214,0.65)",
  green: "#4ade80",
  greenDim: "rgba(74,222,128,0.12)",
  red: "#f87171",
  redDim: "rgba(248,113,113,0.1)",
};

const font = {
  display: "'Playfair Display', serif",
  heading: "'Oswald', sans-serif",
  body: "'Source Sans 3', sans-serif",
};

// ── Shared Components ──────────────────────
function Badge({ children, color = C.gold, style: sx = {} }) {
  return (
    <span style={{
      fontFamily: font.body, fontSize: 11, fontWeight: 600,
      color, background: `${color}15`, border: `1px solid ${color}25`,
      borderRadius: 6, padding: "3px 9px", letterSpacing: 0.3,
      whiteSpace: "nowrap", ...sx,
    }}>{children}</span>
  );
}

function PrefIcon({ active, label, emoji }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 5,
      opacity: active ? 1 : 0.25,
      fontFamily: font.body, fontSize: 12, color: C.creamDim,
    }}>
      <span style={{ fontSize: 14 }}>{emoji}</span>
      <span>{label}</span>
    </div>
  );
}

function VerifiedBadge() {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      fontFamily: font.body, fontSize: 10, fontWeight: 600,
      color: C.green, background: C.greenDim,
      borderRadius: 4, padding: "2px 7px", letterSpacing: 0.5,
    }}>✓ Verified</span>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: font.heading, fontSize: 10, letterSpacing: 2.5,
      textTransform: "uppercase", color: C.goldDim, marginBottom: 10,
    }}>{children}</div>
  );
}

function ActionButton({ children, primary, danger, small, onClick, disabled, style: sx = {} }) {
  const bg = primary ? `linear-gradient(135deg, ${C.gold}, #a89460)` : danger ? C.redDim : "transparent";
  const color = primary ? C.bg : danger ? C.red : C.gold;
  const border = primary ? "none" : danger ? `1px solid ${C.red}30` : `1px solid ${C.gold}30`;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      fontFamily: font.heading, fontSize: small ? 11 : 13,
      letterSpacing: small ? 1.5 : 2, textTransform: "uppercase",
      fontWeight: 700, padding: small ? "8px 16px" : "12px 28px",
      borderRadius: 10, border, background: bg, color,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.4 : 1, transition: "all 0.2s", ...sx,
    }}>{children}</button>
  );
}

// ── Tee Time Card ──────────────────────────
function TeeTimeCard({ teeTime: t, onTap, isHost, onViewApplicants }) {
  const prefs = [
    { key: "riding", emoji: "🛒", label: "Cart" },
    { key: "walking", emoji: "🚶", label: "Walk" },
    { key: "music", emoji: "🎵", label: "Music" },
    { key: "drinking", emoji: "🍺", label: "Drinks" },
    { key: "smoking", emoji: "🚬", label: "Smoke" },
  ];

  return (
    <div
      onClick={onTap}
      style={{
        background: `linear-gradient(170deg, ${C.card} 0%, #081408 100%)`,
        border: `1px solid ${C.cardBorder}`, borderRadius: 20, overflow: "hidden",
        cursor: onTap ? "pointer" : "default", transition: "border-color 0.2s, transform 0.2s",
      }}
      onMouseEnter={e => { if (onTap) { e.currentTarget.style.borderColor = `${C.gold}30`; e.currentTarget.style.transform = "translateY(-2px)"; } }}
      onMouseLeave={e => { if (onTap) { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.transform = "translateY(0)"; } }}
    >
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px 14px", borderBottom: `1px solid ${C.cardBorder}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 14, background: C.goldFaint,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
          }}>{t.hostAvatar}</div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: font.display, fontSize: 17, fontWeight: 700, color: C.cream }}>{t.hostName}</span>
              {t.hostVerified && <VerifiedBadge />}
            </div>
            <span style={{ fontFamily: font.body, fontSize: 12, color: C.goldDim }}>{t.hostHandicap} HCP</span>
          </div>
        </div>
        <Badge color={C.green}>{t.spotsOpen} spot{t.spotsOpen > 1 ? "s" : ""}</Badge>
      </div>

      <div style={{ padding: "16px 20px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: font.display, fontSize: 20, fontWeight: 700, color: C.cream, marginBottom: 3 }}>{t.course}</div>
            <div style={{ fontFamily: font.body, fontSize: 13, color: C.goldDim }}>{t.date} · {t.time} · {t.holes} holes</div>
          </div>
          <div style={{
            fontFamily: font.heading, fontSize: 13, fontWeight: 600,
            color: C.gold, background: C.goldFaint, borderRadius: 8, padding: "6px 12px",
          }}>{t.groupHandicapRange} HCP</div>
        </div>

        <div style={{ display: "flex", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
          {prefs.map(p => <PrefIcon key={p.key} active={t[p.key]} label={p.label} emoji={p.emoji} />)}
          <div style={{ fontFamily: font.body, fontSize: 12, color: C.goldDim, display: "flex", alignItems: "center", gap: 4 }}>⏱ {t.pace}</div>
        </div>

        {t.note && (
          <p style={{ fontFamily: font.body, fontSize: 14, lineHeight: 1.5, color: C.creamDim, margin: 0, fontStyle: "italic" }}>"{t.note}"</p>
        )}

        {isHost && t.applicants?.length > 0 && (
          <div
            onClick={(e) => { e.stopPropagation(); onViewApplicants?.(t); }}
            style={{
              marginTop: 14, padding: "12px 16px", borderRadius: 12,
              background: `linear-gradient(135deg, ${C.greenDim}, rgba(74,222,128,0.04))`,
              border: `1px solid ${C.green}20`,
              display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer",
            }}
          >
            <span style={{ fontFamily: font.body, fontSize: 14, fontWeight: 600, color: C.green }}>
              {t.applicants.length} player{t.applicants.length > 1 ? "s" : ""} interested
            </span>
            <span style={{ fontFamily: font.body, fontSize: 13, color: C.green }}>Review →</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Host Flow (Post Tee Time) ──────────────
function HostFlow({ profile, onPost }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    course: "", date: "", time: "", holes: 18, spotsOpen: 1,
    riding: true, walking: false, music: false, drinking: false, smoking: false,
    pace: "4hr 15min", groupHandicapRange: "Any", note: "",
  });
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const inputStyle = {
    fontFamily: font.body, fontSize: 15, color: C.cream,
    background: "rgba(168,148,96,0.06)", border: `1px solid rgba(168,148,96,0.15)`,
    borderRadius: 10, padding: "12px 16px", width: "100%", outline: "none", boxSizing: "border-box",
  };

  if (step === 1) {
    return (
      <div style={{ padding: "20px 20px 120px" }}>
        <h2 style={{ fontFamily: font.display, fontSize: 26, color: C.cream, margin: "0 0 20px", fontWeight: 700 }}>Preview</h2>
        <TeeTimeCard teeTime={{
          ...form, id: "new", hostName: profile.name, hostHandicap: profile.handicap,
          hostAvatar: profile.avatar ?? "🏌️", hostVerified: true, spotsTotal: form.spotsOpen + 1, applicants: [],
          date: form.date ? new Date(form.date + "T00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "—",
          time: form.time || "—",
        }} />
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <ActionButton onClick={() => setStep(0)} style={{ flex: 1 }}>Edit</ActionButton>
          <ActionButton primary onClick={() => {
            onPost(form);
            setStep(0);
            setForm({ course: "", date: "", time: "", holes: 18, spotsOpen: 1, riding: true, walking: false, music: false, drinking: false, smoking: false, pace: "4hr 15min", groupHandicapRange: "Any", note: "" });
          }} style={{ flex: 1 }}>Post Tee Time</ActionButton>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 20px 120px" }}>
      <h2 style={{ fontFamily: font.display, fontSize: 26, color: C.cream, margin: "0 0 4px", fontWeight: 700 }}>Post a Tee Time</h2>
      <p style={{ fontFamily: font.body, fontSize: 14, color: C.goldDim, margin: "0 0 28px" }}>Fill your open spots with the right players</p>

      <SectionLabel>Course & Time</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
        <select value={form.course} onChange={e => update("course", e.target.value)} style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
          <option value="">Select a course...</option>
          {COURSES_NASHVILLE.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ display: "flex", gap: 12 }}>
          <input type="date" value={form.date} onChange={e => update("date", e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          <input type="time" value={form.time} onChange={e => update("time", e.target.value)} style={{ ...inputStyle, flex: 1 }} />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontFamily: font.body, fontSize: 12, color: C.goldDim, marginBottom: 6, display: "block" }}>Holes</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[9, 18].map(h => (
                <button key={h} onClick={() => update("holes", h)} style={{
                  flex: 1, padding: "10px 0", borderRadius: 8, fontFamily: font.heading, fontSize: 15, fontWeight: 600,
                  border: form.holes === h ? `2px solid ${C.gold}` : `1px solid rgba(168,148,96,0.15)`,
                  background: form.holes === h ? C.goldFaint : "transparent",
                  color: form.holes === h ? C.gold : C.creamDim, cursor: "pointer", transition: "all 0.2s",
                }}>{h}</button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontFamily: font.body, fontSize: 12, color: C.goldDim, marginBottom: 6, display: "block" }}>Open Spots</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[1, 2, 3].map(s => (
                <button key={s} onClick={() => update("spotsOpen", s)} style={{
                  flex: 1, padding: "10px 0", borderRadius: 8, fontFamily: font.heading, fontSize: 15, fontWeight: 600,
                  border: form.spotsOpen === s ? `2px solid ${C.gold}` : `1px solid rgba(168,148,96,0.15)`,
                  background: form.spotsOpen === s ? C.goldFaint : "transparent",
                  color: form.spotsOpen === s ? C.gold : C.creamDim, cursor: "pointer", transition: "all 0.2s",
                }}>{s}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <SectionLabel>Group Vibe</SectionLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
        {[
          { key: "riding", label: "Riding", emoji: "🛒" },
          { key: "walking", label: "Walking", emoji: "🚶" },
          { key: "music", label: "Music OK", emoji: "🎵" },
          { key: "drinking", label: "Drinking", emoji: "🍺" },
          { key: "smoking", label: "Smoking", emoji: "🚬" },
        ].map(p => (
          <button key={p.key} onClick={() => update(p.key, !form[p.key])} style={{
            display: "flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 10,
            fontFamily: font.body, fontSize: 14,
            border: form[p.key] ? `1.5px solid ${C.gold}50` : `1px solid rgba(168,148,96,0.12)`,
            background: form[p.key] ? C.goldFaint : "transparent",
            color: form[p.key] ? C.cream : C.creamDim, cursor: "pointer", transition: "all 0.2s",
          }}>
            <span>{p.emoji}</span> {p.label}
          </button>
        ))}
      </div>

      <SectionLabel>Pace & Skill</SectionLabel>
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <select value={form.pace} onChange={e => update("pace", e.target.value)} style={{ ...inputStyle, flex: 1, appearance: "none", cursor: "pointer" }}>
          {["3hr 30min", "3hr 45min", "4hr 00min", "4hr 15min", "4hr 30min", "4hr 45min", "5hr+"].map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select value={form.groupHandicapRange} onChange={e => update("groupHandicapRange", e.target.value)} style={{ ...inputStyle, flex: 1, appearance: "none", cursor: "pointer" }}>
          {["Any", "0-8", "5-15", "10-20", "15-25", "20+"].map(r => (
            <option key={r} value={r}>{r} HCP</option>
          ))}
        </select>
      </div>

      <SectionLabel>Note to Players</SectionLabel>
      <textarea value={form.note} onChange={e => update("note", e.target.value)}
        placeholder="Anything else players should know? Wagers, format, dress code..."
        rows={3} style={{ ...inputStyle, resize: "none", marginBottom: 28 }} />

      <ActionButton primary disabled={!form.course || !form.date || !form.time}
        onClick={() => setStep(1)} style={{ width: "100%" }}>
        Preview & Post
      </ActionButton>
    </div>
  );
}

// ── Applicant Review ───────────────────────
function ApplicantReview({ teeTime, onBack, onAccept, onDecline }) {
  return (
    <div style={{ padding: "20px 20px 120px" }}>
      <button onClick={onBack} style={{
        fontFamily: font.body, fontSize: 14, color: C.goldDim,
        background: "none", border: "none", cursor: "pointer", marginBottom: 16, padding: 0,
      }}>← Back to My Tee Times</button>

      <h2 style={{ fontFamily: font.display, fontSize: 22, color: C.cream, margin: "0 0 4px", fontWeight: 700 }}>
        Applicants for {teeTime.course}
      </h2>
      <p style={{ fontFamily: font.body, fontSize: 13, color: C.goldDim, margin: "0 0 20px" }}>
        {teeTime.date} · {teeTime.time} · {teeTime.spotsOpen} spot{teeTime.spotsOpen > 1 ? "s" : ""} remaining
      </p>

      {teeTime.applicants.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏌️</div>
          <div style={{ fontFamily: font.body, fontSize: 15, color: C.goldDim }}>No applicants yet</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {teeTime.applicants.map(a => (
            <div key={a.id} style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 18, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                <div style={{
                  width: 50, height: 50, borderRadius: 16, background: C.goldFaint,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
                }}>{a.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: font.display, fontSize: 18, fontWeight: 700, color: C.cream }}>{a.name}</span>
                    {a.verified && <VerifiedBadge />}
                  </div>
                  <span style={{ fontFamily: font.body, fontSize: 13, color: C.goldDim }}>{a.handicap} HCP</span>
                </div>
                <Badge color={C.green} style={{ fontSize: 10 }}>💳 Linked</Badge>
              </div>
              {a.note && <p style={{ fontFamily: font.body, fontSize: 14, lineHeight: 1.5, color: C.creamDim, margin: "0 0 14px", fontStyle: "italic" }}>"{a.note}"</p>}
              <div style={{ display: "flex", gap: 10 }}>
                <ActionButton small danger onClick={() => onDecline(teeTime.id, a.id)} style={{ flex: 1 }}>Pass</ActionButton>
                <ActionButton small primary onClick={() => onAccept(teeTime.id, a.id)} style={{ flex: 1 }}>Accept</ActionButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Browse Feed (Player Side) ──────────────
function BrowseFeed({ profile, teeTimes, onApply }) {
  const [selected, setSelected] = useState(null);
  const [applyNote, setApplyNote] = useState("");
  const [applied, setApplied] = useState({});

  if (selected) {
    const t = selected;
    return (
      <div style={{ padding: "20px 20px 120px" }}>
        <button onClick={() => { setSelected(null); setApplyNote(""); }} style={{
          fontFamily: font.body, fontSize: 14, color: C.goldDim,
          background: "none", border: "none", cursor: "pointer", marginBottom: 16, padding: 0,
        }}>← Back to Tee Times</button>
        <TeeTimeCard teeTime={t} />
        {applied[t.id] ? (
          <div style={{
            marginTop: 20, padding: 20, borderRadius: 16,
            background: C.greenDim, border: `1px solid ${C.green}20`, textAlign: "center",
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
            <div style={{ fontFamily: font.display, fontSize: 18, color: C.green, fontWeight: 700 }}>Request Sent</div>
            <div style={{ fontFamily: font.body, fontSize: 13, color: C.creamDim, marginTop: 4 }}>{t.hostName} will review and get back to you</div>
          </div>
        ) : (
          <div style={{ marginTop: 20, padding: 20, borderRadius: 16, background: C.card, border: `1px solid ${C.cardBorder}` }}>
            <SectionLabel>Request to Join</SectionLabel>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, marginBottom: 14, padding: "10px 14px",
              borderRadius: 10, background: C.goldFaint, border: `1px solid ${C.gold}15`,
            }}>
              <span style={{ fontSize: 16 }}>🏌️</span>
              <div>
                <span style={{ fontFamily: font.body, fontSize: 14, fontWeight: 600, color: C.cream }}>{profile.name}</span>
                <span style={{ fontFamily: font.body, fontSize: 12, color: C.goldDim, marginLeft: 8 }}>{profile.handicap} HCP</span>
              </div>
              <div style={{ marginLeft: "auto" }}><Badge color={C.green} style={{ fontSize: 10 }}>💳 {profile.paymentMethod ?? "Not linked"}</Badge></div>
            </div>
            <textarea value={applyNote} onChange={e => setApplyNote(e.target.value)}
              placeholder="Introduce yourself to the group..."
              rows={3} style={{
                fontFamily: font.body, fontSize: 14, color: C.cream, background: "rgba(168,148,96,0.06)",
                border: `1px solid rgba(168,148,96,0.15)`, borderRadius: 10, padding: "12px 16px",
                width: "100%", outline: "none", boxSizing: "border-box", resize: "none", marginBottom: 14,
              }} />
            <ActionButton primary onClick={() => { setApplied(a => ({ ...a, [t.id]: true })); onApply(t.id, applyNote); }} style={{ width: "100%" }}>
              Request to Play
            </ActionButton>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 20px 120px" }}>
      <h2 style={{ fontFamily: font.display, fontSize: 26, color: C.cream, margin: "0 0 4px", fontWeight: 700 }}>Open Tee Times</h2>
      <p style={{ fontFamily: font.body, fontSize: 14, color: C.goldDim, margin: "0 0 24px" }}>Nashville area · Next 7 days</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {teeTimes.filter(t => t.spotsOpen > 0).map(t => (
          <TeeTimeCard key={t.id} teeTime={t} onTap={() => setSelected(t)} />
        ))}
      </div>
    </div>
  );
}

// ── My Tee Times ───────────────────────────
function MyTeeTimes({ teeTimes, onViewApplicants }) {
  if (teeTimes.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 24px" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⛳</div>
        <div style={{ fontFamily: font.display, fontSize: 20, color: C.cream, marginBottom: 6 }}>No tee times posted</div>
        <div style={{ fontFamily: font.body, fontSize: 14, color: C.goldDim }}>Post a tee time to start finding players</div>
      </div>
    );
  }
  return (
    <div style={{ padding: "20px 20px 120px" }}>
      <h2 style={{ fontFamily: font.display, fontSize: 26, color: C.cream, margin: "0 0 20px", fontWeight: 700 }}>My Tee Times</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {teeTimes.map(t => <TeeTimeCard key={t.id} teeTime={t} isHost onViewApplicants={onViewApplicants} />)}
      </div>
    </div>
  );
}

// ── Profile ────────────────────────────────
function ProfileScreen({ profile, onSignOut }) {
  const u = {
    avatar: profile.avatar ?? "🏌️",
    name: profile.name,
    location: profile.location ?? "Nashville, TN",
    paymentMethod: profile.paymentMethod ?? "Not linked",
    handicap: profile.handicap,
    roundsPlayed: profile.roundsPlayed ?? 0,
    matchRating: profile.matchRating ?? 0,
    noShows: profile.noShows ?? 0,
    preferences: profile.preferences ?? { riding: false, walking: false, music: false, drinking: false, smoking: false },
  };
  return (
    <div style={{ padding: "20px 20px 120px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{
          width: 88, height: 88, borderRadius: 28,
          background: `linear-gradient(135deg, ${C.goldFaint}, rgba(168,148,96,0.03))`,
          border: `2px solid ${C.gold}25`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 44, margin: "0 auto 14px",
        }}>{u.avatar}</div>
        <div style={{ fontFamily: font.display, fontSize: 28, fontWeight: 700, color: C.cream }}>{u.name}</div>
        <div style={{ fontFamily: font.body, fontSize: 13, color: C.goldDim, marginTop: 3 }}>{u.location}</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 10, flexWrap: "wrap" }}>
          {profile.verified && <VerifiedBadge />}
          <Badge color={u.paymentMethod !== "Not linked" ? C.green : C.goldDim}>💳 {u.paymentMethod}{u.paymentMethod !== "Not linked" ? " Linked" : ""}</Badge>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
        {[
          { label: "HCP", value: u.handicap },
          { label: "Rounds", value: u.roundsPlayed },
          { label: "Rating", value: `${u.matchRating}★` },
          { label: "No Shows", value: u.noShows },
        ].map(s => (
          <div key={s.label} style={{
            textAlign: "center", padding: "14px 4px",
            background: C.goldFaint, border: `1px solid ${C.cardBorder}`, borderRadius: 14,
          }}>
            <div style={{ fontFamily: font.heading, fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: C.goldDim, marginBottom: 5 }}>{s.label}</div>
            <div style={{ fontFamily: font.display, fontSize: 18, color: C.gold, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: "16px 18px", borderRadius: 14, background: C.goldFaint, border: `1px solid ${C.cardBorder}`, marginBottom: 24 }}>
        <SectionLabel>Preferences</SectionLabel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
          <PrefIcon active={u.preferences.riding} emoji="🛒" label="Cart" />
          <PrefIcon active={u.preferences.walking} emoji="🚶" label="Walk" />
          <PrefIcon active={u.preferences.music} emoji="🎵" label="Music" />
          <PrefIcon active={u.preferences.drinking} emoji="🍺" label="Drinks" />
          <PrefIcon active={u.preferences.smoking} emoji="🚬" label="Smoke" />
        </div>
      </div>
      {["Edit Profile", "Payment Methods", "Notification Settings", "Round History", "Help & Support"].map(item => (
        <div key={item} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "15px 2px", borderBottom: `1px solid ${C.cardBorder}`, cursor: "pointer",
        }}>
          <span style={{ fontFamily: font.body, fontSize: 15, color: C.creamDim }}>{item}</span>
          <span style={{ color: `${C.gold}40`, fontSize: 14 }}>›</span>
        </div>
      ))}
      <div style={{ marginTop: 24 }}>
        <ActionButton danger onClick={onSignOut} style={{ width: "100%" }}>Sign Out</ActionButton>
      </div>
    </div>
  );
}

// ── Toast ──────────────────────────────────
function Toast({ message, type, onDone }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setTimeout(() => setVisible(true), 50);
    const t = setTimeout(() => { setVisible(false); setTimeout(onDone, 300); }, 2800);
    return () => clearTimeout(t);
  }, []);
  const color = type === "success" ? C.green : type === "error" ? C.red : C.gold;
  const bg = type === "success" ? C.greenDim : type === "error" ? C.redDim : C.goldFaint;
  return (
    <div style={{
      position: "fixed", top: 20, left: "50%", transform: `translateX(-50%) translateY(${visible ? 0 : -20}px)`,
      opacity: visible ? 1 : 0, transition: "all 0.3s ease",
      background: bg, border: `1px solid ${color}25`,
      borderRadius: 14, padding: "12px 24px", zIndex: 2000,
      fontFamily: font.body, fontSize: 14, fontWeight: 600, color,
      boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
    }}>{message}</div>
  );
}

// ═══════════════════════════════════════════
// ── Main App ──────────────────────────────
// ═══════════════════════════════════════════
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [tab, setTab] = useState("browse");
  const [teeTimes, setTeeTimes] = useState(MOCK_TEE_TIMES);
  const [myTeeTimes, setMyTeeTimes] = useState([MOCK_TEE_TIMES[0]]);
  const [reviewingTeeTime, setReviewingTeeTime] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (!u) setProfile(null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    setProfileLoading(true);
    getDoc(doc(db, "users", user.uid))
      .then((snap) => {
        if (snap.exists()) setProfile(snap.data());
        else setProfile(null);
      })
      .catch(() => setProfile(null))
      .finally(() => setProfileLoading(false));
  }, [user]);

  const showToast = (message, type = "success") => setToast({ message, type, key: Date.now() });

  const handlePost = (form) => {
    const newTT = {
      ...form, id: `my-${Date.now()}`,
      hostName: profile.name, hostHandicap: profile.handicap,
      hostAvatar: profile.avatar ?? "🏌️", hostVerified: true,
      spotsTotal: form.spotsOpen + 1, applicants: [],
      date: form.date ? new Date(form.date + "T00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "—",
      time: form.time ? new Date(`2000-01-01T${form.time}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "—",
    };
    setMyTeeTimes(prev => [newTT, ...prev]);
    showToast("Tee time posted! Players can now apply.");
    setTab("myTimes");
  };

  const handleApply = (teeTimeId, note) => {
    showToast("Request sent! The host will review your application.");
  };

  const updateTT = (list, teeTimeId, fn) => list.map(t => t.id === teeTimeId ? fn(t) : t);

  const handleAccept = (teeTimeId, applicantId) => {
    const updater = (t) => ({ ...t, spotsOpen: t.spotsOpen - 1, applicants: t.applicants.filter(a => a.id !== applicantId) });
    setTeeTimes(prev => updateTT(prev, teeTimeId, updater));
    setMyTeeTimes(prev => updateTT(prev, teeTimeId, updater));
    if (reviewingTeeTime?.id === teeTimeId) setReviewingTeeTime(prev => updater(prev));
    showToast("Player accepted! They've been notified.");
  };

  const handleDecline = (teeTimeId, applicantId) => {
    const updater = (t) => ({ ...t, applicants: t.applicants.filter(a => a.id !== applicantId) });
    setTeeTimes(prev => updateTT(prev, teeTimeId, updater));
    setMyTeeTimes(prev => updateTT(prev, teeTimeId, updater));
    if (reviewingTeeTime?.id === teeTimeId) setReviewingTeeTime(prev => updater(prev));
    showToast("Player passed.", "error");
  };

  const handleSignOut = () => {
    signOut(auth);
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: font.body, fontSize: 15, color: C.goldDim }}>Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (profileLoading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: font.body, fontSize: 15, color: C.goldDim }}>Loading profile…</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <ProfileSetup
        userId={user.uid}
        courses={COURSES_NASHVILLE}
        onComplete={(p) => setProfile(p)}
      />
    );
  }

  const tabs = [
    { id: "browse", icon: "🔍", label: "Browse" },
    { id: "post", icon: "➕", label: "Post" },
    { id: "myTimes", icon: "📋", label: "My Times" },
    { id: "profile", icon: "👤", label: "Profile" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 440, position: "relative", display: "flex", flexDirection: "column", minHeight: "100vh" }}>

        {/* Top bar */}
        <div style={{
          padding: `calc(18px + var(--sat, 0px)) 22px 10px`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, background: C.bg, zIndex: 100,
          borderBottom: `1px solid ${C.cardBorder}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ fontSize: 20 }}>⛳</span>
            <span style={{ fontFamily: font.display, fontSize: 21, fontWeight: 700, color: C.gold, letterSpacing: -0.5 }}>Swingers</span>
          </div>
          <div style={{ fontFamily: font.heading, fontSize: 10, letterSpacing: 2, color: C.goldDim, textTransform: "uppercase" }}>Nashville</div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          {tab === "browse" && <BrowseFeed profile={profile} teeTimes={teeTimes} onApply={handleApply} />}
          {tab === "post" && <HostFlow profile={profile} onPost={handlePost} />}
          {tab === "myTimes" && !reviewingTeeTime && <MyTeeTimes teeTimes={myTeeTimes} onViewApplicants={(t) => setReviewingTeeTime(t)} />}
          {tab === "myTimes" && reviewingTeeTime && <ApplicantReview teeTime={reviewingTeeTime} onBack={() => setReviewingTeeTime(null)} onAccept={handleAccept} onDecline={handleDecline} />}
          {tab === "profile" && <ProfileScreen profile={profile} onSignOut={handleSignOut} />}
        </div>

        {/* Bottom nav */}
        <div style={{
          display: "flex", justifyContent: "space-around",
          padding: `12px 0 calc(12px + var(--sab, 10px))`,
          borderTop: `1px solid ${C.cardBorder}`,
          background: C.bg, position: "sticky", bottom: 0,
        }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setReviewingTeeTime(null); }} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              background: "none", border: "none", cursor: "pointer", padding: "4px 14px",
              opacity: tab === t.id ? 1 : 0.35, transition: "opacity 0.2s",
            }}>
              <span style={{ fontSize: 20 }}>{t.icon}</span>
              <span style={{
                fontFamily: font.heading, fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase",
                color: tab === t.id ? C.gold : C.goldDim,
              }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {toast && <Toast {...toast} onDone={() => setToast(null)} />}
    </div>
  );
}
