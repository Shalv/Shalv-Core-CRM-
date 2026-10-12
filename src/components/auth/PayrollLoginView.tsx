import React, { useState, useEffect, useRef } from 'react';
import { useCrm } from '../../context/CrmContext';

interface PayrollLoginViewProps {
  onSwitchToCrmLogin?: () => void;
}

const RINGS = [
  { r: 0.16, speed: 0.14, arcs: 2, width: 1.6, dot: true },
  { r: 0.26, speed: -0.09, arcs: 3, width: 2.4, dot: true },
  { r: 0.37, speed: 0.06, arcs: 2, width: 1.2, dot: false },
  { r: 0.49, speed: -0.045, arcs: 3, width: 2.8, dot: true },
  { r: 0.63, speed: 0.03, arcs: 4, width: 1.2, dot: false },
];

const ORBS = [
  { c: '53,214,255', x: 0.18, y: 0.2, ax: 0.08, ay: 0.1, sx: 0.11, sy: 0.09, p: 0, r: 0.42 },
  { c: '111,125,255', x: 0.7, y: 0.45, ax: 0.1, ay: 0.12, sx: 0.07, sy: 0.1, p: 2, r: 0.5 },
  { c: '255,79,184', x: 0.85, y: 0.85, ax: 0.08, ay: 0.08, sx: 0.09, sy: 0.06, p: 4, r: 0.38 },
];

const payChakraAuroraCss = `
.pca-root {
  --font-display: "Fraunces", "Iowan Old Style", Georgia, serif;
  --font-body: "Manrope", system-ui, -apple-system, "Segoe UI", sans-serif;

  --bg: #060818;
  --ink: #eef1ff;
  --muted: #a3abd0;
  --line: rgba(160, 175, 255, 0.2);
  --glass: rgba(12, 16, 44, 0.62);
  --field: rgba(7, 10, 32, 0.72);
  --cyan: #35d6ff;
  --blue: #6f7dff;
  --pink: #ff4fb8;
  --grad: linear-gradient(100deg, #35d6ff 0%, #6f7dff 48%, #ff4fb8 100%);
  --on-grad: #080a26;
  --error: #ff9aa8;
  --ok: #67e3b9;
  color-scheme: dark;

  position: relative;
  min-height: 100vh;
  width: 100%;
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font: 15px/1.55 var(--font-body);
  padding-inline: 16px;
  padding-block: 32px;
  overflow-x: hidden;
  box-sizing: border-box;
}

.pca-root * {
  box-sizing: border-box;
}

.pca-bg {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  display: block;
}

.pca-stage {
  position: relative;
  z-index: 1;
  max-width: 1160px;
  margin-inline: auto;
  min-height: calc(100vh - 64px);
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: clamp(28px, 6vw, 88px);
  align-items: center;
}

/* ---------- Left ---------- */
.pca-brand {
  display: flex;
  align-items: center;
  gap: 16px;
}

.pca-brand img,
.pca-brand svg {
  width: 84px;
  height: 84px;
  object-fit: contain;
  display: block;
  filter: drop-shadow(0 0 22px rgba(111, 125, 255, 0.55));
}

.pca-brand span {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: clamp(1.7rem, 4vw, 2.2rem);
  letter-spacing: 0.01em;
  color: var(--ink);
}

.pca-intro h1 {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: clamp(2.3rem, 5.2vw, 4rem);
  line-height: 1.04;
  letter-spacing: -0.015em;
  margin: 34px 0 18px;
  text-wrap: balance;
  color: var(--ink);
}

.pca-intro h1 em {
  font-style: italic;
  padding-right: 0.06em;
  background: var(--grad);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.pca-lede {
  color: var(--muted);
  max-width: 46ch;
  margin: 0;
  font-size: 1.05rem;
}

.pca-facts {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  margin: 40px 0 0;
  padding: 0;
  max-width: 620px;
  border-top: 1px solid var(--line);
}

.pca-facts div {
  flex: 1 1 170px;
  min-width: 0;
  padding: 16px 20px 0 0;
}

.pca-facts div + div {
  padding-left: 20px;
  border-left: 1px solid var(--line);
}

.pca-facts dt {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 0 0 6px;
}

.pca-facts dd {
  margin: 0;
  font-weight: 700;
  font-size: 0.98rem;
  font-variant-numeric: tabular-nums;
  color: var(--ink);
}

.pca-facts dd small {
  display: block;
  color: var(--cyan);
  font-weight: 500;
  font-size: 0.82rem;
  margin-top: 2px;
}

/* ---------- Card ---------- */
.pca-card {
  background: var(--glass);
  -webkit-backdrop-filter: blur(20px) saturate(1.25);
  backdrop-filter: blur(20px) saturate(1.25);
  border: 1px solid var(--line);
  border-radius: 24px;
  padding: clamp(24px, 4vw, 40px);
  box-shadow: 0 40px 90px rgba(2, 3, 16, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  min-width: 0;
}

.pca-portal-tabs {
  display: flex;
  gap: 6px;
  padding: 4px;
  border-radius: 12px;
  background: var(--field);
  border: 1px solid var(--line);
  margin-bottom: 18px;
}

.pca-portal-tab {
  flex: 1;
  border: 0;
  border-radius: 9px;
  padding: 7px 12px;
  font: 700 0.76rem var(--font-body);
  cursor: pointer;
  background: transparent;
  color: var(--muted);
  transition: all 0.2s ease;
  white-space: nowrap;
}

.pca-portal-tab:hover {
  color: var(--ink);
}

.pca-portal-tab.active {
  background: rgba(111, 125, 255, 0.22);
  color: var(--cyan);
  border: 1px solid rgba(53, 214, 255, 0.35);
  cursor: default;
}

.pca-card .pca-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--cyan);
  margin-bottom: 14px;
}

.pca-card h2 {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 2rem;
  line-height: 1.1;
  margin: 0 0 6px;
  color: var(--ink);
}

.pca-card .pca-sub {
  color: var(--muted);
  margin: 0 0 24px;
  font-size: 0.95rem;
}

.pca-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.pca-field label {
  font-weight: 700;
  font-size: 0.74rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
}

.pca-input-wrap {
  position: relative;
}

.pca-input-wrap input {
  width: 100%;
  height: 50px;
  padding: 0 18px;
  color: var(--ink);
  background: var(--field);
  font: 500 0.96rem var(--font-body) !important;
  border: 1px solid var(--line);
  border-radius: 12px;
  outline: 0;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}

.pca-input-wrap input::placeholder {
  color: #7a82ad;
}

.pca-input-wrap input:hover {
  border-color: rgba(160, 175, 255, 0.4);
}

.pca-input-wrap input:focus-visible {
  border-color: var(--cyan);
  box-shadow: 0 0 0 3px rgba(53, 214, 255, 0.2);
}

.pca-field.bad input {
  border-color: var(--error);
  animation: pca-shake 0.35s;
}

@keyframes pca-shake {
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-2px); }
}

.pca-err {
  color: var(--error);
  font-size: 0.82rem;
  min-height: 1.2em;
  margin: 0;
}

.pca-has-peek input {
  padding-right: 70px;
}

.pca-peek {
  position: absolute;
  right: 6px;
  top: 50%;
  translate: 0 -50%;
  height: 38px;
  padding: 0 12px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--muted);
  font: 700 0.72rem var(--font-body);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
}

.pca-peek:hover {
  color: var(--ink);
  background: rgba(160, 175, 255, 0.12);
}

.pca-peek:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: 1px;
}

.pca-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin: 6px 0 24px;
}

.pca-switch {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--ink);
}

.pca-switch input {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
}

.pca-track {
  width: 44px;
  height: 24px;
  border-radius: 999px;
  background: var(--field);
  border: 1px solid var(--line);
  position: relative;
  flex: none;
  transition: background 0.25s, border-color 0.25s;
}

.pca-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--ink);
  transition: transform 0.25s cubic-bezier(0.3, 1.4, 0.5, 1);
}

.pca-switch input:checked + .pca-track {
  background: var(--grad);
  border-color: transparent;
}

.pca-switch input:checked + .pca-track .pca-knob {
  transform: translateX(20px);
  background: #fff;
}

.pca-switch input:focus-visible + .pca-track {
  outline: 2px solid var(--cyan);
  outline-offset: 3px;
}

.pca-link {
  color: var(--ink);
  font-weight: 700;
  font-size: 0.9rem;
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: var(--pink);
  text-underline-offset: 4px;
  text-decoration-thickness: 2px;
}

.pca-link:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: 3px;
  border-radius: 4px;
}

.pca-go {
  width: 100%;
  height: 52px;
  border: 0;
  border-radius: 12px;
  cursor: pointer;
  background: var(--grad);
  background-size: 160% 100%;
  background-position: 0 0;
  color: var(--on-grad);
  font: 800 1rem var(--font-body);
  letter-spacing: 0.02em;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  box-shadow: 0 12px 34px rgba(111, 125, 255, 0.4);
  transition: background-position 0.5s ease, transform 0.15s, box-shadow 0.2s;
}

.pca-go:hover {
  background-position: 100% 0;
  box-shadow: 0 14px 40px rgba(255, 79, 184, 0.35);
}

.pca-go:active {
  transform: translateY(1px);
}

.pca-go:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 3px;
}

.pca-go[disabled] {
  cursor: progress;
  opacity: 0.9;
}

.pca-spin {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 3px solid rgba(8, 10, 38, 0.25);
  border-top-color: var(--on-grad);
  animation: pca-rot 0.7s linear infinite;
}

@keyframes pca-rot {
  to { transform: rotate(360deg); }
}

.pca-status {
  margin: 14px 0 0;
  min-height: 2em;
  font-size: 0.88rem;
  color: var(--muted);
}

.pca-status.ok {
  color: var(--ok);
}

.pca-status.bad {
  color: var(--error);
}

.pca-demos {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.pca-demo-btn {
  border: 1px solid var(--line);
  cursor: pointer;
  border-radius: 999px;
  padding: 5px 12px;
  font: 600 0.74rem var(--font-body);
  background: var(--field);
  color: var(--muted);
  transition: border-color 0.2s, color 0.2s;
}

.pca-demo-btn:hover {
  border-color: var(--cyan);
  color: var(--ink);
}

.pca-foot {
  margin: 16px 0 0;
  font-size: 0.8rem;
  color: var(--muted);
}

@media (max-width: 860px) {
  .pca-stage { grid-template-columns: minmax(0, 1fr); min-height: 0; gap: 36px; }
  .pca-brand img, .pca-brand svg { width: 68px; height: 68px; }
  .pca-intro h1 { margin-top: 24px; }
  .pca-facts { margin-top: 28px; }
}

@media (max-width: 420px) {
  .pca-facts div { flex-basis: 100%; padding-left: 0 !important; border-left: 0 !important; padding-bottom: 4px; }
  .pca-card { border-radius: 20px; }
}

@media (prefers-reduced-motion: reduce) {
  .pca-go, .pca-input-wrap input, .pca-knob, .pca-track { transition: none; }
  .pca-field.bad input { animation: none; }
  .pca-spin { animation-duration: 1.8s; }
}
`;

function PayChakraAuroraEmblem() {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="pcaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#35d6ff" />
          <stop offset="50%" stopColor="#6f7dff" />
          <stop offset="100%" stopColor="#ff4fb8" />
        </linearGradient>
        <radialGradient id="pcaCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#35d6ff" stopOpacity="0.95" />
          <stop offset="65%" stopColor="#6f7dff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#080a26" stopOpacity="0.95" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="52" stroke="url(#pcaGrad)" strokeWidth="3.5" opacity="0.85" />
      <circle
        cx="60"
        cy="60"
        r="41"
        stroke="url(#pcaGrad)"
        strokeWidth="2"
        strokeDasharray="10 6"
        opacity="0.7"
      />
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 60 60)`}>
          <path
            d="M60 10 L64 26 L56 26 Z"
            fill="url(#pcaGrad)"
            opacity="0.9"
          />
        </g>
      ))}
      <circle cx="60" cy="60" r="24" fill="url(#pcaCore)" stroke="#eef1ff" strokeWidth="1.5" />
      <text
        x="60"
        y="69"
        textAnchor="middle"
        fill="#eef1ff"
        fontFamily="Fraunces, Georgia, serif"
        fontWeight="600"
        fontSize="26"
      >
        ₹
      </text>
    </svg>
  );
}

function AuroraBackground() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(hover: hover)').matches;
    let w = 0;
    let h = 0;
    let base = 0;
    let raf = 0;
    let last = 0;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const dust = Array.from({ length: 70 }, () => ({
      x: Math.random(),
      y: Math.random(),
      s: 0.004 + Math.random() * 0.012,
      a: 0.2 + Math.random() * 0.6,
      p: Math.random() * 6.28,
    }));

    function draw(t: number, dt: number) {
      if (!ctx) return;
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#060818';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';

      for (const o of ORBS) {
        const x = w * (o.x + o.ax * Math.sin(t * o.sx + o.p));
        const y = h * (o.y + o.ay * Math.cos(t * o.sy + o.p));
        const rad = base * o.r;
        const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
        g.addColorStop(0, `rgba(${o.c},0.26)`);
        g.addColorStop(1, `rgba(${o.c},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }

      pointer.x += (pointer.tx - pointer.x) * 0.04;
      pointer.y += (pointer.ty - pointer.y) * 0.04;
      const wide = w >= 860;
      const cx = (wide ? w * 0.72 : w * 0.5) + pointer.x * 22;
      const cy = (wide ? h * 0.5 : h * 0.3) + pointer.y * 22;
      ctx.lineCap = 'round';

      RINGS.forEach((ring, i) => {
        const rad = base * ring.r * (1 + 0.015 * Math.sin(t * 0.5 + i));
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(160,175,255,0.07)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.stroke();

        const grad = ctx.createLinearGradient(cx - rad, cy, cx + rad, cy);
        grad.addColorStop(0, '#35d6ff');
        grad.addColorStop(0.5, '#6f7dff');
        grad.addColorStop(1, '#ff4fb8');
        const span = (Math.PI * 2) / ring.arcs;
        for (let k = 0; k < ring.arcs; k++) {
          const start = t * ring.speed + k * span + i;
          const end = start + span * 0.55;
          ctx.globalAlpha = 0.6;
          ctx.strokeStyle = grad;
          ctx.lineWidth = ring.width;
          ctx.beginPath();
          ctx.arc(cx, cy, rad, start, end);
          ctx.stroke();

          if (ring.dot) {
            const dx = cx + rad * Math.cos(end);
            const dy = cy + rad * Math.sin(end);
            ctx.globalAlpha = 0.95;
            ctx.shadowBlur = 14;
            ctx.shadowColor = '#35d6ff';
            ctx.fillStyle = '#bff3ff';
            ctx.beginPath();
            ctx.arc(dx, dy, 3.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      });

      ctx.globalAlpha = 1;
      for (const d of dust) {
        d.y -= d.s * dt;
        if (d.y < -0.02) {
          d.y = 1.02;
          d.x = Math.random();
        }
        const a = d.a * (0.5 + 0.5 * Math.sin(t * 1.2 + d.p));
        ctx.fillStyle = `rgba(190,215,255,${a.toFixed(3)})`;
        ctx.fillRect(d.x * w, d.y * h, 1.4, 1.4);
      }

      ctx.globalCompositeOperation = 'source-over';
      const shade = ctx.createLinearGradient(0, 0, w * (wide ? 0.6 : 1), 0);
      shade.addColorStop(0, 'rgba(6,8,24,0.6)');
      shade.addColorStop(1, 'rgba(6,8,24,0)');
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, w, h);
    }

    function resize() {
      if (!canvas || !ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      base = Math.hypot(w, h) / 2;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduce) draw(4, 0);
    }

    function loop(now: number) {
      const t = now / 1000;
      const dt = last ? Math.min(t - last, 0.1) : 0.016;
      last = t;
      draw(t, dt);
      raf = requestAnimationFrame(loop);
    }

    const onMove = (e: PointerEvent) => {
      pointer.tx = (e.clientX / w - 0.5) * 2;
      pointer.ty = (e.clientY / h - 0.5) * 2;
    };

    resize();
    window.addEventListener('resize', resize);
    if (!reduce) {
      raf = requestAnimationFrame(loop);
      if (fine) window.addEventListener('pointermove', onMove);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return <canvas ref={ref} className="pca-bg" aria-hidden="true" />;
}

function nextPayRun(now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const payday = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const days = Math.round((payday.getTime() - today.getTime()) / 86400000);
  const date = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(payday);
  return { date, days };
}

export const PayrollLoginView: React.FC<PayrollLoginViewProps> = ({ onSwitchToCrmLogin }) => {
  const {
    login,
    syncCredentialsFromServer,
    changeEmployeePassword,
    resetUserPassword,
    supplierCompany,
  } = useCrm();

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

  // Forgot password / self-service reset mode
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetForm, setResetForm] = useState({
    identifier: '',
    newPassword: '',
    confirmPassword: '',
  });

  const { date, days } = nextPayRun();
  const when = days === 0 ? 'closes today' : days === 1 ? 'in 1 day' : `in ${days} days`;

  const validate = ({ empId, password }: { empId: string; password: string }) => {
    const nextErrors = { empId: '', password: '' };
    if (!empId.trim()) {
      nextErrors.empId = 'Enter your employee code or work email.';
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

      const verified = await syncCredentialsFromServer(cleanInput, values.password);
      const res = verified
        ? login(cleanInput, values.password, { portalMode: 'payroll' })
        : {
            success: false,
            message: 'Sign in failed. Check your details and try again.',
          };

      if (!res.success) {
        setAttempt((n) => n + 1);
        setStatus({
          text: res.message || 'Sign in failed. Check your details and try again.',
          ok: false,
        });
        return;
      }

      setStatus({
        text: 'Signed in.',
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

  const handleResetSubmit = (e: React.FormEvent) => {
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
        text: 'Password updated! Click Sign in to open your ESS portal.',
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
    <div className="pca-root">
      <style>{payChakraAuroraCss}</style>
      <AuroraBackground />

      <main className="pca-stage">
        <section className="pca-intro" aria-label="About PayChakra">
          <div className="pca-brand">
            <PayChakraAuroraEmblem />
            <span>PayChakra</span>
          </div>

          <h1>
            Payroll that turns <em>on time</em>, every month.
          </h1>
          <p className="pca-lede">
            Payslips, Form 16, PF and leave balances for every employee, in one place.
          </p>

          <dl className="pca-facts">
            <div>
              <dt>Pay run</dt>
              <dd>
                {date}
                <small>{when}</small>
              </dd>
            </div>
            <div>
              <dt>Statutory</dt>
              <dd>
                PF · ESI · TDS
                <small>Form 16 on request</small>
              </dd>
            </div>
            <div>
              <dt>Access</dt>
              <dd>
                Employees and HR
                <small>Role-based sign in</small>
              </dd>
            </div>
          </dl>
        </section>

        <section className="pca-card" aria-labelledby="login-title">
          {onSwitchToCrmLogin && (
            <div className="pca-portal-tabs" role="tablist" aria-label="Portal Switcher">
              <button
                type="button"
                role="tab"
                aria-selected="false"
                className="pca-portal-tab"
                onClick={onSwitchToCrmLogin}
              >
                Enterprise CRM
              </button>
              <button
                type="button"
                role="tab"
                aria-selected="true"
                className="pca-portal-tab active"
              >
                PayChakra ESS Portal
              </button>
            </div>
          )}

          <div className="pca-eyebrow">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="4" y="11" width="16" height="10" rx="2.5" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            Secure sign in
          </div>

          {!isResetMode ? (
            <>
              <h2 id="login-title">Welcome back</h2>
              <p className="pca-sub">
                Use your employee code or work email to open this month&apos;s payslip.
              </p>

              <form onSubmit={handleSubmit} noValidate>
                <div className={`pca-field${errors.empId ? ' bad' : ''}`}>
                  <label htmlFor="empid">Employee code or work email</label>
                  <div className="pca-input-wrap">
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
                  <p className="pca-err" id="e-id" role="alert">
                    {errors.empId}
                  </p>
                </div>

                <div className={`pca-field${errors.password ? ' bad' : ''}`}>
                  <label htmlFor="pw">Password</label>
                  <div className="pca-input-wrap pca-has-peek">
                    <input
                      key={`pw-${attempt}`}
                      id="pw"
                      name="pw"
                      type={showPw ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Your password"
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
                      className="pca-peek"
                      onClick={() => setShowPw((s) => !s)}
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                      aria-pressed={showPw}
                    >
                      {showPw ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <p className="pca-err" id="e-pw" role="alert">
                    {errors.password}
                  </p>
                </div>

                <div className="pca-row">
                  <label className="pca-switch">
                    <input
                      type="checkbox"
                      checked={keep}
                      onChange={(e) => setKeep(e.target.checked)}
                    />
                    <span className="pca-track">
                      <span className="pca-knob" />
                    </span>
                    Keep me signed in
                  </label>

                  <button
                    type="button"
                    className="pca-link"
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

                <button className="pca-go" type="submit" disabled={loading}>
                  <span>{loading ? 'Signing in' : 'Sign in'}</span>
                  {loading && <span className="pca-spin" />}
                </button>

                {status.text && (
                  <p
                    className={`pca-status${status.ok ? ' ok' : ' bad'}`}
                    role="status"
                    aria-live="polite"
                  >
                    {status.text}
                  </p>
                )}
              </form>

              <div className="pca-demos">
                <button
                  type="button"
                  className="pca-demo-btn"
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
                  className="pca-demo-btn"
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
              <p className="pca-sub">
                Update your ESS portal password using your Employee Code or Official Email ID.
              </p>

              <form onSubmit={handleResetSubmit} noValidate>
                <div className="pca-field">
                  <label htmlFor="reset-id">Employee code or work email</label>
                  <div className="pca-input-wrap">
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

                <div className="pca-field">
                  <label htmlFor="reset-pw">New password</label>
                  <div className="pca-input-wrap pca-has-peek">
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
                      className="pca-peek"
                      onClick={() => setShowPw((s) => !s)}
                    >
                      {showPw ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div className="pca-field">
                  <label htmlFor="reset-confirm">Confirm new password</label>
                  <div className="pca-input-wrap">
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

                <div className="pca-row">
                  <button
                    type="button"
                    className="pca-link"
                    onClick={() => {
                      setIsResetMode(false);
                      setStatus({ text: '', ok: false });
                    }}
                  >
                    ← Back to sign in
                  </button>
                </div>

                <button className="pca-go" type="submit">
                  <span>Update password</span>
                </button>

                {status.text && (
                  <p
                    className={`pca-status${status.ok ? ' ok' : ' bad'}`}
                    role="status"
                    aria-live="polite"
                  >
                    {status.text}
                  </p>
                )}
              </form>
            </>
          )}

          <p className="pca-foot">
            Payroll data is encrypted in transit. Contact HR if your code is not recognised.
          </p>
        </section>
      </main>
    </div>
  );
};

export default PayrollLoginView;
