import React, { useEffect, useRef, useState } from 'react';
import { useCrm } from '../../context/CrmContext';
import { BrandLogo } from '../common/BrandLogo';
import { PayrollLoginView } from './PayrollLoginView';

const COLORS = ['#2563EB', '#3B82F6', '#0EA5E9', '#60A5FA', '#38BDF8'];

const css = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

.cl-root {
  position: relative;
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  font-family: 'IBM Plex Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #000000;
  background: #ffffff;
  overflow: hidden;
}

.cl-canvas {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  display: block;
  z-index: 0;
}

.cl-stage {
  position: relative;
  z-index: 1;
  overflow: hidden;
  color: #000000;
  background: transparent;
  pointer-events: none;
}

.cl-copy {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  box-sizing: border-box;
  padding: 56px clamp(28px, 5vw, 72px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  pointer-events: none;
}

.cl-copy h2 {
  margin: 0 0 14px;
  max-width: 18ch;
  font-size: clamp(30px, 3.3vw, 46px);
  line-height: 1.12;
  font-weight: 700;
  letter-spacing: -0.015em;
  color: #000000;
}

.cl-lead {
  margin: 0 0 40px;
  max-width: 46ch;
  font-size: 16px;
  line-height: 1.55;
  color: #000000;
}

.cl-feats {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 22px;
  max-width: 480px;
}

.cl-feats li {
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 16px;
  align-items: start;
}

.cl-ico {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: rgba(37, 99, 235, 0.1);
  border: 1px solid rgba(37, 99, 235, 0.25);
  backdrop-filter: blur(8px);
}

.cl-feats b {
  display: block;
  font-weight: 700;
  font-size: 15px;
  color: #000000;
  margin-bottom: 2px;
}

.cl-feats span {
  font-size: 14px;
  line-height: 1.5;
  color: #000000;
}

.cl-trust {
  position: absolute;
  z-index: 1;
  left: clamp(28px, 5vw, 72px);
  bottom: 32px;
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  font-size: 13px;
  font-weight: 500;
  color: #000000;
  pointer-events: none;
}

.cl-trust span {
  display: flex;
  align-items: center;
  gap: 7px;
}

.cl-side {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  box-sizing: border-box;
  padding: 32px clamp(24px, 5vw, 72px) 28px;
  background: transparent;
}

.cl-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.cl-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 18px;
  color: #000000;
}

.cl-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cl-form-wrap {
  width: min(440px, 100%);
  padding: 38px 36px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.52);
  backdrop-filter: blur(22px) saturate(180%);
  -webkit-backdrop-filter: blur(22px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.85);
  box-shadow:
    0 24px 64px -12px rgba(15, 23, 42, 0.14),
    0 4px 16px -2px rgba(37, 99, 235, 0.08),
    inset 0 1px 1px rgba(255, 255, 255, 0.95),
    0 0 0 1px rgba(0, 0, 0, 0.08);
  color: #000000;
}

.cl-h {
  font-size: 27px;
  line-height: 1.15;
  font-weight: 700;
  margin: 0 0 6px;
  letter-spacing: -0.015em;
  color: #000000;
}

.cl-sub {
  margin: 0 0 24px;
  color: #000000;
  font-size: 14.5px;
  line-height: 1.5;
}

.cl-field {
  margin-bottom: 18px;
}

.cl-field label,
.cl-labelrow {
  display: block;
  font-size: 13.5px;
  font-weight: 600;
  color: #000000;
  margin-bottom: 6px;
}

.cl-labelrow {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cl-input {
  position: relative;
}

.cl-input input {
  width: 100%;
  box-sizing: border-box;
  height: 46px;
  padding: 0 14px;
  border-radius: 10px;
  font: inherit;
  font-size: 14.5px;
  color: #000000;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 0, 0, 0.2);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}

.cl-input input.with-toggle {
  padding-right: 68px;
}

.cl-input input::placeholder {
  color: rgba(0, 0, 0, 0.45);
}

.cl-input input:focus {
  background: rgba(255, 255, 255, 0.92);
  border-color: #2563EB;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.16);
}

.cl-input input[aria-invalid="true"] {
  border-color: #C0362C;
}

.cl-toggle {
  position: absolute;
  right: 6px;
  top: 6px;
  height: 34px;
  padding: 0 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #000000;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.cl-toggle:hover {
  color: #000000;
  background: rgba(0, 0, 0, 0.06);
}

.cl-toggle:focus-visible,
.cl-link:focus-visible,
.cl-check input:focus-visible + span,
.cl-btn:focus-visible {
  outline: 2px solid #2563EB;
  outline-offset: 2px;
}

.cl-err {
  margin: 6px 0 0;
  font-size: 12.5px;
  color: #B02E25;
  line-height: 1.4;
}

.cl-row {
  margin: 18px 0 24px;
}

.cl-check {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  position: relative;
}

.cl-check input.cl-native-check {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
  margin: 0;
}

.cl-custom-box {
  width: 18px;
  height: 18px;
  min-width: 18px;
  border-radius: 4px;
  border: 1.5px solid #8A98AF;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  box-sizing: border-box;
}

.cl-check:hover .cl-custom-box {
  border-color: #2563EB;
}

.cl-check input.cl-native-check:checked + .cl-custom-box {
  background: #2563EB;
  border-color: #2563EB;
}

.cl-check input.cl-native-check:focus-visible + .cl-custom-box {
  outline: 2px solid #2563EB;
  outline-offset: 2px;
}

.cl-check-text {
  font-size: 14px;
  font-weight: 500;
  color: #000000;
  line-height: 1.4;
  white-space: nowrap;
}

.cl-link {
  color: #000000;
  font: inherit;
  font-weight: 600;
  background: none;
  border: 0;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  transition: opacity 0.15s;
}

.cl-link:hover {
  opacity: 0.75;
}

.cl-btn {
  width: 100%;
  height: 48px;
  border: 0;
  border-radius: 8px;
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  background: #2563EB;
  color: #ffffff;
  transition: background 0.15s, transform 0.1s;
}

.cl-btn:hover:not(:disabled) {
  background: #1D4ED8;
}

.cl-btn:active:not(:disabled) {
  transform: scale(0.995);
}

.cl-btn:disabled {
  cursor: default;
  opacity: 0.85;
}

.cl-btn.ok {
  background: #1E7A4F;
}

.cl-foot {
  margin: 22px 0 0;
  font-size: 13.5px;
  color: #000000;
  text-align: center;
}

.cl-legal {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 20px;
  font-size: 13px;
  color: #000000;
  border-top: 1px solid rgba(0, 0, 0, 0.12);
  padding-top: 18px;
}

.cl-legal nav {
  display: flex;
  gap: 18px;
}

.cl-legal a {
  color: #000000;
  text-decoration: none;
  transition: opacity 0.15s;
}

.cl-legal a:hover {
  color: #000000;
  text-decoration: underline;
}

.cl-alert-info {
  margin-bottom: 16px;
  padding: 10px 14px;
  background: rgba(239, 246, 255, 0.85);
  border: 1px solid rgba(37, 99, 235, 0.3);
  border-radius: 8px;
  font-size: 13px;
  color: #000000;
  line-height: 1.45;
}

@media (max-width: 960px) {
  .cl-root {
    grid-template-columns: 1fr;
  }
  .cl-stage {
    display: none;
  }
  .cl-side {
    padding: 24px 20px 20px;
  }
}

@media (max-height: 760px) {
  .cl-trust {
    display: none;
  }
}
`;

const Icon = ({ d }: { d: React.ReactNode }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#2563EB"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {d}
  </svg>
);

interface SimNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  c: string;
}

export const LoginView: React.FC = () => {
  const { users, login, syncCredentialsFromServer, changeEmployeePassword, supplierCompany } = useCrm();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sim = useRef({ link: 140, linkT: 140, speed: 1, speedT: 1, gather: false });
  const nudge = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check URL query parameters for ?portal=payroll and ?email=...
  const [isPayrollPortalMode, setIsPayrollPortalMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const p = new URLSearchParams(window.location.search).get('portal');
    return p === 'payroll';
  });

  const [email, setEmail] = useState(() => {
    if (typeof window === 'undefined') return '';
    const e = new URLSearchParams(window.location.search).get('email');
    return e ? decodeURIComponent(e) : '';
  });

  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const [infoNotice, setInfoNotice] = useState<string | null>(null);
  const [linkCopiedToast, setLinkCopiedToast] = useState(false);

  // First-login password change state
  const [firstLoginTarget, setFirstLoginTarget] = useState<{
    email: string;
    name: string;
    tempPass: string;
  } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [pwdChangeError, setPwdChangeError] = useState<string | null>(null);

  // Dynamic branding details from Company Setup Master
  const companyName = supplierCompany?.name || 'Coreenact Solutions';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0;
    let h = 0;
    let raf: number;
    const mouse = { x: -999, y: -999 };

    const resize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    const nodes: SimNode[] = Array.from({ length: 56 }, (_, i) => ({
      x: Math.random() * (w || 1400),
      y: Math.random() * (h || 900),
      vx: (Math.random() - 0.5) * 0.38,
      vy: (Math.random() - 0.5) * 0.38,
      r: 4 + Math.random() * 3,
      c: COLORS[i % COLORS.length] || '#2563EB',
    }));

    const draw = () => {
      const s = sim.current;
      s.link += (s.linkT - s.link) * 0.05;
      s.speed += (s.speedT - s.speed) * 0.05;
      ctx.clearRect(0, 0, w, h);
      const k = reduce ? 0 : 1;

      nodes.forEach((n, i) => {
        if (s.gather) {
          const a = (i / nodes.length) * 6.283;
          const rad = 50 + (i % 4) * 30;
          n.x += (w * 0.5 + Math.cos(a) * rad - n.x) * 0.04;
          n.y += (h * 0.5 + Math.sin(a) * rad - n.y) * 0.04;
        } else {
          n.x += n.vx * s.speed * k;
          n.y += n.vy * s.speed * k;
          if (n.x < 0 || n.x > w) n.vx *= -1;
          if (n.y < 0 || n.y > h) n.vy *= -1;
        }
      });

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const d = Math.hypot((nodes[i]?.x ?? 0) - (nodes[j]?.x ?? 0), (nodes[i]?.y ?? 0) - (nodes[j]?.y ?? 0));
          if (d < s.link) {
            ctx.strokeStyle = `rgba(37, 99, 235, ${(1 - d / s.link) * 0.28})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodes[i]?.x ?? 0, nodes[i]?.y ?? 0);
            ctx.lineTo(nodes[j]?.x ?? 0, nodes[j]?.y ?? 0);
            ctx.stroke();
          }
        }
      }

      let hover: { n: SimNode; d: number } | null = null;
      for (const n of nodes) {
        const d = Math.hypot(n.x - mouse.x, n.y - mouse.y);
        if (d < 150) {
          ctx.strokeStyle = `rgba(59,130,246,${(1 - d / 150) * 0.55})`;
          ctx.beginPath();
          ctx.moveTo(mouse.x, mouse.y);
          ctx.lineTo(n.x, n.y);
          ctx.stroke();
        }
        if (d < n.r + 12 && (!hover || d < hover.d)) {
          hover = { n, d };
        }
      }

      for (const n of nodes) {
        const r = hover && hover.n === n ? n.r * 1.6 : n.r;
        ctx.fillStyle = n.c + '26';
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 2.4, 0, 6.283);
        ctx.fill();
        ctx.fillStyle = n.c;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, 6.283);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    draw();

    const move = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const leave = () => {
      mouse.x = -999;
      mouse.y = -999;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', move);
    document.addEventListener('pointerleave', leave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', leave);
    };
  }, []);

  const reach = () => {
    if (status === 'done') return;
    sim.current.linkT = 210;
    sim.current.speedT = 1.8;
    if (nudge.current) clearTimeout(nudge.current);
    nudge.current = setTimeout(() => {
      sim.current.linkT = 140;
      sim.current.speedT = 1;
    }, 800);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.trim()) {
      e.email = 'Enter your work email or username.';
    }
    if (!password) {
      e.password = 'Enter your password.';
    } else if (password.length < 4) {
      e.password = 'Password must have at least 4 characters.';
    }
    return e;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setInfoNotice(null);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    setStatus('loading');
    sim.current.linkT = 260;

    let res = login(email, password);

    // The browser's cached user list can be stale (new domain/device, password changed
    // elsewhere). Re-check against the server's saved data before rejecting.
    if (!res.success && !/inactive/i.test(res.message || '')) {
      if (await syncCredentialsFromServer(email, password)) {
        res = login(email, password);
      }
    }

    if (!res.success) {
      setStatus('idle');
      if (res.message?.includes('user') || res.message?.includes('account') || res.message?.includes('email')) {
        setErrors({ email: res.message });
      } else {
        setErrors({ password: res.message || 'Invalid credentials.' });
      }
      return;
    }

    setStatus('done');
    sim.current.gather = true;
    sim.current.linkT = 420;
  };

  const handleSaveNewPassword = (ev: React.FormEvent) => {
    ev.preventDefault();
    setPwdChangeError(null);
    if (!newPassword || newPassword.length < 4) {
      setPwdChangeError('New password must contain at least 4 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdChangeError('Passwords do not match. Please verify.');
      return;
    }
    if (firstLoginTarget) {
      setStatus('loading');
      changeEmployeePassword(firstLoginTarget.email, newPassword);
      const res = login(firstLoginTarget.email, newPassword);
      if (res.success) {
        setStatus('done');
        sim.current.gather = true;
        sim.current.linkT = 420;
      } else {
        setStatus('idle');
        setPwdChangeError(res.message || 'Failed to authenticate with new password.');
      }
    }
  };

  const handleCopyPortalLink = () => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('portal', 'payroll');
    navigator.clipboard.writeText(url.toString()).then(() => {
      setLinkCopiedToast(true);
      setTimeout(() => setLinkCopiedToast(false), 2500);
    });
  };

  const handleSwitchToPayrollPage = () => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('portal', 'payroll');
      window.history.replaceState({}, '', url.toString());
    }
    setIsPayrollPortalMode(true);
  };

  const handleSwitchToCrmPage = () => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('portal');
      url.searchParams.delete('email');
      url.searchParams.delete('emp');
      window.history.replaceState({}, '', url.toString());
    }
    setIsPayrollPortalMode(false);
  };

  if (isPayrollPortalMode) {
    return <PayrollLoginView onSwitchToCrmLogin={handleSwitchToCrmPage} />;
  }

  return (
    <div className="cl-root">
      <style>{css}</style>

      {/* Full-Page Interactive Network Animation on All-White Background */}
      <canvas ref={canvasRef} className="cl-canvas" aria-hidden="true" />

      {/* Left Column: Relationship Stage Copy */}
      <section className="cl-stage">
        <div className="cl-copy">
          <div className="mb-8 inline-flex items-center w-fit">
            <BrandLogo variant="mark" size="2xl" showTagline={false} theme="light" />
          </div>

          <h2>Behind every lead is a person worth knowing.</h2>
          <p className="cl-lead">
            {companyName} keeps every customer relationship, conversation and deal in one place, so your team can respond with context instead of guesswork.
          </p>
          <ul className="cl-feats">
            <li>
              <div className="cl-ico">
                <Icon
                  d={
                    <>
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
                    </>
                  }
                />
              </div>
              <div>
                <b>One profile per customer</b>
                <span>History, preferences and past conversations, always up to date.</span>
              </div>
            </li>
            <li>
              <div className="cl-ico">
                <Icon
                  d={
                    <>
                      <path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7z" />
                      <path d="M10 20a2 2 0 0 0 4 0" />
                    </>
                  }
                />
              </div>
              <div>
                <b>Follow-ups that never slip</b>
                <span>Reminders, activities and milestone alerts tied to every deal.</span>
              </div>
            </li>
            <li>
              <div className="cl-ico">
                <Icon
                  d={
                    <>
                      <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
                    </>
                  }
                />
              </div>
              <div>
                <b>A clear view of the pipeline</b>
                <span>Track each deal from qualification to orders, GST billing and collections.</span>
              </div>
            </li>
          </ul>
        </div>
        <div className="cl-trust">
          {['Encrypted sign-in', 'Role-based access', 'Single sign-on'].map((t) => (
            <span key={t}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#5FD3C4"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12l5 5 9-10" />
              </svg>
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* Right Column: Clean Sign In Form */}
      <div className="cl-side">
        <main className="cl-main">
          <div className="cl-form-wrap">
            {firstLoginTarget ? (
              <div>
                <div className="mb-4 inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  First Sign-In · Password Setup Required
                </div>
                <h1 className="cl-h">Set Your New Password</h1>
                <p className="cl-sub">
                  Welcome, <strong>{firstLoginTarget.name}</strong>! Your account was initialized with a temporary password. Please set a new permanent password to continue.
                </p>

                {pwdChangeError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs leading-relaxed">
                    {pwdChangeError}
                  </div>
                )}

                <form onSubmit={handleSaveNewPassword} noValidate>
                  <div className="cl-field">
                    <label htmlFor="new-password">New Password</label>
                    <div className="cl-input">
                      <input
                        id="new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Choose a new password (min. 4 chars)"
                        value={newPassword}
                        className="with-toggle"
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="cl-toggle"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  <div className="cl-field">
                    <label htmlFor="confirm-password">Confirm New Password</label>
                    <div className="cl-input">
                      <input
                        id="confirm-password"
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Re-enter your new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-2">
                    <button
                      type="submit"
                      className={'cl-btn' + (status === 'done' ? ' ok' : '')}
                      disabled={status !== 'idle'}
                    >
                      {status === 'idle' && 'Save New Password & Sign In'}
                      {status === 'loading' && 'Saving & Signing in…'}
                      {status === 'done' && 'Password Saved! Entering workspace…'}
                    </button>
                    <button
                      type="button"
                      className="py-2 text-xs text-slate-500 hover:text-slate-800 font-medium"
                      onClick={() => setFirstLoginTarget(null)}
                    >
                      Cancel & Return to Sign In
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  {isPayrollPortalMode ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                      Payroll & ESS Portal
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      CRM Enterprise
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleCopyPortalLink}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                    title="Copy direct Payroll Login Link"
                  >
                    {linkCopiedToast ? '✓ Link Copied!' : '🔗 Copy Payroll Login Link'}
                  </button>
                </div>

                <h1 className="cl-h">
                  {isPayrollPortalMode ? 'Sign in to Payroll & ESS' : `Sign in to ${companyName}`}
                </h1>
                <p className="cl-sub">
                  {isPayrollPortalMode
                    ? 'Employee Self-Service (ESS) & Payroll Portal. Enter your work email & password to access payslips, leaves, attendance & tax.'
                    : 'Welcome back. Enter your credentials to access your workspace.'}
                </p>

                {infoNotice && (
                  <div className="cl-alert-info">
                    {infoNotice}
                  </div>
                )}

                <form onSubmit={submit} noValidate>
                  <div className="cl-field">
                    <label htmlFor="email">Work email</label>
                    <div className="cl-input">
                      <input
                        id="email"
                        type="text"
                        autoComplete="username"
                        placeholder="name@company.com"
                        value={email}
                        aria-invalid={!!errors.email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          reach();
                        }}
                      />
                    </div>
                    {errors.email && (
                      <p className="cl-err" role="alert">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="cl-field">
                    <label htmlFor="password">Password</label>
                    <div className="cl-input">
                      <input
                        id="password"
                        type={show ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder={
                          isPayrollPortalMode
                            ? 'Enter initial or saved password'
                            : 'Enter your password'
                        }
                        value={password}
                        aria-invalid={!!errors.password}
                        className="with-toggle"
                        onChange={(e) => {
                          setPassword(e.target.value);
                          reach();
                        }}
                      />
                      <button
                        type="button"
                        className="cl-toggle"
                        onClick={() => setShow(!show)}
                        aria-label={show ? 'Hide password' : 'Show password'}
                      >
                        {show ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="cl-err" role="alert">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div className="cl-row">
                    <label className="cl-check">
                      <input
                        type="checkbox"
                        className="cl-native-check"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                      />
                      <span className="cl-custom-box">
                        {remember && (
                          <svg width="11" height="9" viewBox="0 0 11 9" fill="none" aria-hidden="true">
                            <path
                              d="M1.5 4.5L4.2 7.2L9.5 1.8"
                              stroke="#ffffff"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span className="cl-check-text">Keep me signed in on this device</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className={'cl-btn' + (status === 'done' ? ' ok' : '')}
                    disabled={status !== 'idle'}
                  >
                    {status === 'idle' && (isPayrollPortalMode ? 'Sign in to Payroll Portal' : 'Sign in')}
                    {status === 'loading' && 'Signing in…'}
                    {status === 'done' && 'Signed in. Opening your workspace'}
                  </button>
                </form>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex flex-col gap-2 text-center">
                  <button
                    type="button"
                    onClick={handleSwitchToPayrollPage}
                    className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline py-1 cursor-pointer"
                  >
                    → Open Separate Employee Payroll &amp; ESS Login Page
                  </button>

                  <p className="cl-foot !m-0">
                    Don't have credentials?{' '}
                    <button
                      type="button"
                      className="cl-link"
                      onClick={() =>
                        setInfoNotice(
                          isPayrollPortalMode
                            ? 'Your HR or Payroll Administrator can generate your employee credentials in Payroll Admin Master.'
                            : 'Access requests can be approved by your team administrator in Masters & Administration.'
                        )
                      }
                    >
                      Request access
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>

        <footer className="cl-legal">
          <span>© {new Date().getFullYear()} {companyName}</span>
          <nav>
            <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy</a>
            <a href="#terms" onClick={(e) => e.preventDefault()}>Terms</a>
            <a href="#status" onClick={(e) => e.preventDefault()}>System status</a>
          </nav>
        </footer>
      </div>
    </div>
  );
};

export default LoginView;
