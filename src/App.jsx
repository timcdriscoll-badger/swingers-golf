import { useState, useEffect, useMemo } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, doc, getDoc, addDoc, onSnapshot, updateDoc, writeBatch, query, where } from "firebase/firestore";
import {
  Flag,
  User,
  CheckCircle,
  CreditCard,
  Footprints,
  Music,
  Wine,
  Cigarette,
  Search,
  PlusCircle,
  CalendarDays,
  Clock,
  ChevronRight,
} from "lucide-react";
import { auth, db } from "./firebase";
import AuthScreen from "./AuthScreen";
import ProfileSetup from "./ProfileSetup";

/* ═══════════════════════════════════════════
   SWINGERS — Golf Tee Time Marketplace
   ═══════════════════════════════════════════ */

// ── Course list (used in Post & Profile Setup) ──
const COURSES_NASHVILLE = [
  "Gaylord Springs", "Hermitage Golf Course", "McCabe Golf Course",
  "Ted Rhodes Golf Course", "Harpeth Hills", "Temple Hills",
  "Nashboro Golf Club", "Windtree Golf Course", "The Grove",
  "Greystone Golf Club", "Indian Hills Golf Course",
];

// ── Style Constants ────────────────────────
const C = {
  bg: "#060e06",
  card: "#0c1a0c",
  cardBorder: "rgba(168,148,96,0.06)",
  gold: "#c4b482",
  goldDim: "rgba(168,148,96,0.5)",
  goldFaint: "rgba(168,148,96,0.06)",
  cream: "#f0ead6",
  creamDim: "rgba(240,234,214,0.6)",
  green: "#4ade80",
  greenDim: "rgba(74,222,128,0.1)",
  red: "#f87171",
  redDim: "rgba(248,113,113,0.1)",
};

const space = {
  xs: 6,
  sm: 12,
  md: 20,
  lg: 28,
  xl: 36,
  xxl: 48,
  pageX: 28,
  pageY: 36,
  contentBottom: 140,
};

const type = {
  pageTitle: 30,
  sectionTitle: 22,
  cardTitle: 20,
  body: 15,
  caption: 13,
  label: 11,
  overline: 10,
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
      fontFamily: font.body, fontSize: type.label, fontWeight: 600,
      color, background: `${color}12`, border: `1px solid ${color}20`,
      borderRadius: 8, padding: "5px 12px", letterSpacing: 0.4,
      whiteSpace: "nowrap", ...sx,
    }}>{children}</span>
  );
}

function AvatarIcon({ size = 22, color = C.gold, style: sx = {} }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", ...sx }}>
      <User size={size} color={color} strokeWidth={2} />
    </div>
  );
}

function Avatar({ photoURL, size = 44, shape = "rounded", style: sx = {} }) {
  const isCircle = shape === "circle";
  const borderRadius = isCircle ? "50%" : 14;
  const sizeStyle = { width: size, height: size, borderRadius, overflow: "hidden", flexShrink: 0, ...sx };
  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt=""
        style={{ ...sizeStyle, objectFit: "cover", display: "block" }}
      />
    );
  }
  return (
    <div style={{ ...sizeStyle, background: C.goldFaint, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <User size={Math.round(size * 0.5)} color={C.gold} strokeWidth={2} />
    </div>
  );
}

function PrefIcon({ active, label, icon: Icon, emoji }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: space.xs,
      opacity: active ? 1 : 0.3,
      fontFamily: font.body, fontSize: type.caption, color: C.creamDim,
    }}>
      {emoji ? <span style={{ fontSize: 15 }}>{emoji}</span> : <Icon size={14} color={C.creamDim} strokeWidth={2} />}
      <span>{label}</span>
    </div>
  );
}

function VerifiedBadge() {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontFamily: font.body, fontSize: type.overline, fontWeight: 600,
      color: C.green, background: C.greenDim,
      borderRadius: 6, padding: "4px 10px", letterSpacing: 0.6,
    }}>
      <CheckCircle size={10} color={C.green} />
      Verified
    </span>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: font.heading, fontSize: type.overline, letterSpacing: 2.8,
      textTransform: "uppercase", color: C.goldDim, marginBottom: space.sm,
    }}>{children}</div>
  );
}

function ActionButton({ children, primary, danger, small, onClick, disabled, style: sx = {} }) {
  const bg = primary ? `linear-gradient(135deg, ${C.gold}, #a89460)` : danger ? C.redDim : "transparent";
  const color = primary ? C.bg : danger ? C.red : C.gold;
  const border = primary ? "none" : danger ? `1px solid ${C.red}25` : `1px solid ${C.cardBorder}`;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      fontFamily: font.heading, fontSize: small ? type.label : type.caption,
      letterSpacing: small ? 1.8 : 2, textTransform: "uppercase",
      fontWeight: 600, padding: small ? "10px 20px" : "14px 32px",
      borderRadius: 12, border, background: bg, color,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.4 : 1, transition: "all 0.2s", ...sx,
    }}>{children}</button>
  );
}

// ── Tee Time Card ──────────────────────────
function TeeTimeCard({ teeTime: t, onTap, isHost, onViewApplicants }) {
  const prefs = [
    { key: "riding", emoji: "🛺", label: "Cart" },
    { key: "walking", icon: Footprints, label: "Walk" },
    { key: "music", icon: Music, label: "Music" },
    { key: "drinking", icon: Wine, label: "Drinks" },
    { key: "smoking", icon: Cigarette, label: "Smoke" },
  ];

  return (
    <div
      onClick={onTap}
      style={{
        background: `linear-gradient(170deg, ${C.card} 0%, #081408 100%)`,
        border: `1px solid ${C.cardBorder}`, borderRadius: 24, overflow: "hidden",
        cursor: onTap ? "pointer" : "default", transition: "border-color 0.2s, transform 0.2s",
      }}
      onMouseEnter={e => { if (onTap) { e.currentTarget.style.borderColor = "rgba(168,148,96,0.15)"; e.currentTarget.style.transform = "translateY(-2px)"; } }}
      onMouseLeave={e => { if (onTap) { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.transform = "translateY(0)"; } }}
    >
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: `${space.lg}px ${space.lg}px ${space.md}px`, borderBottom: `1px solid ${C.cardBorder}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: space.sm }}>
          <Avatar photoURL={t.hostPhotoURL} size={44} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: space.xs }}>
              <span style={{ fontFamily: font.display, fontSize: type.sectionTitle - 2, fontWeight: 600, color: C.cream }}>{t.hostName}</span>
              {t.hostVerified && <VerifiedBadge />}
            </div>
            <span style={{ fontFamily: font.body, fontSize: type.caption, color: C.goldDim }}>{t.hostHandicap} HCP</span>
          </div>
        </div>
        <Badge color={C.green}>{t.spotsOpen} spot{t.spotsOpen > 1 ? "s" : ""}</Badge>
      </div>

      <div style={{ padding: `${space.lg}px ${space.lg}px ${space.lg}px` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: space.md }}>
          <div>
            <div style={{ fontFamily: font.display, fontSize: type.cardTitle, fontWeight: 600, color: C.cream, marginBottom: 4 }}>{t.course}</div>
            <div style={{ fontFamily: font.body, fontSize: type.caption, color: C.goldDim }}>{t.date} · {t.time} · {t.holes} holes</div>
          </div>
          <div style={{
            fontFamily: font.heading, fontSize: type.caption, fontWeight: 600,
            color: C.gold, background: C.goldFaint, borderRadius: 10, padding: "8px 14px",
          }}>{t.groupHandicapRange} HCP</div>
        </div>

        <div style={{ display: "flex", gap: space.md, marginBottom: space.md, flexWrap: "wrap" }}>
          {prefs.map(p => <PrefIcon key={p.key} active={t[p.key]} label={p.label} icon={p.icon} emoji={p.emoji} />)}
          <div style={{ fontFamily: font.body, fontSize: type.caption, color: C.goldDim, display: "flex", alignItems: "center", gap: space.xs }}>
            <Clock size={13} color={C.goldDim} style={{ flexShrink: 0 }} />
            {t.pace}
          </div>
        </div>

        {t.note && (
          <p style={{ fontFamily: font.body, fontSize: type.body, lineHeight: 1.6, color: C.creamDim, margin: 0, fontStyle: "italic" }}>"{t.note}"</p>
        )}

        {isHost && t.applicants?.length > 0 && (
          <div
            onClick={(e) => { e.stopPropagation(); onViewApplicants?.(t); }}
            style={{
              marginTop: space.md, padding: `${space.sm}px ${space.md}px`, borderRadius: 14,
              background: C.greenDim, border: `1px solid rgba(74,222,128,0.15)`,
              display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer",
            }}
          >
            <span style={{ fontFamily: font.body, fontSize: type.body, fontWeight: 600, color: C.green }}>
              {t.applicants.length} player{t.applicants.length > 1 ? "s" : ""} interested
            </span>
            <span style={{ fontFamily: font.body, fontSize: type.caption, color: C.green }}>Review →</span>
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
    fontFamily: font.body, fontSize: type.body, color: C.cream,
    background: C.goldFaint, border: `1px solid ${C.cardBorder}`,
    borderRadius: 12, padding: "14px 18px", width: "100%", outline: "none", boxSizing: "border-box",
  };

  const pagePad = { padding: `${space.pageY}px ${space.pageX}px ${space.contentBottom}px` };

  if (step === 1) {
    return (
      <div style={pagePad}>
        <h2 style={{ fontFamily: font.display, fontSize: type.pageTitle, color: C.cream, margin: "0 0 8px", fontWeight: 600 }}>Preview</h2>
        <p style={{ fontFamily: font.body, fontSize: type.caption, color: C.goldDim, margin: "0 0 28px" }}>Review before posting</p>
        <TeeTimeCard teeTime={{
          ...form, id: "new", hostName: profile.name, hostHandicap: profile.handicap,
          hostPhotoURL: profile.photoURL ?? null, hostVerified: true, spotsTotal: form.spotsOpen + 1, applicants: [],
          date: form.date ? new Date(form.date + "T00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "—",
          time: form.time || "—",
        }} />
        <div style={{ display: "flex", gap: space.sm, marginTop: space.lg }}>
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
    <div style={pagePad}>
      <h2 style={{ fontFamily: font.display, fontSize: type.pageTitle, color: C.cream, margin: "0 0 6px", fontWeight: 600 }}>Post a Tee Time</h2>
      <p style={{ fontFamily: font.body, fontSize: type.body, color: C.goldDim, margin: "0 0 32px" }}>Fill your open spots with the right players</p>

      <SectionLabel>Course & Time</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: space.sm, marginBottom: space.lg }}>
        <select value={form.course} onChange={e => update("course", e.target.value)} style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
          <option value="">Select a course...</option>
          {COURSES_NASHVILLE.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ display: "flex", gap: space.sm }}>
          <input type="date" value={form.date} onChange={e => update("date", e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          <input type="time" value={form.time} onChange={e => update("time", e.target.value)} style={{ ...inputStyle, flex: 1 }} />
        </div>
        <div style={{ display: "flex", gap: space.sm }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontFamily: font.body, fontSize: type.label, color: C.goldDim, marginBottom: space.xs, display: "block" }}>Holes</label>
            <div style={{ display: "flex", gap: space.xs }}>
              {[9, 18].map(h => (
                <button key={h} onClick={() => update("holes", h)} style={{
                  flex: 1, padding: "12px 0", borderRadius: 10, fontFamily: font.heading, fontSize: type.body, fontWeight: 600,
                  border: form.holes === h ? `1px solid ${C.gold}` : `1px solid ${C.cardBorder}`,
                  background: form.holes === h ? C.goldFaint : "transparent",
                  color: form.holes === h ? C.gold : C.creamDim, cursor: "pointer", transition: "all 0.2s",
                }}>{h}</button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontFamily: font.body, fontSize: type.label, color: C.goldDim, marginBottom: space.xs, display: "block" }}>Open Spots</label>
            <div style={{ display: "flex", gap: space.xs }}>
              {[1, 2, 3].map(s => (
                <button key={s} onClick={() => update("spotsOpen", s)} style={{
                  flex: 1, padding: "12px 0", borderRadius: 10, fontFamily: font.heading, fontSize: type.body, fontWeight: 600,
                  border: form.spotsOpen === s ? `1px solid ${C.gold}` : `1px solid ${C.cardBorder}`,
                  background: form.spotsOpen === s ? C.goldFaint : "transparent",
                  color: form.spotsOpen === s ? C.gold : C.creamDim, cursor: "pointer", transition: "all 0.2s",
                }}>{s}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <SectionLabel>Group Vibe</SectionLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: space.sm, marginBottom: space.lg }}>
        {[
          { key: "riding", label: "Riding", emoji: "🛺" },
          { key: "walking", label: "Walking", icon: Footprints },
          { key: "music", label: "Music OK", icon: Music },
          { key: "drinking", label: "Drinking", icon: Wine },
          { key: "smoking", label: "Smoking", icon: Cigarette },
        ].map(p => {
          const Icon = p.icon;
          return (
            <button key={p.key} onClick={() => update(p.key, !form[p.key])} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "12px 18px", borderRadius: 12,
              fontFamily: font.body, fontSize: type.body,
              border: form[p.key] ? `1px solid rgba(168,148,96,0.25)` : `1px solid ${C.cardBorder}`,
              background: form[p.key] ? C.goldFaint : "transparent",
              color: form[p.key] ? C.cream : C.creamDim, cursor: "pointer", transition: "all 0.2s",
            }}>
              {p.emoji ? <span style={{ fontSize: 16 }}>{p.emoji}</span> : <Icon size={16} color="currentColor" strokeWidth={2} />}
              {p.label}
            </button>
          );
        })}
      </div>

      <SectionLabel>Pace & Skill</SectionLabel>
      <div style={{ display: "flex", gap: space.sm, marginBottom: space.lg }}>
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
        rows={3} style={{ ...inputStyle, resize: "none", marginBottom: space.lg }} />

      <ActionButton primary disabled={!form.course || !form.date || !form.time}
        onClick={() => setStep(1)} style={{ width: "100%" }}>
        Preview & Post
      </ActionButton>
    </div>
  );
}

// ── Player Profile View (full profile when reviewing applicant) ──
function PlayerProfileView({ teeTimeId, applicant, profileData, onBack, onAccept, onDecline }) {
  const pagePad = { padding: `${space.pageY}px ${space.pageX}px ${space.contentBottom}px` };
  const p = profileData || {};
  const prefs = p.preferences ?? { riding: false, walking: false, music: false, drinking: false, smoking: false };
  return (
    <div style={pagePad}>
      <button onClick={onBack} style={{
        fontFamily: font.body, fontSize: type.caption, color: C.goldDim,
        background: "none", border: "none", cursor: "pointer", marginBottom: space.md, padding: 0,
      }}>← Back to applicants</button>
      <div style={{ textAlign: "center", marginBottom: space.lg }}>
        <Avatar photoURL={applicant.photoURL ?? p.photoURL} size={96} shape="circle" />
        <div style={{ fontFamily: font.display, fontSize: 26, fontWeight: 600, color: C.cream, marginTop: space.sm }}>{applicant.name}</div>
        <div style={{ fontFamily: font.body, fontSize: type.caption, color: C.goldDim, marginTop: 4 }}>{applicant.handicap} HCP</div>
        <div style={{ fontFamily: font.body, fontSize: type.caption, color: C.goldDim, marginTop: 2 }}>{p.location ?? "—"}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: space.sm, marginBottom: space.lg }}>
        {[
          { label: "HCP", value: applicant.handicap },
          { label: "Rounds", value: p.roundsPlayed ?? "—" },
          { label: "Rating", value: p.matchRating != null ? `${p.matchRating}★` : "—" },
          { label: "No Shows", value: p.noShows ?? "—" },
        ].map((s) => (
          <div key={s.label} style={{
            textAlign: "center", padding: `${space.sm}px 8px`,
            background: C.goldFaint, border: `1px solid ${C.cardBorder}`, borderRadius: 14,
          }}>
            <div style={{ fontFamily: font.heading, fontSize: type.overline, letterSpacing: 1.5, textTransform: "uppercase", color: C.goldDim, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontFamily: font.display, fontSize: type.body, color: C.gold, fontWeight: 600 }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: `${space.md}px ${space.lg}px`, borderRadius: 14, background: C.goldFaint, border: `1px solid ${C.cardBorder}`, marginBottom: space.lg }}>
        <SectionLabel>Preferences</SectionLabel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: space.sm }}>
          <PrefIcon active={prefs.riding} emoji="🛺" label="Cart" />
          <PrefIcon active={prefs.walking} icon={Footprints} label="Walk" />
          <PrefIcon active={prefs.music} icon={Music} label="Music" />
          <PrefIcon active={prefs.drinking} icon={Wine} label="Drinks" />
          <PrefIcon active={prefs.smoking} icon={Cigarette} label="Smoke" />
        </div>
      </div>
      {applicant.note && (
        <div style={{ marginBottom: space.lg }}>
          <SectionLabel>Note</SectionLabel>
          <p style={{ fontFamily: font.body, fontSize: type.body, color: C.creamDim, margin: 0, fontStyle: "italic" }}>"{applicant.note}"</p>
        </div>
      )}
      <div style={{ display: "flex", gap: space.sm, marginTop: space.lg }}>
        <ActionButton small danger onClick={async () => { await onDecline(teeTimeId, applicant.id); onBack(); }} style={{ flex: 1 }}>Pass</ActionButton>
        <ActionButton small primary onClick={async () => { await onAccept(teeTimeId, applicant.id); onBack(); }} style={{ flex: 1 }}>Accept</ActionButton>
      </div>
    </div>
  );
}

// ── Applicant Review ───────────────────────
function ApplicantReview({ teeTime, onBack, onAccept, onDecline }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const pagePad = { padding: `${space.pageY}px ${space.pageX}px ${space.contentBottom}px` };

  const handleTapApplicant = async (a) => {
    try {
      const snap = await getDoc(doc(db, "users", a.userId));
      setSelectedPlayer({ applicant: a, profileData: snap.exists() ? snap.data() : {} });
    } catch {
      setSelectedPlayer({ applicant: a, profileData: {} });
    }
  };

  if (selectedPlayer) {
    return (
      <PlayerProfileView
        teeTimeId={teeTime.id}
        applicant={selectedPlayer.applicant}
        profileData={selectedPlayer.profileData}
        onBack={() => setSelectedPlayer(null)}
        onAccept={onAccept}
        onDecline={onDecline}
      />
    );
  }

  return (
    <div style={pagePad}>
      <button onClick={onBack} style={{
        fontFamily: font.body, fontSize: type.caption, color: C.goldDim,
        background: "none", border: "none", cursor: "pointer", marginBottom: space.md, padding: 0,
      }}>← Back to My Tee Times</button>

      <h2 style={{ fontFamily: font.display, fontSize: type.sectionTitle, color: C.cream, margin: "0 0 6px", fontWeight: 600 }}>
        Applicants for {teeTime.course}
      </h2>
      <p style={{ fontFamily: font.body, fontSize: type.caption, color: C.goldDim, margin: "0 0 28px" }}>
        {teeTime.date} · {teeTime.time} · {teeTime.spotsOpen} spot{teeTime.spotsOpen > 1 ? "s" : ""} remaining
      </p>

      {teeTime.applicants.length === 0 ? (
        <div style={{ textAlign: "center", padding: `${space.xxl}px 0` }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: space.sm }}>
            <Flag size={44} color={C.goldDim} strokeWidth={1.5} />
          </div>
          <div style={{ fontFamily: font.body, fontSize: type.body, color: C.goldDim }}>No applicants yet</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: space.md }}>
          {teeTime.applicants.map(a => (
            <div key={a.id} style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 20, padding: space.lg }}>
              <div style={{ display: "flex", alignItems: "center", gap: space.sm, marginBottom: space.sm }}>
                <button
                  type="button"
                  onClick={() => handleTapApplicant(a)}
                  style={{
                    padding: 0, border: "none", background: "none", cursor: "pointer", borderRadius: 16, overflow: "hidden",
                  }}
                >
                  <Avatar photoURL={a.photoURL} size={50} shape="rounded" />
                </button>
                <button
                  type="button"
                  onClick={() => handleTapApplicant(a)}
                  style={{
                    flex: 1, textAlign: "left", padding: 0, border: "none", background: "none", cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: space.xs }}>
                    <span style={{ fontFamily: font.display, fontSize: type.sectionTitle - 2, fontWeight: 600, color: C.cream }}>{a.name}</span>
                    {a.verified && <VerifiedBadge />}
                  </div>
                  <span style={{ fontFamily: font.body, fontSize: type.caption, color: C.goldDim }}>{a.handicap} HCP</span>
                </button>
                <Badge color={(a.paymentMethod && a.paymentMethod !== "Not linked") ? C.green : C.goldDim} style={{ fontSize: type.overline, display: "flex", alignItems: "center", gap: 4 }}>
                  <CreditCard size={10} /> {a.paymentMethod && a.paymentMethod !== "Not linked" ? "Linked" : a.paymentMethod ?? "—"}
                </Badge>
              </div>
              {a.note && <p style={{ fontFamily: font.body, fontSize: type.body, lineHeight: 1.6, color: C.creamDim, margin: `0 0 ${space.sm}px`, fontStyle: "italic" }}>"{a.note}"</p>}
              <div style={{ display: "flex", gap: space.sm }}>
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
function toLocalDateStr(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DATE_RANGE_OPTIONS = [
  { value: 0, label: "Today" },
  { value: 3, label: "3 Days" },
  { value: 7, label: "7 Days" },
  { value: 14, label: "14 Days" },
  { value: 30, label: "30 Days" },
];

function BrowseFeed({ userId, profile, teeTimes, notifications, loading, onApply, onPostFirst }) {
  const [selected, setSelected] = useState(null);
  const [applyNote, setApplyNote] = useState("");
  const [applied, setApplied] = useState({});
  const [dateRange, setDateRange] = useState(7);

  const pagePad = { padding: `${space.pageY}px ${space.pageX}px ${space.contentBottom}px` };

  const todayStr = toLocalDateStr(new Date());
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + (dateRange === 0 ? 0 : dateRange));
  const endDateStr = toLocalDateStr(endDate);

  const openTeeTimes = teeTimes.filter((t) => {
    if (t.spotsOpen <= 0) return false;
    const raw = t.dateRaw;
    if (!raw || raw < todayStr) return false;
    if (dateRange === 0) return raw === todayStr;
    return raw <= endDateStr;
  });

  const rangeSubtitle =
    dateRange === 0 ? "Today" : dateRange === 3 ? "Next 3 days" : dateRange === 7 ? "Next 7 days" : dateRange === 14 ? "Next 14 days" : "Next 30 days";

  if (loading) {
    return (
      <div style={pagePad}>
        <h2 style={{ fontFamily: font.display, fontSize: type.pageTitle, color: C.cream, margin: "0 0 6px", fontWeight: 600 }}>Open Tee Times</h2>
        <p style={{ fontFamily: font.body, fontSize: type.body, color: C.goldDim, margin: "0 0 32px" }}>Nashville area · {rangeSubtitle}</p>
        <div style={{ display: "flex", justifyContent: "center", padding: `${space.xxl * 2}px 0` }}>
          <div style={{ fontFamily: font.body, fontSize: type.body, color: C.goldDim }}>Loading tee times…</div>
        </div>
      </div>
    );
  }

  if (openTeeTimes.length === 0 && !selected) {
    return (
      <div style={pagePad}>
        <h2 style={{ fontFamily: font.display, fontSize: type.pageTitle, color: C.cream, margin: "0 0 6px", fontWeight: 600 }}>Open Tee Times</h2>
        <p style={{ fontFamily: font.body, fontSize: type.body, color: C.goldDim, margin: "0 0 24px" }}>Nashville area · {rangeSubtitle}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: space.xs, marginBottom: 24 }}>
          {DATE_RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDateRange(opt.value)}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                border: `1px solid ${dateRange === opt.value ? "rgba(168,148,96,0.4)" : C.cardBorder}`,
                background: dateRange === opt.value ? C.goldFaint : "transparent",
                color: dateRange === opt.value ? C.gold : C.goldDim,
                fontFamily: font.body,
                fontSize: type.caption,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div style={{ textAlign: "center", padding: `${space.xxl * 2}px ${space.pageX}px` }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: space.sm }}>
            <Flag size={52} color={C.goldDim} strokeWidth={1.5} />
          </div>
          <div style={{ fontFamily: font.display, fontSize: type.sectionTitle, color: C.cream, marginBottom: 8 }}>No tee times yet</div>
          <div style={{ fontFamily: font.body, fontSize: type.body, color: C.goldDim, marginBottom: space.lg }}>Be the first to post one and find players for your round.</div>
          <ActionButton primary onClick={onPostFirst}>Post a tee time</ActionButton>
        </div>
      </div>
    );
  }

  if (selected) {
    const t = selected;
    return (
      <div style={pagePad}>
        <button onClick={() => { setSelected(null); setApplyNote(""); }} style={{
          fontFamily: font.body, fontSize: type.caption, color: C.goldDim,
          background: "none", border: "none", cursor: "pointer", marginBottom: space.md, padding: 0,
        }}>← Back to Tee Times</button>
        <TeeTimeCard teeTime={t} />
        {(applied[t.id] || (userId && (t.applicants ?? []).some((a) => a.userId === userId))) ? (
          <div style={{
            marginTop: space.lg, padding: space.lg, borderRadius: 20,
            background: C.greenDim, border: `1px solid rgba(74,222,128,0.15)`, textAlign: "center",
          }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: space.sm }}>
              <CheckCircle size={36} color={C.green} strokeWidth={2} />
            </div>
            <div style={{ fontFamily: font.display, fontSize: type.sectionTitle, color: C.green, fontWeight: 600 }}>Request Sent</div>
            <div style={{ fontFamily: font.body, fontSize: type.caption, color: C.creamDim, marginTop: 6 }}>{t.hostName} will review and get back to you</div>
          </div>
        ) : (
          <div style={{ marginTop: space.lg, padding: space.lg, borderRadius: 20, background: C.card, border: `1px solid ${C.cardBorder}` }}>
            <SectionLabel>Request to Join</SectionLabel>
            <div style={{
              display: "flex", alignItems: "center", gap: space.sm, marginBottom: space.md, padding: `${space.sm}px ${space.md}px`,
              borderRadius: 12, background: C.goldFaint, border: `1px solid ${C.cardBorder}`,
            }}>
              <Avatar photoURL={profile.photoURL} size={40} shape="rounded" />
              <div>
                <span style={{ fontFamily: font.body, fontSize: type.body, fontWeight: 600, color: C.cream }}>{profile.name}</span>
                <span style={{ fontFamily: font.body, fontSize: type.caption, color: C.goldDim, marginLeft: 8 }}>{profile.handicap} HCP</span>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <Badge color={C.green} style={{ fontSize: type.overline, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <CreditCard size={10} /> {profile.paymentMethod ?? "Not linked"}
                </Badge>
              </div>
            </div>
            <textarea value={applyNote} onChange={e => setApplyNote(e.target.value)}
              placeholder="Introduce yourself to the group..."
              rows={3} style={{
                fontFamily: font.body, fontSize: type.body, color: C.cream, background: C.goldFaint,
                border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: "14px 18px",
                width: "100%", outline: "none", boxSizing: "border-box", resize: "none", marginBottom: space.md,
              }} />
            <ActionButton primary onClick={async () => { setApplied(a => ({ ...a, [t.id]: true })); await onApply(t.id, applyNote); }} style={{ width: "100%" }}>
              Request to Play
            </ActionButton>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={pagePad}>
      <h2 style={{ fontFamily: font.display, fontSize: type.pageTitle, color: C.cream, margin: "0 0 6px", fontWeight: 600 }}>Open Tee Times</h2>
      <p style={{ fontFamily: font.body, fontSize: type.body, color: C.goldDim, margin: "0 0 16px" }}>Nashville area · {rangeSubtitle}</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: space.xs, marginBottom: space.lg }}>
        {DATE_RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setDateRange(opt.value)}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              border: `1px solid ${dateRange === opt.value ? "rgba(168,148,96,0.4)" : C.cardBorder}`,
              background: dateRange === opt.value ? C.goldFaint : "transparent",
              color: dateRange === opt.value ? C.gold : C.goldDim,
              fontFamily: font.body,
              fontSize: type.caption,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {notifications && notifications.length > 0 && (
        <div style={{ marginBottom: space.xl }}>
          <SectionLabel>Notifications</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: space.sm }}>
            {notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: space.md,
                  borderRadius: 16,
                  border: `1px solid ${C.cardBorder}`,
                  background: n.type === "accepted" ? C.greenDim : C.card,
                  borderLeft: `4px solid ${n.type === "accepted" ? C.green : C.goldDim}`,
                }}
              >
                <div style={{ fontFamily: font.display, fontSize: type.sectionTitle - 2, fontWeight: 600, color: C.cream, marginBottom: 4 }}>
                  {n.course}
                </div>
                <div style={{ fontFamily: font.body, fontSize: type.caption, color: C.goldDim, marginBottom: 6 }}>
                  {n.date} · {n.time}
                </div>
                <span
                  style={{
                    fontFamily: font.body,
                    fontSize: type.label,
                    fontWeight: 600,
                    color: n.type === "accepted" ? C.green : C.goldDim,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  {n.type === "accepted" ? "Accepted" : "Declined"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: space.lg }}>
        {openTeeTimes.map(t => (
          <TeeTimeCard key={t.id} teeTime={t} onTap={() => setSelected(t)} />
        ))}
      </div>
    </div>
  );
}

// ── My Tee Times ───────────────────────────
function MyTeeTimes({ teeTimes, onViewApplicants }) {
  const pagePad = { padding: `${space.pageY}px ${space.pageX}px ${space.contentBottom}px` };

  if (teeTimes.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: `${space.xxl * 2}px ${space.pageX}px` }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: space.sm }}>
          <CalendarDays size={52} color={C.goldDim} strokeWidth={1.5} />
        </div>
        <div style={{ fontFamily: font.display, fontSize: type.sectionTitle, color: C.cream, marginBottom: 8 }}>No tee times posted</div>
        <div style={{ fontFamily: font.body, fontSize: type.body, color: C.goldDim }}>Post a tee time to start finding players</div>
      </div>
    );
  }
  return (
    <div style={pagePad}>
      <h2 style={{ fontFamily: font.display, fontSize: type.pageTitle, color: C.cream, margin: "0 0 8px", fontWeight: 600 }}>My Tee Times</h2>
      <p style={{ fontFamily: font.body, fontSize: type.body, color: C.goldDim, margin: "0 0 28px" }}>Manage your posted rounds</p>
      <div style={{ display: "flex", flexDirection: "column", gap: space.lg }}>
        {teeTimes.map(t => <TeeTimeCard key={t.id} teeTime={t} isHost onViewApplicants={onViewApplicants} />)}
      </div>
    </div>
  );
}

// ── Profile ────────────────────────────────
function ProfileScreen({ profile, onSignOut }) {
  const u = {
    name: profile.name,
    location: profile.location ?? "Nashville, TN",
    paymentMethod: profile.paymentMethod ?? "Not linked",
    handicap: profile.handicap,
    roundsPlayed: profile.roundsPlayed ?? 0,
    matchRating: profile.matchRating ?? 0,
    noShows: profile.noShows ?? 0,
    preferences: profile.preferences ?? { riding: false, walking: false, music: false, drinking: false, smoking: false },
  };
  const pagePad = { padding: `${space.pageY}px ${space.pageX}px ${space.contentBottom}px` };

  return (
    <div style={pagePad}>
      <div style={{ textAlign: "center", marginBottom: space.xl }}>
        <div style={{ margin: "0 auto 20px", display: "inline-block" }}>
          <Avatar size={96} shape="circle" />
        </div>
        <div style={{ fontFamily: font.display, fontSize: 30, fontWeight: 600, color: C.cream }}>{u.name}</div>
        <div style={{ fontFamily: font.body, fontSize: type.caption, color: C.goldDim, marginTop: 6 }}>{u.location}</div>
        <div style={{ display: "flex", gap: space.sm, justifyContent: "center", marginTop: space.md, flexWrap: "wrap" }}>
          {profile.verified && <VerifiedBadge />}
          <Badge color={u.paymentMethod !== "Not linked" ? C.green : C.goldDim} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <CreditCard size={10} /> {u.paymentMethod}{u.paymentMethod !== "Not linked" ? " Linked" : ""}
          </Badge>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: space.sm, marginBottom: space.lg }}>
        {[
          { label: "HCP", value: u.handicap },
          { label: "Rounds", value: u.roundsPlayed },
          { label: "Rating", value: `${u.matchRating}★` },
          { label: "No Shows", value: u.noShows },
        ].map(s => (
          <div key={s.label} style={{
            textAlign: "center", padding: `${space.md}px 8px`,
            background: C.goldFaint, border: `1px solid ${C.cardBorder}`, borderRadius: 16,
          }}>
            <div style={{ fontFamily: font.heading, fontSize: type.overline, letterSpacing: 1.8, textTransform: "uppercase", color: C.goldDim, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: font.display, fontSize: type.cardTitle, color: C.gold, fontWeight: 600 }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: `${space.md}px ${space.lg}px`, borderRadius: 16, background: C.goldFaint, border: `1px solid ${C.cardBorder}`, marginBottom: space.lg }}>
        <SectionLabel>Preferences</SectionLabel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: space.md }}>
          <PrefIcon active={u.preferences.riding} emoji="🛺" label="Cart" />
          <PrefIcon active={u.preferences.walking} icon={Footprints} label="Walk" />
          <PrefIcon active={u.preferences.music} icon={Music} label="Music" />
          <PrefIcon active={u.preferences.drinking} icon={Wine} label="Drinks" />
          <PrefIcon active={u.preferences.smoking} icon={Cigarette} label="Smoke" />
        </div>
      </div>
      {["Edit Profile", "Payment Methods", "Notification Settings", "Round History", "Help & Support"].map(item => (
        <div key={item} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: `${space.md}px 0`, borderBottom: `1px solid ${C.cardBorder}`, cursor: "pointer",
        }}>
          <span style={{ fontFamily: font.body, fontSize: type.body, color: C.creamDim }}>{item}</span>
          <ChevronRight size={16} color="rgba(196,180,130,0.4)" />
        </div>
      ))}
      <div style={{ marginTop: space.xl }}>
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
      position: "fixed", top: 24, left: "50%", transform: `translateX(-50%) translateY(${visible ? 0 : -12}px)`,
      opacity: visible ? 1 : 0, transition: "all 0.3s ease",
      background: bg, border: `1px solid ${color}20`,
      borderRadius: 16, padding: "14px 28px", zIndex: 2000,
      fontFamily: font.body, fontSize: type.body, fontWeight: 600, color,
      boxShadow: "0 16px 48px rgba(0,0,0,0.35)",
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
  const [teeTimes, setTeeTimes] = useState([]);
  const [teeTimesLoading, setTeeTimesLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [tab, setTab] = useState("browse");
  const [reviewingTeeTime, setReviewingTeeTime] = useState(null);
  const [toast, setToast] = useState(null);

  const myTeeTimes = useMemo(
    () => (user ? teeTimes.filter((t) => t.hostId === user.uid) : []),
    [teeTimes, user]
  );

  const pendingApplicantsCount = useMemo(
    () => myTeeTimes.reduce((sum, t) => sum + (t.applicants?.length ?? 0), 0),
    [myTeeTimes]
  );

  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const sortedNotifications = useMemo(
    () => [...notifications].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")),
    [notifications]
  );

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "notifications"), where("userId", "==", user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setNotifications(list);
    });
    return () => unsub();
  }, [user]);

  const markNotificationsAsRead = async (ids) => {
    if (!ids.length) return;
    const batch = writeBatch(db);
    ids.forEach((id) => batch.update(doc(db, "notifications", id), { read: true }));
    try {
      await batch.commit();
    } catch (err) {
      // ignore
    }
  };

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

  useEffect(() => {
    const coll = collection(db, "teeTimes");
    const unsub = onSnapshot(coll, (snapshot) => {
      const list = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          applicants: data.applicants ?? [],
          ...data,
        };
      });
      setTeeTimes(list);
      setTeeTimesLoading(false);
    });
    return () => unsub();
  }, []);

  const showToast = (message, type = "success") => setToast({ message, type, key: Date.now() });

  const handlePost = async (form) => {
    const dateFormatted = form.date
      ? new Date(form.date + "T00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
      : "—";
    const timeFormatted = form.time
      ? new Date(`2000-01-01T${form.time}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      : "—";
    try {
      await addDoc(collection(db, "teeTimes"), {
        hostId: user.uid,
        hostName: profile.name,
        hostHandicap: profile.handicap,
        hostPhotoURL: profile.photoURL ?? null,
        hostVerified: true,
        course: form.course,
        date: dateFormatted,
        time: timeFormatted,
        dateRaw: form.date,
        timeRaw: form.time,
        holes: form.holes,
        spotsOpen: form.spotsOpen,
        spotsTotal: form.spotsOpen + 1,
        riding: form.riding,
        walking: form.walking,
        music: form.music,
        drinking: form.drinking,
        smoking: form.smoking,
        pace: form.pace,
        groupHandicapRange: form.groupHandicapRange,
        note: form.note ?? "",
        applicants: [],
      });
      showToast("Tee time posted! Players can now apply.");
      setTab("myTimes");
    } catch (err) {
      showToast(err.message || "Failed to post tee time.", "error");
    }
  };

  const handleApply = async (teeTimeId, note) => {
    const t = teeTimes.find((x) => x.id === teeTimeId);
    if (!t) return;
    if ((t.applicants ?? []).some((a) => a.userId === user.uid)) {
      showToast("You've already applied to this tee time.", "error");
      return;
    }
    const newApplicant = {
      id: user.uid,
      userId: user.uid,
      name: profile.name,
      handicap: profile.handicap,
      photoURL: profile.photoURL ?? null,
      paymentMethod: profile.paymentMethod ?? "Not linked",
      note: note ?? "",
      createdAt: new Date().toISOString(),
    };
    try {
      await updateDoc(doc(db, "teeTimes", teeTimeId), {
        applicants: [...(t.applicants ?? []), newApplicant],
      });
      showToast("Request sent! The host will review your application.");
    } catch (err) {
      showToast(err.message || "Failed to send request.", "error");
    }
  };

  const handleAccept = async (teeTimeId, applicantId) => {
    const t = teeTimes.find((x) => x.id === teeTimeId);
    if (!t) return;
    const newApplicants = (t.applicants ?? []).filter((a) => a.id !== applicantId);
    const newSpotsOpen = t.spotsOpen - 1;
    try {
      await updateDoc(doc(db, "teeTimes", teeTimeId), {
        applicants: newApplicants,
        spotsOpen: newSpotsOpen,
      });
      await addDoc(collection(db, "notifications"), {
        userId: applicantId,
        type: "accepted",
        course: t.course,
        date: t.date,
        time: t.time,
        read: false,
        createdAt: new Date().toISOString(),
      });
      if (reviewingTeeTime?.id === teeTimeId)
        setReviewingTeeTime((prev) => ({ ...prev, applicants: newApplicants, spotsOpen: newSpotsOpen }));
      showToast("Player accepted! They've been notified.");
    } catch (err) {
      showToast(err.message || "Failed to accept.", "error");
    }
  };

  const handleDecline = async (teeTimeId, applicantId) => {
    const t = teeTimes.find((x) => x.id === teeTimeId);
    if (!t) return;
    const newApplicants = (t.applicants ?? []).filter((a) => a.id !== applicantId);
    try {
      await updateDoc(doc(db, "teeTimes", teeTimeId), { applicants: newApplicants });
      await addDoc(collection(db, "notifications"), {
        userId: applicantId,
        type: "declined",
        course: t.course,
        date: t.date,
        time: t.time,
        read: false,
        createdAt: new Date().toISOString(),
      });
      if (reviewingTeeTime?.id === teeTimeId)
        setReviewingTeeTime((prev) => ({ ...prev, applicants: newApplicants }));
      showToast("Player passed.", "error");
    } catch (err) {
      showToast(err.message || "Failed to decline.", "error");
    }
  };

  const handleSignOut = () => {
    signOut(auth);
  };

  useEffect(() => {
    if (tab === "browse" && unreadNotificationCount > 0) {
      const ids = notifications.filter((n) => !n.read).map((n) => n.id);
      markNotificationsAsRead(ids);
    }
  }, [tab, notifications, unreadNotificationCount]);

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
    { id: "browse", icon: Search, label: "Browse" },
    { id: "post", icon: PlusCircle, label: "Post" },
    { id: "myTimes", icon: CalendarDays, label: "My Times" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 460, position: "relative", display: "flex", flexDirection: "column", minHeight: "100vh" }}>

        {/* Top bar */}
        <div style={{
          padding: `calc(24px + var(--sat, 0px)) ${space.pageX}px 16px`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, background: C.bg, zIndex: 100,
          borderBottom: `1px solid ${C.cardBorder}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Flag size={22} color={C.gold} strokeWidth={2} />
            <span style={{ fontFamily: font.display, fontSize: 22, fontWeight: 600, color: C.gold, letterSpacing: -0.5 }}>Swingers</span>
          </div>
          <div style={{ fontFamily: font.heading, fontSize: type.overline, letterSpacing: 2.5, color: C.goldDim, textTransform: "uppercase" }}>Nashville</div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          {tab === "browse" && (
              <BrowseFeed
                userId={user?.uid}
                profile={profile}
                teeTimes={teeTimes}
                notifications={sortedNotifications}
                loading={teeTimesLoading}
                onApply={handleApply}
                onPostFirst={() => setTab("post")}
              />
            )}
          {tab === "post" && <HostFlow profile={profile} onPost={handlePost} />}
          {tab === "myTimes" && !reviewingTeeTime && <MyTeeTimes teeTimes={myTeeTimes} onViewApplicants={(t) => setReviewingTeeTime(t)} />}
          {tab === "myTimes" && reviewingTeeTime && <ApplicantReview teeTime={reviewingTeeTime} onBack={() => setReviewingTeeTime(null)} onAccept={handleAccept} onDecline={handleDecline} />}
          {tab === "profile" && (
              <ProfileScreen
                profile={profile}
                onSignOut={handleSignOut}
              />
            )}
        </div>

        {/* Bottom nav */}
        <div style={{
          display: "flex", justifyContent: "space-around", alignItems: "center",
          padding: `16px ${space.pageX}px calc(20px + var(--sab, 0px))`,
          borderTop: `1px solid ${C.cardBorder}`,
          background: C.bg, position: "sticky", bottom: 0,
        }}>
          {tabs.map(t => {
            const TabIcon = t.icon;
            const showMyTimesBadge = t.id === "myTimes" && pendingApplicantsCount > 0;
            const showBrowseBadge = t.id === "browse" && unreadNotificationCount > 0;
            const showBadge = showMyTimesBadge || showBrowseBadge;
            const badgeCount = showMyTimesBadge ? pendingApplicantsCount : unreadNotificationCount;
            return (
              <button key={t.id} onClick={() => { setTab(t.id); setReviewingTeeTime(null); }} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                background: "none", border: "none", cursor: "pointer", padding: "6px 16px",
                opacity: tab === t.id ? 1 : 0.4, transition: "opacity 0.2s", position: "relative",
              }}>
                <span style={{ position: "relative", display: "inline-flex" }}>
                  <TabIcon size={20} color={tab === t.id ? C.gold : C.goldDim} strokeWidth={1.75} />
                  {showBadge && (
                    <span style={{
                      position: "absolute", top: -6, right: -10,
                      minWidth: 18, height: 18, borderRadius: 9,
                      background: C.red, color: "#fff",
                      fontFamily: font.body, fontSize: 11, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: "0 5px", boxSizing: "border-box",
                    }}>
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                  )}
                </span>
                <span style={{
                  fontFamily: font.body, fontSize: type.overline, letterSpacing: 0.5,
                  color: tab === t.id ? C.gold : C.goldDim,
                }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {toast && <Toast {...toast} onDone={() => setToast(null)} />}
    </div>
  );
}
