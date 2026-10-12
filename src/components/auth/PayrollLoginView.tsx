import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import { loadAdminPolicyMaster } from '../payroll/payrollTypes';

interface PayrollLoginViewProps {
  onSwitchToCrmLogin?: () => void;
}

const payChakraCss = `
.pc-root {
  --font-display: "Fredoka", "Trebuchet MS", system-ui, sans-serif;
  --font-body: "DM Sans", system-ui, -apple-system, "Segoe UI", sans-serif;

  --bg: #e4e8f6;
  --surface: #edf0fb;
  --ink: #232647;
  --muted: #5c6190;
  --sh-d: rgba(150, 158, 205, 0.55);
  --sh-l: rgba(255, 255, 255, 0.95);
  --in-d: rgba(160, 168, 215, 0.45);
  --in-l: rgba(255, 255, 255, 0.9);
  --accent: #ff7fbf;
  --accent-sh: rgba(200, 50, 130, 0.42);
  --on-accent: #3a0a26;
  --mint: #7fd8be;
  --butter: #ffd479;
  --peri: #6fb4ff;
  --error: #c2362b;
  --ok: #1d7a5f;
  --field: #e1e5f4;

  min-height: 100vh;
  width: 100%;
  background: var(--bg);
  color: var(--ink);
  font: 15px/1.5 var(--font-body);
  padding-inline: 16px;
  padding-block: 24px;
  overflow-x: hidden;
  box-sizing: border-box;
}

.pc-root * {
  box-sizing: border-box;
}

.pc-stage {
  max-width: 1080px;
  margin-inline: auto;
  min-height: calc(100vh - 48px);
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  gap: clamp(24px, 5vw, 64px);
  align-items: center;
}

/* ---------- Left: brand + scene ---------- */
.pc-brand {
  display: flex;
  align-items: center;
  gap: 18px;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: clamp(1.7rem, 4vw, 2.2rem);
  color: var(--ink);
}

.pc-brand-mark {
  width: 108px;
  height: 108px;
  border-radius: 34px;
  background: var(--surface);
  display: grid;
  place-items: center;
  flex: none;
}

.pc-brand-mark img,
.pc-brand-mark svg {
  width: 82px;
  height: 82px;
  object-fit: contain;
  display: block;
}

.pc-intro h1 {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: clamp(2rem, 4.4vw, 3.1rem);
  line-height: 1.08;
  letter-spacing: -0.01em;
  margin: 24px 0 12px;
  text-wrap: balance;
  color: var(--ink);
}

.pc-intro p {
  color: var(--muted);
  max-width: 44ch;
  margin: 0;
  font-size: 1rem;
}

.pc-scene {
  position: relative;
  height: 330px;
  margin-top: 16px;
}

.pc-obj {
  position: absolute;
  will-change: transform;
  transition: transform 0.25s ease-out;
}

.pc-obj > .pc-float {
  animation: pc-bob var(--dur, 6s) ease-in-out var(--delay, 0s) infinite;
}

@keyframes pc-bob {
  0%, 100% { transform: translateY(0) rotate(var(--r0, 0deg)); }
  50% { transform: translateY(-14px) rotate(var(--r1, 3deg)); }
}

.pc-clay {
  box-shadow:
    12px 14px 26px var(--sh-d),
    -8px -8px 20px var(--sh-l),
    inset -8px -8px 14px var(--in-d),
    inset 8px 8px 14px var(--in-l);
}

.pc-coin {
  width: 124px;
  height: 124px;
  border-radius: 50%;
  background: var(--butter);
  display: grid;
  place-items: center;
  position: relative;
  box-shadow:
    12px 14px 26px rgba(190, 140, 40, 0.35),
    -6px -6px 16px var(--sh-l),
    inset -10px -10px 16px rgba(200, 140, 20, 0.45),
    inset 10px 10px 16px rgba(255, 255, 255, 0.65);
}

.pc-coin::after {
  content: "";
  position: absolute;
  inset: 18px;
  border-radius: 50%;
  box-shadow:
    inset 4px 4px 8px rgba(200, 140, 20, 0.35),
    inset -4px -4px 8px rgba(255, 255, 255, 0.55);
}

.pc-coin span {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 3.1rem;
  color: #7a5200;
  z-index: 1;
}

.pc-slip {
  width: 190px;
  padding: 20px 18px 22px;
  border-radius: 30px;
  background: var(--surface);
}

.pc-slip h3 {
  margin: 0 0 12px;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.95rem;
  display: flex;
  justify-content: space-between;
  color: var(--ink);
}

.pc-slip h3 small {
  color: var(--muted);
  font-family: var(--font-body);
  font-weight: 500;
  font-size: 0.75rem;
  align-self: center;
}

.pc-bar {
  height: 12px;
  border-radius: 999px;
  margin-bottom: 10px;
  background: var(--field);
  box-shadow: inset 3px 3px 6px var(--in-d), inset -3px -3px 6px var(--in-l);
}

.pc-bar.m {
  background: var(--mint);
  box-shadow: inset -3px -3px 6px rgba(0, 0, 0, 0.12), inset 3px 3px 6px rgba(255, 255, 255, 0.55);
  width: 70%;
}

.pc-bar.s {
  width: 45%;
}

.pc-net {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-top: 14px;
  font-variant-numeric: tabular-nums;
}

.pc-net b {
  font-family: var(--font-display);
  font-size: 1.15rem;
  color: var(--ink);
}

.pc-net span {
  color: var(--muted);
  font-size: 0.75rem;
}

.pc-cal {
  width: 112px;
  border-radius: 28px;
  background: var(--surface);
  overflow: hidden;
  text-align: center;
}

.pc-cal .pc-top {
  background: var(--peri);
  color: #14173a;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  padding: 8px 0 6px;
  box-shadow: inset -4px -4px 8px rgba(0, 0, 0, 0.14), inset 4px 4px 8px rgba(255, 255, 255, 0.4);
}

.pc-cal .pc-day {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 2.5rem;
  line-height: 1.1;
  padding-top: 6px;
  color: var(--ink);
}

.pc-cal .pc-lbl {
  color: var(--muted);
  font-size: 0.72rem;
  padding-bottom: 12px;
}

.pc-chip {
  padding: 10px 18px;
  border-radius: 999px;
  background: var(--surface);
  font-weight: 700;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  color: var(--ink);
}

.pc-chip i {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--mint);
  display: inline-block;
  box-shadow: inset -2px -2px 4px rgba(0, 0, 0, 0.15), inset 2px 2px 4px rgba(255, 255, 255, 0.6);
}

.pc-o-coin { left: 4%; top: 4%; --dur: 5.5s; --r1: 8deg; }
.pc-o-slip { left: 30%; top: 28%; --dur: 7s; --delay: -2s; --r0: -4deg; --r1: -1deg; }
.pc-o-cal { left: 68%; top: 0%; --dur: 6.4s; --delay: -1s; --r0: 4deg; --r1: 7deg; }
.pc-o-chip { left: 58%; top: 66%; --dur: 5s; --delay: -3s; }

/* ---------- Right: card ---------- */
.pc-card {
  background: var(--surface);
  border-radius: 44px;
  padding: clamp(22px, 3.6vw, 36px);
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.2s ease-out;
}

.pc-card h2 {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.7rem;
  margin: 0 0 4px;
  color: var(--ink);
}

.pc-card .pc-sub {
  color: var(--muted);
  margin: 0 0 20px;
  font-size: 0.92rem;
}

.pc-portal-tabs {
  display: flex;
  gap: 8px;
  padding: 5px;
  border-radius: 20px;
  background: var(--field);
  box-shadow: inset 4px 4px 8px var(--in-d), inset -4px -4px 8px var(--in-l);
  margin-bottom: 18px;
}

.pc-portal-tab {
  flex: 1;
  border: 0;
  border-radius: 16px;
  padding: 8px 12px;
  font: 600 0.8rem var(--font-body);
  cursor: pointer;
  background: transparent;
  color: var(--muted);
  transition: all 0.18s ease;
  white-space: nowrap;
}

.pc-portal-tab.active {
  background: var(--surface);
  color: var(--ink);
  box-shadow: 4px 5px 10px var(--sh-d), -3px -3px 8px var(--sh-l);
  cursor: default;
}

.pc-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}

.pc-field label {
  font-weight: 700;
  font-size: 0.74rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

.pc-input-wrap {
  position: relative;
}

.pc-input-wrap input {
  width: 100%;
  border: 0;
  outline: 0;
  background: var(--field);
  color: var(--ink);
  font: 500 0.95rem var(--font-body) !important;
  padding: 14px 18px;
  border-radius: 20px;
  box-shadow: inset 6px 6px 12px var(--in-d), inset -6px -6px 12px var(--in-l);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.pc-input-wrap input::placeholder {
  color: var(--muted);
  opacity: 0.8;
}

.pc-input-wrap input:focus-visible {
  transform: scale(1.012);
  box-shadow: inset 6px 6px 12px var(--in-d), inset -6px -6px 12px var(--in-l), 0 0 0 3px var(--peri);
}

.pc-field.bad input {
  box-shadow: inset 6px 6px 12px var(--in-d), inset -6px -6px 12px var(--in-l), 0 0 0 3px var(--error);
  animation: pc-shake 0.35s;
}

@keyframes pc-shake {
  25% { transform: translateX(-6px); }
  50% { transform: translateX(6px); }
  75% { transform: translateX(-3px); }
}

.pc-err {
  color: var(--error);
  font-size: 0.8rem;
  min-height: 1.1em;
  margin: 0;
  font-weight: 500;
}

.pc-peek {
  position: absolute;
  right: 8px;
  top: 50%;
  translate: 0 -50%;
  border: 0;
  cursor: pointer;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--surface);
  color: var(--ink);
  display: grid;
  place-items: center;
  font-size: 0.7rem;
  font-weight: 700;
  font-family: var(--font-body);
  box-shadow: 4px 5px 10px var(--sh-d), -3px -3px 8px var(--sh-l);
  transition: transform 0.15s, box-shadow 0.15s;
}

.pc-peek:active {
  transform: scale(0.92);
  box-shadow: inset 3px 3px 6px var(--in-d), inset -3px -3px 6px var(--in-l);
}

.pc-peek:focus-visible {
  outline: 3px solid var(--peri);
  outline-offset: 2px;
}

.pc-input-wrap.has-peek input {
  padding-right: 54px;
}

.pc-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin: 2px 0 20px;
}

.pc-switch {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--ink);
}

.pc-switch input {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
}

.pc-track {
  width: 52px;
  height: 30px;
  border-radius: 999px;
  background: var(--field);
  flex: none;
  position: relative;
  box-shadow: inset 4px 4px 8px var(--in-d), inset -4px -4px 8px var(--in-l);
  transition: background 0.25s;
}

.pc-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--surface);
  box-shadow: 3px 4px 8px var(--sh-d), -2px -2px 5px var(--sh-l), inset -2px -2px 4px var(--in-d);
  transition: transform 0.3s cubic-bezier(0.3, 1.6, 0.5, 1);
}

.pc-switch input:checked + .pc-track {
  background: var(--mint);
}

.pc-switch input:checked + .pc-track .pc-knob {
  transform: translateX(22px);
}

.pc-switch input:focus-visible + .pc-track {
  outline: 3px solid var(--peri);
  outline-offset: 3px;
}

.pc-link {
  color: var(--ink);
  font-weight: 700;
  font-size: 0.88rem;
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: var(--accent);
  text-underline-offset: 4px;
  text-decoration-thickness: 2px;
}

.pc-link:focus-visible {
  outline: 3px solid var(--peri);
  outline-offset: 3px;
  border-radius: 6px;
}

.pc-go {
  width: 100%;
  border: 0;
  cursor: pointer;
  border-radius: 24px;
  padding: 16px 22px;
  font: 600 1.1rem var(--font-display);
  letter-spacing: 0.01em;
  color: var(--on-accent);
  background: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow:
    10px 14px 24px var(--accent-sh),
    inset -7px -7px 14px rgba(0, 0, 0, 0.16),
    inset 7px 7px 14px rgba(255, 255, 255, 0.5);
  transition: transform 0.18s cubic-bezier(0.3, 1.6, 0.5, 1), box-shadow 0.18s;
}

.pc-go:hover {
  transform: translateY(-2px);
}

.pc-go:active {
  transform: translateY(2px) scale(0.98);
  box-shadow:
    4px 6px 12px var(--accent-sh),
    inset -4px -4px 10px rgba(0, 0, 0, 0.18),
    inset 4px 4px 10px rgba(255, 255, 255, 0.4);
}

.pc-go:focus-visible {
  outline: 3px solid var(--peri);
  outline-offset: 4px;
}

.pc-go[disabled] {
  cursor: progress;
  transform: none;
}

.pc-spin {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 3px solid rgba(58, 10, 38, 0.25);
  border-top-color: var(--on-accent);
  animation: pc-rot 0.7s linear infinite;
}

@keyframes pc-rot {
  to { transform: rotate(360deg); }
}

.pc-status {
  margin: 14px 0 0;
  min-height: 1.8em;
  font-size: 0.85rem;
  color: var(--muted);
}

.pc-status.ok {
  color: var(--ok);
  font-weight: 600;
}

.pc-status.bad {
  color: var(--error);
  font-weight: 600;
}

.pc-drop {
  position: absolute;
  right: 36px;
  top: -26px;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--butter);
  display: grid;
  place-items: center;
  font-family: var(--font-display);
  font-weight: 700;
  color: #7a5200;
  font-size: 1.3rem;
  opacity: 0;
  pointer-events: none;
  box-shadow:
    6px 8px 14px rgba(190, 140, 40, 0.35),
    inset -5px -5px 8px rgba(200, 140, 20, 0.45),
    inset 5px 5px 8px rgba(255, 255, 255, 0.65);
}

.pc-drop.go-drop {
  animation: pc-drop-anim 1s cubic-bezier(0.4, 0, 0.6, 1) forwards;
}

@keyframes pc-drop-anim {
  0% { opacity: 1; transform: translateY(-30px) scale(0.8); }
  55% { opacity: 1; transform: translateY(300px) scale(1); }
  70% { transform: translateY(280px) scale(1.15, 0.8); }
  85% { opacity: 1; transform: translateY(300px) scale(0.95, 1.05); }
  100% { opacity: 0; transform: translateY(300px); }
}

.pc-demos {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(92, 97, 144, 0.16);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.pc-demo-btn {
  border: 0;
  cursor: pointer;
  border-radius: 999px;
  padding: 6px 12px;
  font: 600 0.74rem var(--font-body);
  background: var(--field);
  color: var(--ink);
  box-shadow: 3px 4px 8px var(--sh-d), -2px -2px 6px var(--sh-l);
  transition: transform 0.15s ease;
}

.pc-demo-btn:hover {
  transform: translateY(-1px);
}

.pc-foot {
  margin: 14px 0 0;
  font-size: 0.78rem;
  color: var(--muted);
  text-align: center;
}

@media (max-width: 860px) {
  .pc-stage { grid-template-columns: minmax(0, 1fr); min-height: 0; }
  .pc-scene { height: 250px; }
  .pc-coin { width: 96px; height: 96px; }
  .pc-coin span { font-size: 2.4rem; }
  .pc-slip { width: 160px; padding: 16px 14px; }
  .pc-cal { width: 92px; }
  .pc-cal .pc-day { font-size: 2rem; }
  .pc-o-slip { left: 28%; top: 28%; }
  .pc-o-cal { left: 70%; }
  .pc-o-chip { left: 46%; top: 72%; }
  .pc-intro h1 { margin-top: 20px; }
}

@media (max-width: 420px) {
  .pc-brand-mark { width: 88px; height: 88px; border-radius: 28px; }
  .pc-brand-mark img, .pc-brand-mark svg { width: 68px; height: 68px; }
  .pc-card { border-radius: 36px; }
  .pc-o-chip { display: none; }
  .pc-o-cal { left: 66%; }
}

@media (prefers-reduced-motion: reduce) {
  .pc-obj > .pc-float, .pc-go, .pc-card, .pc-obj { animation: none !important; transition: none !important; }
  .pc-spin { animation-duration: 1.6s; }
}
`;

function PayChakraClayEmblem() {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="pcWheel" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="55%" stopColor="#6fb4ff" />
          <stop offset="100%" stopColor="#3b82f6" />
        </radialGradient>
        <radialGradient id="pcCenter" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffe8a3" />
          <stop offset="60%" stopColor="#ffd479" />
          <stop offset="100%" stopColor="#d99b26" />
        </radialGradient>
        <radialGradient id="pcPetal" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffb3d9" />
          <stop offset="65%" stopColor="#ff7fbf" />
          <stop offset="100%" stopColor="#db4c97" />
        </radialGradient>
        <radialGradient id="pcMint" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#b5f2df" />
          <stop offset="65%" stopColor="#7fd8be" />
          <stop offset="100%" stopColor="#3ea88a" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="46" fill="url(#pcWheel)" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <g key={angle} transform={`rotate(${angle} 60 60)`}>
          <rect
            x="53"
            y="8"
            width="14"
            height="24"
            rx="7"
            fill={i % 2 === 0 ? 'url(#pcPetal)' : 'url(#pcMint)'}
          />
        </g>
      ))}
      <circle cx="60" cy="60" r="26" fill="url(#pcCenter)" />
      <text
        x="60"
        y="71"
        textAnchor="middle"
        fill="#7a5200"
        fontFamily="Fredoka, sans-serif"
        fontWeight="700"
        fontSize="32"
      >
        ₹
      </text>
    </svg>
  );
}

export const PayrollLoginView: React.FC<PayrollLoginViewProps> = ({ onSwitchToCrmLogin }) => {
  const {
    login,
    syncCredentialsFromServer,
    changeEmployeePassword,
    resetUserPassword,
    supplierCompany,
  } = useCrm();

  const stageRef = useRef<HTMLElement | null>(null);
  const policyMaster = useMemo(() => loadAdminPolicyMaster(), []);

  const [values, setValues] = useState({ empId: '', password: '' });
  const [errors, setErrors] = useState({ empId: '', password: '' });
  const [attempt, setAttempt] = useState(0);
  const [showPw, setShowPw] = useState(false);
  const [keep, setKeep] = useState<boolean>(() => {
    try {
      return localStorage.getItem('crm_payroll_keep_signed_in') !== 'false';
    } catch {
      return true;
    }
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ text: string; ok: boolean }>({ text: '', ok: false });
  const [dropKey, setDropKey] = useState(0);

  // Forgot Password / Self-Service Reset mode
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetForm, setResetForm] = useState({
    identifier: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const root = stageRef.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(hover: hover)').matches) return;

    const objs = root.querySelectorAll<HTMLElement>('.pc-obj');
    const card = root.querySelector<HTMLElement>('.pc-card');

    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      objs.forEach((o) => {
        const d = parseFloat(o.dataset.depth || '10') || 10;
        o.style.transform = `translate(${(nx * d).toFixed(1)}px, ${(ny * d).toFixed(1)}px)`;
      });
      if (card) {
        card.style.transform = `perspective(1000px) rotateY(${(nx * 2).toFixed(2)}deg) rotateX(${(-ny * 2).toFixed(2)}deg)`;
      }
    };

    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  const validate = ({ empId, password }: { empId: string; password: string }) => {
    const nextErrors = { empId: '', password: '' };
    if (!empId.trim()) {
      nextErrors.empId = 'Enter your employee code, username, or work email.';
    }
    if (!password) {
      nextErrors.password = 'Enter your password.';
    }
    return nextErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ text: '', ok: false });
    const next = validate(values);
    setErrors(next);
    if (next.empId || next.password) {
      setAttempt((n) => n + 1);
      return;
    }

    const cleanInput = values.empId.trim();
    setLoading(true);
    try {
      try {
        localStorage.setItem('crm_payroll_keep_signed_in', String(keep));
      } catch {
        // ignore
      }

      const reducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const verified = await syncCredentialsFromServer(cleanInput, values.password);
      const res = verified
        ? login(cleanInput, values.password, { portalMode: 'payroll' })
        : {
            success: false,
            message: 'Sign in failed. Check your employee code / email and password.',
          };

      if (!res.success) {
        setAttempt((n) => n + 1);
        setStatus({
          text:
            res.message ||
            'Sign in failed. Check your details and try again.',
          ok: false,
        });
        return;
      }

      if (!reducedMotion) {
        setDropKey((n) => n + 1);
      }
      setStatus({
        text: 'Signed in. Opening your PayChakra ESS portal…',
        ok: true,
      });
    } catch (err: any) {
      setAttempt((n) => n + 1);
      setStatus({
        text: err?.message || 'Sign in failed. Check your details and try again.',
        ok: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const idTrim = resetForm.identifier.trim() || values.empId.trim();
    const nextPass = resetForm.newPassword.trim();
    const confirmPass = resetForm.confirmPassword.trim();

    if (!idTrim) {
      setStatus({ text: 'Enter your employee code or work email.', ok: false });
      return;
    }
    if (nextPass.length < 4) {
      setStatus({ text: 'New password must be at least 4 characters.', ok: false });
      return;
    }
    if (nextPass !== confirmPass) {
      setStatus({ text: 'New password and confirm password do not match.', ok: false });
      return;
    }

    const synced = changeEmployeePassword(idTrim, nextPass);
    const crmRes = resetUserPassword(idTrim, nextPass);

    if (synced || crmRes.success) {
      setValues({ empId: idTrim, password: nextPass });
      setIsResetMode(false);
      setStatus({
        text: 'Password updated! Click Sign in to enter your ESS portal.',
        ok: true,
      });
    } else {
      setStatus({
        text: 'Account not found locally. Sign in with the password set by Admin, then change it from My Profile.',
        ok: false,
      });
    }
  };

  return (
    <div className="pc-root">
      <style>{payChakraCss}</style>

      <main className="pc-stage" ref={stageRef}>
        {/* Left: Brand + Clay Scene */}
        <section className="pc-intro" aria-label="About PayChakra">
          <div className="pc-brand">
            <span className="pc-brand-mark pc-clay">
              {supplierCompany?.logoUrl ? (
                <img
                  src={supplierCompany.logoUrl}
                  alt={supplierCompany.name || 'PayChakra logo'}
                  width="82"
                  height="82"
                />
              ) : (
                <PayChakraClayEmblem />
              )}
            </span>
            <span>PayChakra</span>
          </div>

          <h1>Payday is soft. Your payslips shouldn&apos;t be hard to find.</h1>
          <p>
            Payslips, Form 16, PF and leave balances for every employee, in one place.
          </p>

          <div className="pc-scene" aria-hidden="true">
            <div className="pc-obj pc-o-coin" data-depth="22">
              <div className="pc-float">
                <div className="pc-coin">
                  <span>₹</span>
                </div>
              </div>
            </div>

            <div className="pc-obj pc-o-slip" data-depth="14">
              <div className="pc-float">
                <div className="pc-slip pc-clay">
                  <h3>
                    Payslip <small>{policyMaster.lastPublishedMonth || 'Oct 2026'}</small>
                  </h3>
                  <div className="pc-bar" />
                  <div className="pc-bar m" />
                  <div className="pc-bar s" />
                  <div className="pc-net">
                    <span>Net pay</span>
                    <b>₹84,250</b>
                  </div>
                </div>
              </div>
            </div>

            <div className="pc-obj pc-o-cal" data-depth="30">
              <div className="pc-float">
                <div className="pc-cal pc-clay">
                  <div className="pc-top">OCT</div>
                  <div className="pc-day">31</div>
                  <div className="pc-lbl">Next pay run</div>
                </div>
              </div>
            </div>

            <div className="pc-obj pc-o-chip" data-depth="38">
              <div className="pc-float">
                <div className="pc-chip pc-clay">
                  <i />
                  Form 16 ready
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Puffy Sign-In Card */}
        <section className="pc-card pc-clay" id="card" aria-labelledby="login-title">
          {dropKey > 0 && (
            <div key={dropKey} className="pc-drop go-drop" aria-hidden="true">
              ₹
            </div>
          )}

          {onSwitchToCrmLogin && (
            <div className="pc-portal-tabs" role="tablist" aria-label="Portal Switcher">
              <button
                type="button"
                role="tab"
                aria-selected="false"
                className="pc-portal-tab"
                onClick={onSwitchToCrmLogin}
              >
                Enterprise CRM
              </button>
              <button
                type="button"
                role="tab"
                aria-selected="true"
                className="pc-portal-tab active"
              >
                PayChakra ESS Portal
              </button>
            </div>
          )}

          {!isResetMode ? (
            <>
              <h2 id="login-title">Welcome back</h2>
              <p className="pc-sub">
                Sign in with your employee code or work email to see this month&apos;s payslip.
              </p>

              <form onSubmit={handleSubmit} noValidate>
                <div className={`pc-field${errors.empId ? ' bad' : ''}`}>
                  <label htmlFor="empid">Employee code or work email</label>
                  <div className="pc-input-wrap">
                    <input
                      key={`id-${attempt}`}
                      id="empid"
                      name="empid"
                      type="text"
                      autoComplete="username"
                      placeholder="EMP-001 or employee@company.com"
                      value={values.empId}
                      onChange={(e) => {
                        setValues((v) => ({ ...v, empId: e.target.value }));
                        if (errors.empId) setErrors((err) => ({ ...err, empId: '' }));
                      }}
                      aria-invalid={Boolean(errors.empId)}
                      aria-describedby="e-id"
                    />
                  </div>
                  <p className="pc-err" id="e-id" role="alert">
                    {errors.empId}
                  </p>
                </div>

                <div className={`pc-field${errors.password ? ' bad' : ''}`}>
                  <label htmlFor="pw">Password</label>
                  <div className="pc-input-wrap has-peek">
                    <input
                      key={`pw-${attempt}`}
                      id="pw"
                      name="pw"
                      type={showPw ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Your password (set by Admin or personal)"
                      value={values.password}
                      onChange={(e) => {
                        setValues((v) => ({ ...v, password: e.target.value }));
                        if (errors.password) setErrors((err) => ({ ...err, password: '' }));
                      }}
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby="e-pw"
                    />
                    <button
                      type="button"
                      className="pc-peek"
                      onClick={() => setShowPw((s) => !s)}
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                      aria-pressed={showPw}
                    >
                      {showPw ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <p className="pc-err" id="e-pw" role="alert">
                    {errors.password}
                  </p>
                </div>

                <div className="pc-row">
                  <label className="pc-switch">
                    <input
                      type="checkbox"
                      checked={keep}
                      onChange={(e) => setKeep(e.target.checked)}
                    />
                    <span className="pc-track">
                      <span className="pc-knob" />
                    </span>
                    Keep me signed in
                  </label>

                  <button
                    type="button"
                    className="pc-link"
                    onClick={() => {
                      setResetForm({
                        identifier: values.empId,
                        newPassword: '',
                        confirmPassword: '',
                      });
                      setStatus({ text: '', ok: false });
                      setIsResetMode(true);
                    }}
                  >
                    Forgot password?
                  </button>
                </div>

                <button className="pc-go" type="submit" disabled={loading}>
                  <span>{loading ? 'Signing in' : 'Sign in'}</span>
                  {loading && <span className="pc-spin" />}
                </button>

                {status.text && (
                  <p
                    className={`pc-status${status.ok ? ' ok' : ' bad'}`}
                    role="status"
                    aria-live="polite"
                  >
                    {status.text}
                  </p>
                )}
              </form>

              <div className="pc-demos">
                <button
                  type="button"
                  className="pc-demo-btn"
                  onClick={() => {
                    setValues({ empId: 'EMP-001', password: 'password123' });
                    setErrors({ empId: '', password: '' });
                    setStatus({ text: 'Filled EMP-001 credentials. Click Sign in.', ok: true });
                  }}
                >
                  Demo: EMP-001
                </button>
                <button
                  type="button"
                  className="pc-demo-btn"
                  onClick={() => {
                    setValues({ empId: 'EMP-003', password: 'password123' });
                    setErrors({ empId: '', password: '' });
                    setStatus({ text: 'Filled EMP-003 credentials. Click Sign in.', ok: true });
                  }}
                >
                  Demo: EMP-003
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 id="login-title">Reset password</h2>
              <p className="pc-sub">
                Update your ESS portal password using your Employee Code or Official Email ID.
              </p>

              <form onSubmit={handleResetSubmit} noValidate>
                <div className="pc-field">
                  <label htmlFor="reset-id">Employee code or work email</label>
                  <div className="pc-input-wrap">
                    <input
                      id="reset-id"
                      type="text"
                      placeholder="EMP-001 or employee@company.com"
                      value={resetForm.identifier}
                      onChange={(e) =>
                        setResetForm((prev) => ({ ...prev, identifier: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="pc-field">
                  <label htmlFor="reset-pw">New password</label>
                  <div className="pc-input-wrap has-peek">
                    <input
                      id="reset-pw"
                      type={showPw ? 'text' : 'password'}
                      placeholder="Minimum 4 characters"
                      value={resetForm.newPassword}
                      onChange={(e) =>
                        setResetForm((prev) => ({ ...prev, newPassword: e.target.value }))
                      }
                    />
                    <button
                      type="button"
                      className="pc-peek"
                      onClick={() => setShowPw((s) => !s)}
                    >
                      {showPw ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div className="pc-field">
                  <label htmlFor="reset-confirm">Confirm new password</label>
                  <div className="pc-input-wrap">
                    <input
                      id="reset-confirm"
                      type={showPw ? 'text' : 'password'}
                      placeholder="Re-enter new password"
                      value={resetForm.confirmPassword}
                      onChange={(e) =>
                        setResetForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="pc-row">
                  <button
                    type="button"
                    className="pc-link"
                    onClick={() => {
                      setIsResetMode(false);
                      setStatus({ text: '', ok: false });
                    }}
                  >
                    ← Back to sign in
                  </button>
                </div>

                <button className="pc-go" type="submit">
                  <span>Update password</span>
                </button>

                {status.text && (
                  <p
                    className={`pc-status${status.ok ? ' ok' : ' bad'}`}
                    role="status"
                    aria-live="polite"
                  >
                    {status.text}
                  </p>
                )}
              </form>
            </>
          )}

          <p className="pc-foot">
            Payroll data is encrypted in transit. Contact HR if your code is not recognised.
          </p>
        </section>
      </main>
    </div>
  );
};

export default PayrollLoginView;
