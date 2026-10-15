import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  FileText,
  KeyRound,
  Shield,
  ChevronRight,
  Sparkles,
  Fingerprint,
  Layers,
  Clock,
  Compass,
} from 'lucide-react';

interface PayrollLoginViewProps {
  onSwitchToCrmLogin?: () => void;
}

function nextPayRun(now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const payday = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const totalDaysInMonth = payday.getDate();
  const currentDay = today.getDate();
  const progressPct = Math.min(100, Math.round((currentDay / totalDaysInMonth) * 100));
  const days = Math.max(0, Math.round((payday.getTime() - today.getTime()) / 86400000));
  const dateFormatted = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(payday);
  const monthName = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(payday);
  return { dateFormatted, days, monthName, progressPct, currentDay, totalDaysInMonth };
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

  const urlLockedIdentity = useMemo(() => {
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

  // Self-service password change mode
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetForm, setResetForm] = useState({
    identifier: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Artistic Generative Guilloché Canvas (Kinetic Mathematical Spirograph)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0;
    let h = 0;
    let raf: number;
    let time = 0;

    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

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
      mouse.targetX = (e.clientX / (window.innerWidth || 1) - 0.5) * 40;
      mouse.targetY = (e.clientY / (window.innerHeight || 1) - 0.5) * 40;
    };
    window.addEventListener('mousemove', onMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, w, h);

      // Smooth mouse easing
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      // Dynamic center: on larger viewports anchor on left side, on mobile centered
      const cx = (w >= 1024 ? w * 0.32 : w * 0.5) + mouse.x;
      const cy = h * 0.5 + mouse.y;

      const baseRadius = Math.max(140, Math.min(w * 0.28, h * 0.38, 380));

      // 1. Soft atmospheric light gradient
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 1.8);
      glow.addColorStop(0, 'rgba(14, 165, 233, 0.09)');
      glow.addColorStop(0.35, 'rgba(99, 102, 241, 0.05)');
      glow.addColorStop(0.7, 'rgba(217, 70, 239, 0.02)');
      glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // 2. Artistic Parametric Guilloché Rings (Harmonic mathematical wave rings)
      ctx.save();
      const ringCount = 5;
      const harmonics = [
        { n: 7, d: 4, speed: 0.0008, color: 'rgba(2, 132, 199, 0.24)', width: 1.1 },
        { n: 9, d: 5, speed: -0.0006, color: 'rgba(37, 99, 235, 0.28)', width: 1.2 },
        { n: 11, d: 6, speed: 0.0005, color: 'rgba(99, 102, 241, 0.22)', width: 1.0 },
        { n: 8, d: 3, speed: -0.0009, color: 'rgba(124, 58, 237, 0.18)', width: 0.9 },
        { n: 13, d: 7, speed: 0.0004, color: 'rgba(14, 165, 233, 0.16)', width: 0.8 },
      ];

      for (let r = 0; r < ringCount; r++) {
        const cfg = harmonics[r];
        const rad = baseRadius * (0.55 + r * 0.11);
        const rot = time * cfg.speed;

        ctx.beginPath();
        ctx.strokeStyle = cfg.color;
        ctx.lineWidth = cfg.width;

        const steps = 180;
        for (let i = 0; i <= steps; i++) {
          const theta = (i / steps) * Math.PI * 2;
          const k = cfg.n / cfg.d;
          const wave = Math.sin(theta * k + rot * 4) * (rad * 0.06);
          const currentRad = rad + wave;
          const px = cx + Math.cos(theta + rot) * currentRad;
          const py = cy + Math.sin(theta + rot) * currentRad;

          if (i === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.closePath();
        ctx.stroke();
      }

      // 3. Precision Concentric Calibration Marks (Fine Tick Marks of a Master Chronometer)
      ctx.lineWidth = 1;
      const tickRadius = baseRadius * 1.04;
      const tickCount = 60;
      for (let i = 0; i < tickCount; i++) {
        const theta = (i / tickCount) * Math.PI * 2 + time * 0.0002;
        const isMajor = i % 5 === 0;
        const len = isMajor ? 9 : 4;
        const x1 = cx + Math.cos(theta) * tickRadius;
        const y1 = cy + Math.sin(theta) * tickRadius;
        const x2 = cx + Math.cos(theta) * (tickRadius - len);
        const y2 = cy + Math.sin(theta) * (tickRadius - len);

        ctx.strokeStyle = isMajor ? 'rgba(37, 99, 235, 0.45)' : 'rgba(148, 163, 184, 0.25)';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // 4. Center Harmonic Core
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 0.16);
      coreGrad.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
      coreGrad.addColorStop(0.6, 'rgba(37, 99, 235, 0.12)');
      coreGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 0.16, 0, Math.PI * 2);
      ctx.fill();

      // Precision crosshairs
      ctx.strokeStyle = 'rgba(2, 132, 199, 0.22)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(cx - 24, cy);
      ctx.lineTo(cx + 24, cy);
      ctx.moveTo(cx, cy - 24);
      ctx.lineTo(cx, cy + 24);
      ctx.stroke();

      ctx.restore();

      if (!reduceMotion) {
        time += 1;
        raf = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  const { dateFormatted, days, monthName, progressPct, currentDay, totalDaysInMonth } = nextPayRun();
  const countdownText = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days} days`;

  const validate = ({ empId, password }: { empId: string; password: string }) => {
    const nextErrors = { empId: '', password: '' };
    if (!empId.trim()) {
      nextErrors.empId = 'Enter your employee code or work email.';
    }
    if (!password) {
      nextErrors.password = 'Enter your account password.';
    } else if (password === 'password123') {
      nextErrors.password = 'Default password "password123" is disabled. Please enter your secure password.';
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
          text: `Access Restricted: This ESS portal link is assigned exclusively to ${
            urlLockedIdentity.email || urlLockedIdentity.empCode
          }. Please sign in with the assigned account.`,
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
            message: 'Invalid credentials. Check your employee code or password and try again.',
          };

      if (!res.success) {
        setAttempt((n) => n + 1);
        setStatus({
          text: res.message || 'Invalid credentials. Check your employee code or password.',
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
        text: 'Credentials verified. Redirecting to your ESS portal…',
        ok: true,
      });
    } catch (err: any) {
      setAttempt((n) => n + 1);
      setStatus({
        text: err?.message || 'Sign in failed. Check your network connection.',
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
        text: 'Enter your current password set by HR Admin.',
        ok: false,
      });
      return;
    }
    if (nextPass.length < 4) {
      setStatus({ text: 'New password must be at least 4 characters.', ok: false });
      return;
    }
    if (nextPass !== confirmPass) {
      setStatus({ text: 'New password and confirmation do not match.', ok: false });
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
          text: data?.message || 'Current password is incorrect. Contact your HR administrator.',
          ok: false,
        });
        return;
      }
    } catch {
      setStatus({
        text: 'Could not connect to the authentication server. Please try again.',
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
        text: 'Password updated successfully! Sign in with your new password.',
        ok: true,
      });
    } else {
      setValues({ empId: idTrim, password: nextPass });
      setIsResetMode(false);
      setStatus({
        text: 'Password updated successfully! Sign in with your new password.',
        ok: true,
      });
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#fbfcfd] text-slate-900 flex flex-col justify-between overflow-x-hidden select-none font-sans">
      {/* Background Generative Guilloché Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none z-0"
        aria-hidden="true"
      />

      {/* Top Header - Clean Architectural Bar */}
      <header className="relative z-10 w-full border-b border-slate-200/70 bg-white/70 backdrop-blur-md px-4 sm:px-8 lg:px-14 xl:px-18 py-3.5">
        <div className="w-full flex items-center justify-between gap-4">
          
          {/* Brand Wordmark */}
          <div className="flex items-center gap-3">
            <img
              src="/paychakra-logo.svg"
              alt="PayChakra Logo"
              className="h-8 sm:h-9 w-auto max-w-[200px] object-contain drop-shadow-xs"
            />
            <div className="hidden md:flex items-center gap-2 pl-3.5 border-l border-slate-200 text-xs font-medium text-slate-500">
              <span className="font-semibold text-slate-800">PayChakra</span>
              <span className="text-slate-300">/</span>
              <span>Unified ESS Cloud</span>
            </div>
          </div>

          {/* Right Top Actions */}
          <div className="flex items-center gap-3">
            {onSwitchToCrmLogin && !urlLockedIdentity.isLockedLink && (
              <button
                type="button"
                onClick={onSwitchToCrmLogin}
                className="group inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600 transition-colors" />
                <span className="hidden xs:inline">CRM System</span>
                <span className="xs:hidden">CRM</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100/80 border border-slate-200/60 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>AY 2026-27 Compliant</span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Full-Width Content Stage */}
      <main className="relative z-10 flex-1 w-full px-4 sm:px-8 lg:px-14 xl:px-18 py-8 sm:py-12 lg:py-16 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-20 items-center">
          
          {/* Left Column: Artistic Typography, Cycle Meter & Domain Highlights */}
          <div className="lg:col-span-7 xl:col-span-7 flex flex-col gap-8 w-full">
            
            {/* Minimal Sub-kicker */}
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-sky-800 uppercase">
              <span className="w-6 h-[1.5px] bg-sky-600" />
              <span>Harmonic Precision in Motion</span>
            </div>

            {/* Editorial Headline */}
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-5xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.07]">
                Every salary cycle,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600">
                  mathematically punctual.
                </span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl font-normal leading-relaxed">
                A clean, effortless Employee Self-Service ecosystem. One touchpoint for instant payslip retrieval, Form 16 issuance, biometric attendance reconciliation, and verified statutory filings.
              </p>
            </div>

            {/* Artistic Precision Cycle Card */}
            <div className="w-full bg-white/85 border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm backdrop-blur-md">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  {/* Circular Progress Gauge */}
                  <div className="relative w-11 h-11 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-100"
                        strokeWidth="3.2"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-blue-600 transition-all duration-1000 ease-out"
                        strokeDasharray={`${progressPct}, 100`}
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute font-mono text-[11px] font-bold text-slate-800 tabular-nums">
                      {progressPct}%
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Payroll Cadence</span>
                    <p className="text-sm sm:text-base font-bold text-slate-900">{monthName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-sky-50 border border-sky-200 rounded-lg text-xs font-semibold text-sky-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                    <span>Disbursal: <strong>{countdownText}</strong></span>
                  </div>
                  <div className="hidden sm:flex px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>EPF / ESIC Aligned</span>
                  </div>
                </div>
              </div>

              {/* Minimalist Data Readouts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Settlement</span>
                  <span className="font-mono text-sm sm:text-base font-bold text-slate-900 tabular-nums">{dateFormatted}</span>
                </div>
                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Statutory</span>
                  <span className="text-sm sm:text-base font-bold text-slate-900">PF · ESI · TDS</span>
                </div>
                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">TDS Regimes</span>
                  <span className="text-sm sm:text-base font-bold text-slate-900">New & Old Tax</span>
                </div>
                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Protocol</span>
                  <span className="text-sm sm:text-base font-bold text-emerald-700 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-emerald-600" /> Direct NEFT
                  </span>
                </div>
              </div>
            </div>

            {/* 3 Clean Minimal Feature Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
              <div className="p-4 bg-white/70 border border-slate-200/80 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center mb-2.5">
                  <FileText className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-900">1-Click Payslips</h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Cryptographically verified PDFs of salary statements and Form 16.
                </p>
              </div>

              <div className="p-4 bg-white/70 border border-slate-200/80 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center mb-2.5">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-900">Attendance Sync</h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Live biometric integration, automated overtime, and leave quotas.
                </p>
              </div>

              <div className="p-4 bg-white/70 border border-slate-200/80 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mb-2.5">
                  <Layers className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-900">Statutory Proof</h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Pre-configured EPFO and ESIC filing ledgers with zero manual error.
                </p>
              </div>
            </div>

            {/* Operating Entity Trust Bar */}
            {supplierCompany?.name && (
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <Compass className="w-3.5 h-3.5 text-slate-400" />
                <span>Operating for: <strong className="font-semibold text-slate-700">{supplierCompany.name}</strong></span>
                {supplierCompany.state && <span>· {supplierCompany.state}</span>}
              </div>
            )}
          </div>

          {/* Right Column: Clean Minimalist Authentication Card */}
          <div className="lg:col-span-5 xl:col-span-5 w-full max-w-lg lg:max-w-none xl:max-w-xl mx-auto lg:ml-auto">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 shadow-[0_24px_64px_-12px_rgba(15,23,42,0.08)] p-6 sm:p-8 xl:p-10 relative overflow-hidden transition-all">
              
              {/* Subtle Hairline Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600" />

              {/* Minimal Portal Mode Switcher */}
              {onSwitchToCrmLogin && !urlLockedIdentity.isLockedLink && (
                <div className="flex items-center gap-1 p-1 bg-slate-100/90 border border-slate-200/70 rounded-xl mb-6">
                  <button
                    type="button"
                    onClick={onSwitchToCrmLogin}
                    className="flex-1 py-1.5 px-3 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-lg transition-all text-center cursor-pointer"
                  >
                    Enterprise CRM
                  </button>
                  <button
                    type="button"
                    className="flex-1 py-1.5 px-3 text-xs font-bold text-blue-900 bg-white shadow-2xs border border-slate-200/80 rounded-lg text-center"
                  >
                    Payroll Portal
                  </button>
                </div>
              )}

              {/* Locked Employee Notice */}
              {urlLockedIdentity.isLockedLink && (
                <div className="mb-5 p-3.5 bg-sky-50 border border-sky-200 rounded-xl flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-sky-900">Assigned Employee Profile</p>
                    <p className="text-sky-700 mt-0.5 font-mono text-[11px]">
                      {urlLockedIdentity.email || urlLockedIdentity.empCode}
                    </p>
                  </div>
                </div>
              )}

              {!isResetMode ? (
                <>
                  <div className="mb-6">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 uppercase tracking-wider mb-1">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Employee Self-Service (ESS)</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      Sign in to Payroll
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      {users.length === 0
                        ? 'No employee profiles registered yet. Switch to CRM to initialize Super Admin.'
                        : 'Access your payslips, tax deductions, and leave balances.'}
                    </p>
                  </div>

                  {/* Empty Workspace Banner */}
                  {users.length === 0 && (
                    <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                      <div className="font-bold flex items-center gap-1.5 mb-1">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Workspace Initializing</span>
                      </div>
                      <p className="text-amber-800 leading-relaxed">
                        No employees currently enrolled. Use the Enterprise CRM tab above to sign in as Super Admin.
                      </p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} noValidate className="space-y-4">
                    {/* Identifier Field */}
                    <div>
                      <label htmlFor="empid" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                        Employee Code or Work Email
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <input
                          key={`id-${attempt}`}
                          id="empid"
                          name="empid"
                          type="text"
                          autoComplete="username"
                          placeholder="e.g. EMP-101 or name@coreenact.com"
                          value={values.empId}
                          readOnly={urlLockedIdentity.isLockedLink}
                          onChange={(e) => {
                            setValues((v) => ({ ...v, empId: e.target.value }));
                            if (errors.empId) setErrors((err) => ({ ...err, empId: '' }));
                          }}
                          className={`w-full pl-10 pr-3.5 py-3 text-sm font-medium rounded-xl border bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none transition-all ${
                            errors.empId
                              ? 'border-red-400 focus:ring-2 focus:ring-red-200 bg-red-50/20'
                              : 'border-slate-300 focus:border-blue-600 focus:ring-3 focus:ring-blue-100'
                          }`}
                          aria-invalid={Boolean(errors.empId)}
                          aria-describedby="e-id"
                        />
                      </div>
                      {errors.empId && (
                        <p className="text-xs font-semibold text-red-600 mt-1.5 flex items-center gap-1" id="e-id" role="alert">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{errors.empId}</span>
                        </p>
                      )}
                    </div>

                    {/* Password Field */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="pw" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Password
                        </label>
                        <button
                          type="button"
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
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                        >
                          Change password?
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          key={`pw-${attempt}`}
                          id="pw"
                          name="pw"
                          type={showPw ? 'text' : 'password'}
                          autoComplete="current-password"
                          placeholder="••••••••••••"
                          value={values.password}
                          onChange={(e) => {
                            setValues((v) => ({ ...v, password: e.target.value }));
                            if (errors.password) setErrors((err) => ({ ...err, password: '' }));
                          }}
                          className={`w-full pl-10 pr-12 py-3 text-sm font-medium rounded-xl border bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none transition-all ${
                            errors.password
                              ? 'border-red-400 focus:ring-2 focus:ring-red-200 bg-red-50/20'
                              : 'border-slate-300 focus:border-blue-600 focus:ring-3 focus:ring-blue-100'
                          }`}
                          aria-invalid={Boolean(errors.password)}
                          aria-describedby="e-pw"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw((s) => !s)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                          aria-label={showPw ? 'Hide password' : 'Show password'}
                        >
                          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-xs font-semibold text-red-600 mt-1.5 flex items-center gap-1" id="e-pw" role="alert">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{errors.password}</span>
                        </p>
                      )}
                    </div>

                    {/* Remember me toggle */}
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={keep}
                          onChange={(e) => setKeep(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-xs font-medium text-slate-700">Remember this device</span>
                      </label>
                      <span className="text-[11px] text-slate-400">8-hour session</span>
                    </div>

                    {/* Primary Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.99] shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-wait"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          <span>Authenticating…</span>
                        </>
                      ) : (
                        <>
                          <span>Open ESS Portal</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    {/* Status Feedback Banner */}
                    {status.text && (
                      <div
                        className={`p-3 rounded-xl text-xs font-semibold flex items-start gap-2 ${
                          status.ok
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                        }`}
                        role="status"
                        aria-live="polite"
                      >
                        {status.ok ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        )}
                        <span className="leading-snug">{status.text}</span>
                      </div>
                    )}
                  </form>
                </>
              ) : (
                /* Self-Service Password Reset View */
                <>
                  <div className="mb-5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetMode(false);
                        setStatus({ text: '', ok: false });
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-3 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to sign in</span>
                    </button>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Change password</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Verify your current password assigned by your HR Admin to establish a new password.
                    </p>
                  </div>

                  <form onSubmit={handleResetSubmit} noValidate className="space-y-3.5">
                    <div>
                      <label htmlFor="reset-id" className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                        Employee Code or Work Email
                      </label>
                      <input
                        id="reset-id"
                        type="text"
                        placeholder="EMP-101 or name@coreenact.com"
                        value={resetForm.identifier}
                        readOnly={urlLockedIdentity.isLockedLink}
                        onChange={(e) => setResetForm((prev) => ({ ...prev, identifier: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-sm font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <label htmlFor="reset-curr-pw" className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                        Current Password
                      </label>
                      <input
                        id="reset-curr-pw"
                        type={showPw ? 'text' : 'password'}
                        placeholder="Password set by Admin"
                        value={resetForm.currentPassword}
                        onChange={(e) => setResetForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-sm font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <label htmlFor="reset-pw" className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                        New Password (Min 4 chars)
                      </label>
                      <div className="relative">
                        <input
                          id="reset-pw"
                          type={showPw ? 'text' : 'password'}
                          placeholder="Enter new password"
                          value={resetForm.newPassword}
                          onChange={(e) => setResetForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full px-3.5 pr-10 py-2.5 text-sm font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw((s) => !s)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="reset-confirm" className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                        Confirm New Password
                      </label>
                      <input
                        id="reset-confirm"
                        type={showPw ? 'text' : 'password'}
                        placeholder="Re-enter new password"
                        value={resetForm.confirmPassword}
                        onChange={(e) => setResetForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-sm font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Update Password & Return
                    </button>

                    {status.text && (
                      <div
                        className={`p-3 rounded-xl text-xs font-semibold flex items-start gap-2 ${
                          status.ok
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                        }`}
                        role="status"
                      >
                        {status.ok ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        )}
                        <span>{status.text}</span>
                      </div>
                    )}
                  </form>
                </>
              )}

              {/* Security & Assistance Footnote */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                  <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>256-bit AES Zero-Trust Encryption</span>
                </span>
                <span>HR Helpdesk</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer - Clean Architectural Baseline */}
      <footer className="relative z-10 w-full border-t border-slate-200/70 bg-white/70 backdrop-blur-md px-4 sm:px-8 lg:px-14 xl:px-18 py-3.5 text-xs text-slate-400">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
          <p>© {new Date().getFullYear()} PayChakra by Coreenact Solutions. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs font-medium text-slate-500">
            <span>Statutory Compliant</span>
            <span className="text-slate-300">·</span>
            <span>EPFO / ESIC Aligned</span>
            <span className="text-slate-300">·</span>
            <span>End-to-End Encrypted</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PayrollLoginView;
