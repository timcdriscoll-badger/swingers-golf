import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "./firebase";

// Reuse app styling constants
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
  red: "#f87171",
  redDim: "rgba(248,113,113,0.1)",
};

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

  const inputStyle = {
    fontFamily: font.body,
    fontSize: 15,
    color: C.cream,
    background: "rgba(168,148,96,0.06)",
    border: `1px solid rgba(168,148,96,0.15)`,
    borderRadius: 10,
    padding: "14px 16px",
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
        padding: 24,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: `linear-gradient(170deg, ${C.card} 0%, #081408 100%)`,
          border: `1px solid ${C.cardBorder}`,
          borderRadius: 24,
          padding: "32px 28px 28px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <span style={{ fontSize: 40 }}>⛳</span>
          <h1
            style={{
              fontFamily: font.display,
              fontSize: 28,
              fontWeight: 700,
              color: C.gold,
              margin: "12px 0 6px",
              letterSpacing: -0.5,
            }}
          >
            Swingers
          </h1>
          <p style={{ fontFamily: font.body, fontSize: 14, color: C.goldDim }}>
            Golf tee time marketplace
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 24,
            background: C.goldFaint,
            borderRadius: 12,
            padding: 4,
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
              padding: "10px 16px",
              borderRadius: 10,
              border: "none",
              fontFamily: font.heading,
              fontSize: 13,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              fontWeight: 700,
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
              padding: "10px 16px",
              borderRadius: 10,
              border: "none",
              fontFamily: font.heading,
              fontSize: 13,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              fontWeight: 700,
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
            <div style={{ marginBottom: 14 }}>
              <label
                style={{
                  fontFamily: font.body,
                  fontSize: 12,
                  color: C.goldDim,
                  marginBottom: 6,
                  display: "block",
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
          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                fontFamily: font.body,
                fontSize: 12,
                color: C.goldDim,
                marginBottom: 6,
                display: "block",
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
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                fontFamily: font.body,
                fontSize: 12,
                color: C.goldDim,
                marginBottom: 6,
                display: "block",
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
                border: `1px solid ${C.red}30`,
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 16,
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
              padding: "14px 24px",
              borderRadius: 12,
              border: "none",
              fontFamily: font.heading,
              fontSize: 14,
              letterSpacing: 2,
              textTransform: "uppercase",
              fontWeight: 700,
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
      </div>
    </div>
  );
}
