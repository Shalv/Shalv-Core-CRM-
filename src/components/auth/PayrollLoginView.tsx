import React, { useState, useEffect, useRef } from 'react';
import { useCrm } from '../../context/CrmContext';
import { BrandLogo, SwirlingRibbonEmblem } from '../common/BrandLogo';

interface PayrollLoginViewProps {
  onSwitchToCrmLogin?: () => void;
}

const payChakraAuroraCss = `
.pca-root {
  --font-display: "Fraunces", "Iowan Old Style", Georgia, serif;
  --font-body: "Manrope", system-ui, -apple-system, "Segoe UI", sans-serif;

  --bg: #ffffff;
  --ink: #0f172a;
  --muted: #475569;
  --line: #e2e8f0;
  --field: #f8fafc;
  --cyan: #0284c7;
  --blue: #2563eb;
  --pink: #d946ef;
  --grad: linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #4f46e5 100%);
  --on-grad: #ffffff;
  --error: #b91c1c;
  --ok: #047857;
  color-scheme: light;

  position: relative;
  min-height: 100vh;
  width: 100%;
  margin: 0;
  background: radial-gradient(circle at 28% 48%, rgba(240, 249, 255, 0.85) 0%, rgba(255, 255, 255, 0.94) 55%, #f8fafc 100%) !important;
  color: var(--ink);
  font: 15px/1.55 var(--font-body);
  padding-inline: 16px;
  padding-block: 32px;
  overflow-x: hidden;
  box-sizing: border-box;
}

.pca-chakra-canvas {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  display: block;
  z-index: 0;
  pointer-events: none;
}

.pca-root * {
  box-sizing: border-box;
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
  gap: 18px;
}

.pca-brand-logo-img {
  max-height: 88px;
  max-width: 220px;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
  filter: drop-shadow(0 6px 16px rgba(37, 99, 235, 0.18));
  border-radius: 12px;
}

.pca-brand-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pca-brand-company {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(1.6rem, 3.4vw, 2.2rem);
  letter-spacing: -0.015em;
  color: #0f172a;
  line-height: 1.15;
}

.pca-brand-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #0284c7;
  background: rgba(240, 249, 255, 0.95);
  border: 1px solid #bae6fd;
  padding: 3px 10px;
  border-radius: 9999px;
  width: fit-content;
}

.pca-card-brand-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 16px;
  margin-bottom: 18px;
  border-bottom: 1px solid #f1f5f9;
}

.pca-intro h1 {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: clamp(2.3rem, 5.2vw, 3.8rem);
  line-height: 1.08;
  letter-spacing: -0.02em;
  margin: 32px 0 18px;
  text-wrap: balance;
  color: #0f172a;
}

.pca-intro h1 em {
  font-style: italic;
  padding-right: 0.06em;
  color: #2563eb;
}

.pca-lede {
  color: #334155;
  max-width: 46ch;
  margin: 0;
  font-size: 1.08rem;
  line-height: 1.6;
}

.pca-facts {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  margin: 40px 0 0;
  padding: 0;
  max-width: 620px;
  border-top: 1px solid #e2e8f0;
}

.pca-facts div {
  flex: 1 1 170px;
  min-width: 0;
  padding: 18px 20px 0 0;
}

.pca-facts div + div {
  padding-left: 20px;
  border-left: 1px solid #e2e8f0;
}

.pca-facts dt {
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #64748b;
  margin: 0 0 6px;
}

.pca-facts dd {
  margin: 0;
  font-weight: 700;
  font-size: 1.02rem;
  font-variant-numeric: tabular-nums;
  color: #0f172a;
}

.pca-facts dd small {
  display: block;
  color: #0284c7;
  font-weight: 600;
  font-size: 0.84rem;
  margin-top: 3px;
}

/* ---------- Card ---------- */
.pca-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  padding: clamp(26px, 4vw, 42px);
  box-shadow: 0 20px 45px -12px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.04);
  min-width: 0;
}

.pca-portal-tabs {
  display: flex;
  gap: 6px;
  padding: 4px;
  border-radius: 12px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  margin-bottom: 20px;
}

.pca-portal-tab {
  flex: 1;
  border: 0;
  border-radius: 9px;
  padding: 8px 12px;
  font: 700 0.78rem var(--font-body);
  cursor: pointer;
  background: transparent;
  color: #475569;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.pca-portal-tab:hover {
  color: #0f172a;
}

.pca-portal-tab.active {
  background: #ffffff;
  color: #1e293b;
  border: 1px solid #cbd5e1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  cursor: default;
}

.pca-card .pca-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #0369a1;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  padding: 4px 10px;
  border-radius: 9999px;
  margin-bottom: 16px;
}

.pca-card h2 {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 2.05rem;
  line-height: 1.15;
  margin: 0 0 6px;
  color: #0f172a;
}

.pca-card .pca-sub {
  color: #475569;
  margin: 0 0 24px;
  font-size: 0.95rem;
  line-height: 1.5;
}

.pca-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 18px;
}

.pca-field label {
  font-weight: 700;
  font-size: 0.76rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #334155;
}

.pca-input-wrap {
  position: relative;
}

.pca-input-wrap input {
  width: 100%;
  height: 50px;
  padding: 0 18px;
  color: #0f172a;
  background: #f8fafc;
  font: 500 0.96rem var(--font-body) !important;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  outline: 0;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}

.pca-input-wrap input::placeholder {
  color: #94a3b8;
}

.pca-input-wrap input:hover {
  border-color: #94a3b8;
  background: #ffffff;
}

.pca-input-wrap input:focus-visible {
  border-color: #2563eb;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.pca-field.bad input {
  border-color: #dc2626;
  background: #fff5f5;
  animation: pca-shake 0.35s;
}

@keyframes pca-shake {
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-2px); }
}

.pca-err {
  color: #b91c1c;
  font-size: 0.84rem;
  font-weight: 500;
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
  color: #475569;
  font: 700 0.74rem var(--font-body);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s ease;
}

.pca-peek:hover {
  color: #0f172a;
  background: #f1f5f9;
}

.pca-peek:focus-visible {
  outline: 2px solid #2563eb;
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
  font-size: 0.92rem;
  font-weight: 500;
  color: #1e293b;
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
  background: #e2e8f0;
  border: 1px solid #cbd5e1;
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
  background: #475569;
  transition: transform 0.25s cubic-bezier(0.3, 1.4, 0.5, 1), background 0.25s;
}

.pca-switch input:checked + .pca-track {
  background: linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #4338ca 100%);
  border-color: transparent;
}

.pca-switch input:checked + .pca-track .pca-knob {
  transform: translateX(20px);
  background: #ffffff;
}

.pca-switch input:focus-visible + .pca-track {
  outline: 2px solid #2563eb;
  outline-offset: 3px;
}

.pca-link {
  color: #2563eb;
  font-weight: 700;
  font-size: 0.92rem;
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: #93c5fd;
  text-underline-offset: 4px;
  text-decoration-thickness: 1.5px;
  transition: color 0.15s, text-decoration-color 0.15s;
}

.pca-link:hover {
  color: #1d4ed8;
  text-decoration-color: #2563eb;
}

.pca-link:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 3px;
  border-radius: 4px;
}

.pca-go {
  width: 100%;
  height: 52px;
  border: 0;
  border-radius: 12px;
  cursor: pointer;
  background: linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #4338ca 100%);
  color: #ffffff;
  font: 800 1rem var(--font-body);
  letter-spacing: 0.02em;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  box-shadow: 0 10px 25px -4px rgba(37, 99, 235, 0.35);
  transition: transform 0.15s, box-shadow 0.2s, opacity 0.2s;
}

.pca-go:hover {
  box-shadow: 0 14px 30px -4px rgba(37, 99, 235, 0.45);
  transform: translateY(-1px);
}

.pca-go:active {
  transform: translateY(1px);
}

.pca-go:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 3px;
}

.pca-go[disabled] {
  cursor: progress;
  opacity: 0.85;
}

.pca-spin {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.35);
  border-top-color: #ffffff;
  animation: pca-rot 0.7s linear infinite;
}

@keyframes pca-rot {
  to { transform: rotate(360deg); }
}

.pca-status {
  margin: 14px 0 0;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 500;
  line-height: 1.45;
}

.pca-status.ok {
  color: #047857;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
}

.pca-status.bad {
  color: #b91c1c;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.pca-foot {
  margin: 18px 0 0;
  font-size: 0.82rem;
  color: #64748b;
  line-height: 1.45;
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

function nextPayRun(now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const payday = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const days = Math.round((payday.getTime() - today.getTime()) / 86400000);
  const date = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(payday);
  return { date, days };
}

export const PayrollLoginView: React.FC<PayrollLoginViewProps> = ({ onSwitchToCrmLogin }) => {
  const {
    users,
    login,
    syncCredentialsFromServer,
    changeEmployeePassword,
    resetUserPassword,
    supplierCompany,
  } = useCrm();

  const urlLockedIdentity = React.useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const emailParam = (params.get('email') || '').trim();
      const empParam = (params.get('emp') || '').trim();
      return {
        email: emailParam,
        empCode: empParam,
        isLockedLink: Boolean(emailParam || empParam),
      };
    } catch {
      return { email: '', empCode: '', isLockedLink: false };
    }
  }, []);

  const [values, setValues] = useState(() => ({
    empId: urlLockedIdentity.email || urlLockedIdentity.empCode || '',
    password: '',
  }));
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

  // Self-service password change mode (requires current password)
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetForm, setResetForm] = useState({
    identifier: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0;
    let h = 0;
    let raf: number;
    let angle = 0;
    let innerAngle = 0;
    let time = 0;
    const mouse = { x: -999, y: -999, targetX: 0, targetY: 0 };

    const resize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const onMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };
    window.addEventListener('mousemove', onMouseMove);

    const motes = Array.from({ length: 36 }, (_, i) => ({
      angle: (i / 36) * Math.PI * 2,
      distRatio: 0.35 + (i % 6) * 0.14,
      speed: (0.0016 + (i % 5) * 0.0011) * (i % 2 === 0 ? 1 : -1),
      radius: 1.5 + (i % 4) * 0.9,
      color: ['#0284c7', '#2563eb', '#7c3aed', '#d946ef', '#f59e0b', '#10b981'][i % 6],
      alpha: 0.25 + (i % 5) * 0.12,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      if (mouse.targetX > 0) {
        mouse.x += (mouse.targetX - mouse.x) * 0.04;
        mouse.y += (mouse.targetY - mouse.y) * 0.04;
      }

      const baseX = w >= 860 ? w * 0.34 : w * 0.5;
      const baseY = h * 0.5;
      const offsetX = mouse.x > 0 ? (mouse.x - w * 0.5) * 0.03 : 0;
      const offsetY = mouse.y > 0 ? (mouse.y - h * 0.5) * 0.03 : 0;
      const cx = baseX + offsetX;
      const cy = baseY + offsetY;

      const R = Math.max(160, Math.min(w * 0.32, h * 0.44, 340));
      const pulse = 1 + Math.sin(time * 0.02) * 0.025;

      // 1. Ambient atmospheric glow
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.9);
      glow.addColorStop(0, 'rgba(56, 189, 248, 0.16)');
      glow.addColorStop(0.3, 'rgba(99, 102, 241, 0.09)');
      glow.addColorStop(0.65, 'rgba(217, 70, 239, 0.035)');
      glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // 2. Outer concentric geometry rings
      ctx.save();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(2, 132, 199, 0.18)';
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.12 * pulse, 0, Math.PI * 2);
      ctx.stroke();

      ctx.setLineDash([4, 8]);
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.22)';
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.04, 0, Math.PI * 2);
      ctx.stroke();

      ctx.setLineDash([2, 5]);
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.2)';
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.94, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 3. Rotating outer lotus/chakra petal beads (32 intervals)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle * 0.75);
      const beadCount = 32;
      for (let i = 0; i < beadCount; i++) {
        const theta = (i * Math.PI * 2) / beadCount;
        const bx = Math.cos(theta) * (R * 1.04);
        const by = Math.sin(theta) * (R * 1.04);
        ctx.fillStyle = i % 4 === 0 ? 'rgba(37, 99, 235, 0.45)' : 'rgba(2, 132, 199, 0.28)';
        ctx.beginPath();
        ctx.arc(bx, by, i % 4 === 0 ? 3.2 : 2.0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 4. Sacred 24 radiant spokes
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle * 0.5);
      const spokeCount = 24;
      for (let i = 0; i < spokeCount; i++) {
        const theta = (i * Math.PI * 2) / spokeCount;
        const innerX = Math.cos(theta) * (R * 0.24);
        const innerY = Math.sin(theta) * (R * 0.24);
        const outerX = Math.cos(theta) * (R * 0.92);
        const outerY = Math.sin(theta) * (R * 0.92);

        const isMajor = i % 6 === 0;
        ctx.lineWidth = isMajor ? 1.8 : 0.9;
        ctx.strokeStyle = isMajor ? 'rgba(37, 99, 235, 0.35)' : 'rgba(14, 165, 233, 0.16)';
        ctx.beginPath();
        ctx.moveTo(innerX, innerY);
        ctx.lineTo(outerX, outerY);
        ctx.stroke();

        if (isMajor) {
          const midX = Math.cos(theta) * (R * 0.62);
          const midY = Math.sin(theta) * (R * 0.62);
          ctx.fillStyle = 'rgba(79, 70, 229, 0.45)';
          ctx.beginPath();
          ctx.arc(midX, midY, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // 5. Four sweeping multi-color spiraling chakra ribbon arms
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-innerAngle);
      const quadColors = [
        { c1: '#00F2FE', c2: '#1D4ED8' },
        { c1: '#FF0844', c2: '#7C3AED' },
        { c1: '#EF4444', c2: '#F59E0B' },
        { c1: '#10B981', c2: '#06B6D4' },
      ];

      for (let q = 0; q < 4; q++) {
        ctx.save();
        ctx.rotate((q * Math.PI) / 2);

        ctx.beginPath();
        ctx.moveTo(R * 0.12, R * 0.65);
        ctx.bezierCurveTo(R * 0.06, R * 0.38, R * 0.18, R * 0.12, R * 0.44, R * 0.08);
        ctx.bezierCurveTo(R * 0.66, R * 0.04, R * 0.88, R * 0.12, R * 0.96, R * 0.32);
        ctx.bezierCurveTo(R * 0.78, R * 0.18, R * 0.58, R * 0.14, R * 0.42, R * 0.18);
        ctx.bezierCurveTo(R * 0.24, R * 0.24, R * 0.15, R * 0.42, R * 0.14, R * 0.65);
        ctx.closePath();

        const grad = ctx.createLinearGradient(R * 0.1, R * 0.65, R * 0.95, R * 0.2);
        grad.addColorStop(0, quadColors[q].c1);
        grad.addColorStop(1, quadColors[q].c2);
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.28;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(R * 0.38, R * 0.2);
        ctx.bezierCurveTo(R * 0.52, R * 0.16, R * 0.68, R * 0.22, R * 0.76, R * 0.32);
        ctx.bezierCurveTo(R * 0.64, R * 0.26, R * 0.52, R * 0.24, R * 0.42, R * 0.26);
        ctx.bezierCurveTo(R * 0.3, R * 0.29, R * 0.22, R * 0.4, R * 0.24, R * 0.55);
        ctx.bezierCurveTo(R * 0.18, R * 0.42, R * 0.2, R * 0.26, R * 0.38, R * 0.2);
        ctx.closePath();
        ctx.globalAlpha = 0.22;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(R * 0.42, R * 0.42, 6.2, 0, Math.PI * 2);
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = quadColors[q].c2;
        ctx.fill();

        ctx.restore();
      }
      ctx.restore();

      // 6. Inner core rings & Bindu center
      ctx.save();
      ctx.translate(cx, cy);
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = 'rgba(2, 132, 199, 0.4)';
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.24, 0, Math.PI * 2);
      ctx.stroke();

      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(79, 70, 229, 0.3)';
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.15, 0, Math.PI * 2);
      ctx.stroke();

      const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.08);
      coreGrad.addColorStop(0, '#38bdf8');
      coreGrad.addColorStop(0.5, '#2563eb');
      coreGrad.addColorStop(1, '#1e3a8a');
      ctx.fillStyle = coreGrad;
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.08 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 7. Orbiting cosmic stardust motes
      motes.forEach((m) => {
        const mx = cx + Math.cos(m.angle) * (R * m.distRatio);
        const my = cy + Math.sin(m.angle) * (R * m.distRatio);
        ctx.fillStyle = m.color;
        ctx.globalAlpha = m.alpha * (0.8 + Math.sin(time * 0.03 + m.angle) * 0.2);
        ctx.beginPath();
        ctx.arc(mx, my, m.radius, 0, Math.PI * 2);
        ctx.fill();

        if (!reduce) {
          m.angle += m.speed;
        }
      });

      if (!reduce) {
        angle += 0.0028;
        innerAngle += 0.002;
        time += 1;
        raf = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

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
    if (urlLockedIdentity.isLockedLink) {
      const inputLower = cleanInput.toLowerCase();
      const allowedEmail = urlLockedIdentity.email.toLowerCase();
      const allowedCode = urlLockedIdentity.empCode.toLowerCase();
      if (
        (allowedEmail && inputLower !== allowedEmail && (!allowedCode || inputLower !== allowedCode)) ||
        (!allowedEmail && allowedCode && inputLower !== allowedCode)
      ) {
        setAttempt((n) => n + 1);
        setStatus({
          text: `Access Restricted: This personal ESS portal link is assigned to ${
            urlLockedIdentity.email || urlLockedIdentity.empCode
          } only. You cannot sign in with another employee's login.`,
          ok: false,
        });
        return;
      }
    }

    setLoading(true);
    try {
      try {
        localStorage.setItem('crm_payroll_keep_signed_in', String(keep));
      } catch {
        // ignore
      }

      const verified = await syncCredentialsFromServer(cleanInput, values.password, 'payroll');
      const res = verified
        ? login(cleanInput, values.password, {
            portalMode: 'payroll',
            requiredEmail: urlLockedIdentity.email || undefined,
          })
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

      try {
        sessionStorage.setItem('crm_session_portal', 'payroll');
      } catch {
        // ignore
      }

      setStatus({
        text: 'Signed in. Redirecting to Payroll Dashboard…',
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
    const currPass = resetForm.currentPassword.trim();
    const nextPass = resetForm.newPassword.trim();
    const confirmPass = resetForm.confirmPassword.trim();

    if (!idTrim) {
      setStatus({ text: 'Enter your employee code or work email.', ok: false });
      return;
    }
    if (!currPass) {
      setStatus({
        text: 'Enter your current password (set by Admin or your previous password).',
        ok: false,
      });
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

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: idTrim,
          currentPassword: currPass,
          newPassword: nextPass,
          confirmPassword: confirmPass,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.success === false) {
        setStatus({
          text: data?.message || 'Current password is incorrect. Contact Admin if you forgot your password.',
          ok: false,
        });
        return;
      }
    } catch {
      setStatus({
        text: 'Could not verify current password with server. Please sign in and change your password from My Profile.',
        ok: false,
      });
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
      setValues({ empId: idTrim, password: nextPass });
      setIsResetMode(false);
      setStatus({
        text: 'Password updated! Click Sign in to open your ESS portal.',
        ok: true,
      });
    }
  };

  return (
    <div className="pca-root">
      <style>{payChakraAuroraCss}</style>
      <canvas ref={canvasRef} className="pca-chakra-canvas" aria-hidden="true" />

      <main className="pca-stage">
        <section className="pca-intro" aria-label="About PayChakra">
          <div className="pca-brand">
            <img
              src="/paychakra-logo.svg"
              alt="PayChakra"
              className="pca-brand-logo-img max-h-16 md:max-h-20 w-auto max-w-[280px] object-contain drop-shadow-md"
            />
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
          <div className="pca-card-brand-bar">
            <img
              src="/paychakra-logo.svg"
              alt="PayChakra"
              className="h-8 max-w-[180px] w-auto object-contain drop-shadow-xs"
            />
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-sky-800 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              Verified Payroll
            </span>
          </div>

          {onSwitchToCrmLogin && !urlLockedIdentity.isLockedLink && (
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
                Payroll Portal
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
                {users.length === 0
                  ? 'No employees are registered yet. Sign in through the CRM workspace to set up your administrator account and enroll employees.'
                  : "Use your employee code or work email to open this month's payslip."}
              </p>

              {users.length === 0 && (
                <div
                  style={{
                    marginBottom: 18,
                    padding: '12px 14px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    fontSize: '0.84rem',
                    color: '#334155',
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                    No Active Employees
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                    All user accounts have been removed. Switch to the Enterprise CRM tab above to initialize your Super Admin account.
                  </p>
                </div>
              )}

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
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      });
                      setStatus({ text: '', ok: false });
                      setIsResetMode(true);
                    }}
                  >
                    Change password?
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
            </>
          ) : (
            <>
              <h2 id="login-title">Change password</h2>
              <p className="pca-sub">
                Verify your current password set by Admin to update your ESS portal login password.
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
                      readOnly={urlLockedIdentity.isLockedLink}
                      onChange={(e) =>
                        setResetForm((prev) => ({ ...prev, identifier: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="pca-field">
                  <label htmlFor="reset-curr-pw">Current password</label>
                  <div className="pca-input-wrap">
                    <input
                      id="reset-curr-pw"
                      type={showPw ? 'text' : 'password'}
                      placeholder="Password set by Admin or current password"
                      value={resetForm.currentPassword}
                      onChange={(e) =>
                        setResetForm((prev) => ({ ...prev, currentPassword: e.target.value }))
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
