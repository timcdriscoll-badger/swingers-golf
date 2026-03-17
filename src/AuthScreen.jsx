import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { Flag } from "lucide-react";
import { auth } from "./firebase";

// Reuse app styling constants
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
  red: "#f87171",
  redDim: "rgba(248,113,113,0.1)",
};

const space = { sm: 12, md: 20, lg: 28, xl: 36 };

const font = {
  display: "'Playfair Display', serif",
  heading: "'Oswald', sans-serif",
  body: "'Source Sans 3', sans-serif",
};

export default function AuthScreen() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName.trim()) {
          await updateProfile(userCred.user, { displayName: displayName.trim() });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      const msg =
        err.code === "auth/email-already-in-use"
          ? "This email is already registered. Try logging in."
          : err.code === "auth/invalid-email"
            ? "Please enter a valid email."
            : err.code === "auth/weak-password"
              ? "Password should be at least 6 characters."
              : err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found"
                ? "Invalid email or password."
                : err.message || "Something went wrong.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

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
            Swingers
          </h1>
          <p style={{ fontFamily: font.body, fontSize: 15, color: C.goldDim }}>
            Golf tee time marketplace
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: space.lg,
            background: C.goldFaint,
            borderRadius: 14,
            padding: 5,
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
            }}
            style={{
              flex: 1,
              padding: "12px 18px",
              borderRadius: 12,
              border: "none",
              fontFamily: font.heading,
              fontSize: 13,
              letterSpacing: 1.8,
              textTransform: "uppercase",
              fontWeight: 600,
              cursor: "pointer",
              background: mode === "login" ? C.gold : "transparent",
              color: mode === "login" ? C.bg : C.goldDim,
              transition: "all 0.2s",
            }}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError("");
            }}
            style={{
              flex: 1,
              padding: "12px 18px",
              borderRadius: 12,
              border: "none",
              fontFamily: font.heading,
              fontSize: 13,
              letterSpacing: 1.8,
              textTransform: "uppercase",
              fontWeight: 600,
              cursor: "pointer",
              background: mode === "signup" ? C.gold : "transparent",
              color: mode === "signup" ? C.bg : C.goldDim,
              transition: "all 0.2s",
            }}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div style={{ marginBottom: space.md }}>
              <label
                style={{
                  fontFamily: font.body,
                  fontSize: 11,
                  color: C.goldDim,
                  marginBottom: 6,
                  display: "block",
                  letterSpacing: 0.5,
                }}
              >
                Display name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How others see you"
                style={inputStyle}
                autoComplete="name"
              />
            </div>
          )}
          <div style={{ marginBottom: space.md }}>
            <label
              style={{
                fontFamily: font.body,
                fontSize: 11,
                color: C.goldDim,
                marginBottom: 6,
                display: "block",
                letterSpacing: 0.5,
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={inputStyle}
              required
              autoComplete={mode === "signup" ? "email" : "username"}
            />
          </div>
          <div style={{ marginBottom: space.lg }}>
            <label
              style={{
                fontFamily: font.body,
                fontSize: 11,
                color: C.goldDim,
                marginBottom: 6,
                display: "block",
                letterSpacing: 0.5,
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
              style={inputStyle}
              required
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              minLength={mode === "signup" ? 6 : undefined}
            />
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
            {loading ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>

        <div style={{ marginTop: space.md, textAlign: "center" }}>
          <button
            type="button"
            onClick={() => setShowAbout(true)}
            style={{
              fontFamily: font.body,
              fontSize: 13,
              color: C.goldDim,
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
              textDecorationColor: "rgba(196,180,130,0.4)",
            }}
          >
            About Swingers
          </button>
        </div>
      </div>

      {showAbout && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: space.lg,
            zIndex: 3000,
          }}
          onClick={() => setShowAbout(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 420,
              background: C.card,
              borderRadius: 24,
              border: `1px solid ${C.cardBorder}`,
              padding: `${space.lg}px ${space.lg}px ${space.md}px`,
              boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                fontFamily: font.display,
                fontSize: 24,
                color: C.cream,
                margin: "0 0 16px",
                fontWeight: 600,
              }}
            >
              Finding a golf game shouldn't be this hard.
            </h2>
            <p
              style={{
                fontFamily: font.body,
                fontSize: 15,
                color: C.creamDim,
                lineHeight: 1.6,
                margin: "0 0 12px",
              }}
            >
              Tee times are scarce. Groups fall apart. And when you need one more player, you get paired with a stranger you know nothing about.
            </p>
            <p
              style={{
                fontFamily: font.body,
                fontSize: 15,
                color: C.creamDim,
                lineHeight: 1.6,
                margin: "0 0 12px",
              }}
            >
              Swingers fixes that. Post your open tee time or find a game — and match with golfers based on handicap, pace, vibe, and preferences. Both sides say yes before anyone shows up on the first tee.
            </p>
            <p
              style={{
                fontFamily: font.body,
                fontSize: 15,
                color: C.creamDim,
                lineHeight: 1.6,
                margin: "0 0 20px",
              }}
            >
              Your round. Your group. Your way.
            </p>
            <div style={{ textAlign: "right" }}>
              <button
                type="button"
                onClick={() => setShowAbout(false)}
                style={{
                  fontFamily: font.body,
                  fontSize: 13,
                  color: C.gold,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
