import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { Flag, Footprints, Music, Wine, Cigarette } from "lucide-react";
import { db } from "./firebase";

const C = {
  bg: "#060e06",
  card: "#0c1a0c",
  cardBorder: "rgba(168,148,96,0.06)",
  gold: "#c4b482",
  goldDim: "rgba(168,148,96,0.5)",
  goldFaint: "rgba(168,148,96,0.06)",
  cream: "#f0ead6",
  creamDim: "rgba(240,234,214,0.6)",
  red: "#f87171",
  redDim: "rgba(248,113,113,0.1)",
};

const space = { sm: 12, md: 20, lg: 28, xl: 36 };

const font = {
  display: "'Playfair Display', serif",
  heading: "'Oswald', sans-serif",
  body: "'Source Sans 3', sans-serif",
};

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: font.heading, fontSize: 10, letterSpacing: 2.8,
      textTransform: "uppercase", color: C.goldDim, marginBottom: space.sm,
    }}>{children}</div>
  );
}

export default function ProfileSetup({ userId, courses, onComplete }) {
  const [name, setName] = useState("");
  const [handicap, setHandicap] = useState("");
  const [homeCourse, setHomeCourse] = useState("");
  const [preferences, setPreferences] = useState({
    riding: true,
    walking: false,
    music: false,
    drinking: false,
    smoking: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const inputStyle = {
    fontFamily: font.body,
    fontSize: 15,
    color: C.cream,
    background: C.goldFaint,
    border: `1px solid ${C.cardBorder}`,
    borderRadius: 12,
    padding: "14px 18px",
    width: "100%",
    outline: "none",
    boxSizing: "border-box",
  };

  const togglePref = (key) => setPreferences((p) => ({ ...p, [key]: !p[key] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const handicapNum = parseFloat(handicap);
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (handicap === "" || isNaN(handicapNum) || handicapNum < 0 || handicapNum > 54) {
      setError("Please enter a valid handicap (0–54).");
      return;
    }
    if (!homeCourse) {
      setError("Please select a home course.");
      return;
    }
    setLoading(true);
    try {
      const profile = {
        name: name.trim(),
        handicap: handicapNum,
        homeCourse,
        preferences,
        avatar: null,
        location: "Nashville, TN",
        city: "nashville",
        verified: false,
        paymentLinked: false,
        paymentMethod: "Not linked",
        bio: "",
        roundsPlayed: 0,
        matchRating: 0,
        noShows: 0,
      };
      await setDoc(doc(db, "users", userId), profile);
      onComplete(profile);
    } catch (err) {
      setError(err.message || "Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  const prefs = [
    { key: "riding", label: "Riding", emoji: "🛺" },
    { key: "walking", label: "Walking", icon: Footprints },
    { key: "music", label: "Music OK", icon: Music },
    { key: "drinking", label: "Drinking", icon: Wine },
    { key: "smoking", label: "Smoking", icon: Cigarette },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: space.xl,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: `linear-gradient(170deg, ${C.card} 0%, #081408 100%)`,
          border: `1px solid ${C.cardBorder}`,
          borderRadius: 28,
          padding: `${space.xl}px ${space.lg}px ${space.lg}px`,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: space.xl }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
            <Flag size={44} color={C.gold} strokeWidth={2} />
          </div>
          <h1
            style={{
              fontFamily: font.display,
              fontSize: 30,
              fontWeight: 600,
              color: C.gold,
              margin: "14px 0 8px",
              letterSpacing: -0.5,
            }}
          >
            Set up your profile
          </h1>
          <p style={{ fontFamily: font.body, fontSize: 15, color: C.goldDim }}>
            Tell other players a bit about you
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <SectionLabel>Name</SectionLabel>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="How you want to be called"
            style={{ ...inputStyle, marginBottom: space.lg }}
            autoComplete="name"
          />

          <SectionLabel>Handicap</SectionLabel>
          <input
            type="number"
            min={0}
            max={54}
            step={0.1}
            value={handicap}
            onChange={(e) => setHandicap(e.target.value)}
            placeholder="e.g. 12.0"
            style={{ ...inputStyle, marginBottom: space.lg }}
          />

          <SectionLabel>Home course</SectionLabel>
          <select
            value={homeCourse}
            onChange={(e) => setHomeCourse(e.target.value)}
            style={{ ...inputStyle, marginBottom: space.lg, appearance: "none", cursor: "pointer" }}
          >
            <option value="">Select a course...</option>
            {courses.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <SectionLabel>Preferences</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: space.sm, marginBottom: space.lg }}>
            {prefs.map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => togglePref(p.key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "12px 18px",
                    borderRadius: 12,
                    fontFamily: font.body,
                    fontSize: 15,
                    border: preferences[p.key] ? `1px solid rgba(168,148,96,0.25)` : `1px solid ${C.cardBorder}`,
                    background: preferences[p.key] ? C.goldFaint : "transparent",
                    color: preferences[p.key] ? C.cream : C.creamDim,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {p.emoji ? <span style={{ fontSize: 16 }}>{p.emoji}</span> : <Icon size={16} color="currentColor" strokeWidth={2} />}
                  {p.label}
                </button>
              );
            })}
          </div>

          {error && (
            <div
              style={{
                fontFamily: font.body,
                fontSize: 13,
                color: C.red,
                background: C.redDim,
                border: `1px solid rgba(248,113,113,0.2)`,
                borderRadius: 12,
                padding: "12px 16px",
                marginBottom: space.md,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px 28px",
              borderRadius: 14,
              border: "none",
              fontFamily: font.heading,
              fontSize: 14,
              letterSpacing: 2,
              textTransform: "uppercase",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              background: `linear-gradient(135deg, ${C.gold}, #a89460)`,
              color: C.bg,
              opacity: loading ? 0.7 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {loading ? "Saving…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
