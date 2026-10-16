import React, { useMemo, useState } from 'react';
import {
  Briefcase,
  Plus,
  Check,
  X,
  Users,
  GraduationCap,
  Target,
  ClipboardList,
  Star,
  Award,
  Search,
  ChevronRight,
} from 'lucide-react';
import {
  JobOpening,
  Candidate,
  CandidateStage,
  CandidateSource,
  CANDIDATE_STAGES,
  CANDIDATE_SOURCES,
  OnboardingPlan,
  PerformanceReview,
  PerformanceStatus,
  PERFORMANCE_STATUSES,
  TrainingProgram,
  TrainingNomination,
  TrainingNominationStatus,
  TrainingMode,
  TRAINING_MODES,
  TRAINING_NOMINATION_STATUSES,
  newOnboardingTasks,
  newReviewGoals,
  reviewAverage,
} from './payrollTypes';

/**
 * Talent — recruitment, onboarding, performance and training in one section with
 * four sub-modules. Admins manage everything; an employee sees their own onboarding
 * plan, performance reviews and training nominations.
 */
export interface PayrollTalentSectionProps {
  mode: 'admin' | 'employee';
  currentUserId: string;
  currentUserName: string;
  employees: { userId: string; name?: string; empCode?: string; department?: string }[];
  jobOpenings: JobOpening[];
  onChangeJobOpenings: (n: JobOpening[]) => void;
  candidates: Candidate[];
  onChangeCandidates: (n: Candidate[]) => void;
  onboardingPlans: OnboardingPlan[];
  onChangeOnboardingPlans: (n: OnboardingPlan[]) => void;
  performanceReviews: PerformanceReview[];
  onChangePerformanceReviews: (n: PerformanceReview[]) => void;
  trainingPrograms: TrainingProgram[];
  onChangeTrainingPrograms: (n: TrainingProgram[]) => void;
  trainingNominations: TrainingNomination[];
  onChangeTrainingNominations: (n: TrainingNomination[]) => void;
  setStatusBanner?: (m: string) => void;
}

type Tab = 'recruitment' | 'onboarding' | 'performance' | 'training';

const todayIso = () => new Date().toISOString().slice(0, 10);

const stageChip: Record<CandidateStage, string> = {
  Applied: 'sh-badge sh-badge-neutral',
  Screening: 'sh-badge sh-badge-info',
  Interview: 'sh-badge sh-badge-primary',
  Offer: 'sh-badge sh-badge-warning',
  Hired: 'sh-badge sh-badge-success',
  Rejected: 'sh-badge sh-badge-danger',
};

export function PayrollTalentSection({
  mode,
  currentUserId,
  currentUserName,
  employees,
  jobOpenings,
  onChangeJobOpenings,
  candidates,
  onChangeCandidates,
  onboardingPlans,
  onChangeOnboardingPlans,
  performanceReviews,
  onChangePerformanceReviews,
  trainingPrograms,
  onChangeTrainingPrograms,
  trainingNominations,
  onChangeTrainingNominations,
  setStatusBanner,
}: PayrollTalentSectionProps) {
  const [tab, setTab] = useState<Tab>(mode === 'employee' ? 'onboarding' : 'recruitment');
  const [query, setQuery] = useState('');

  // recruitment form state
  const [openTitle, setOpenTitle] = useState('');
  const [openDept, setOpenDept] = useState('');
  const [openCount, setOpenCount] = useState('1');
  const [candOpening, setCandOpening] = useState('');
  const [candName, setCandName] = useState('');
  const [candEmail, setCandEmail] = useState('');
  const [candSource, setCandSource] = useState<CandidateSource>('Portal');
  const [candReferredBy, setCandReferredBy] = useState('');
  // onboarding
  const [onbEmployee, setOnbEmployee] = useState('');
  const [onbDate, setOnbDate] = useState(todayIso());
  // performance
  const [revEmployee, setRevEmployee] = useState('');
  const [revCycle, setRevCycle] = useState('FY 2026-27');
  const [revReviewer, setRevReviewer] = useState('');
  const [openReview, setOpenReview] = useState<string | null>(null);
  const [selfText, setSelfText] = useState('');
  const [mgrText, setMgrText] = useState('');
  // training
  const [trTitle, setTrTitle] = useState('');
  const [trTrainer, setTrTrainer] = useState('');
  const [trStart, setTrStart] = useState(todayIso());
  const [trMode, setTrMode] = useState<TrainingMode>('Classroom');
  const [nomProgram, setNomProgram] = useState('');
  const [nomEmployee, setNomEmployee] = useState('');

  const empName = (id: string) => employees.find((e) => e.userId === id)?.name || id;
  const openTitleOf = (id: string) => jobOpenings.find((o) => o.id === id)?.title || id;

  const myOnboarding = useMemo(() => onboardingPlans.filter((p) => p.employeeId === currentUserId), [onboardingPlans, currentUserId]);
  const myReviews = useMemo(() => performanceReviews.filter((r) => r.employeeId === currentUserId), [performanceReviews, currentUserId]);
  const myNominations = useMemo(() => trainingNominations.filter((n) => n.employeeId === currentUserId), [trainingNominations, currentUserId]);

  const openOpenings = jobOpenings.filter((o) => o.status === 'Open');
  const hiredCount = candidates.filter((c) => c.stage === 'Hired').length;
  const completedReviews = performanceReviews.filter((r) => r.status === 'Completed').length;
  const certified = trainingNominations.filter((n) => n.certificate).length;

  /* ------------------------------------------------------------- recruitment */
  const addOpening = () => {
    if (!openTitle.trim()) { setStatusBanner?.('A job title is required.'); return; }
    const opening: JobOpening = {
      id: `JOB-${Date.now().toString().slice(-5)}`,
      title: openTitle.trim(),
      department: openDept.trim() || undefined,
      openings: Number(openCount) || 1,
      status: 'Open',
      postedAt: todayIso(),
    };
    onChangeJobOpenings([opening, ...jobOpenings]);
    setStatusBanner?.(`Opening "${opening.title}" published.`);
    setOpenTitle(''); setOpenDept(''); setOpenCount('1');
  };

  const addCandidate = () => {
    if (!candOpening || !candName.trim()) { setStatusBanner?.('Choose an opening and enter the candidate name.'); return; }
    const c: Candidate = {
      id: `CND-${Date.now().toString().slice(-5)}`,
      openingId: candOpening,
      name: candName.trim(),
      email: candEmail.trim() || undefined,
      source: candSource,
      stage: 'Applied',
      appliedAt: todayIso(),
      referredBy: candSource === 'Referral' ? candReferredBy.trim() || undefined : undefined,
    };
    onChangeCandidates([c, ...candidates]);
    setStatusBanner?.(`Candidate ${c.name} added to ${openTitleOf(candOpening)}.`);
    setCandName(''); setCandEmail(''); setCandReferredBy('');
  };

  const moveStage = (c: Candidate, stage: CandidateStage) => {
    onChangeCandidates(candidates.map((x) => (x.id === c.id ? { ...x, stage } : x)));
    setStatusBanner?.(`${c.name} → ${stage}.`);
  };

  /* -------------------------------------------------------------- onboarding */
  const createPlan = () => {
    if (!onbEmployee) { setStatusBanner?.('Choose an employee to onboard.'); return; }
    if (onboardingPlans.some((p) => p.employeeId === onbEmployee && p.status === 'In Progress')) {
      setStatusBanner?.('That employee already has an onboarding plan in progress.');
      return;
    }
    const plan: OnboardingPlan = {
      id: `ONB-${Date.now().toString().slice(-5)}`,
      employeeId: onbEmployee,
      employeeName: empName(onbEmployee),
      joiningDate: onbDate,
      status: 'In Progress',
      tasks: newOnboardingTasks(),
    };
    onChangeOnboardingPlans([plan, ...onboardingPlans]);
    setStatusBanner?.(`Onboarding plan created for ${plan.employeeName}.`);
  };

  const toggleTask = (planId: string, taskId: string) => {
    onChangeOnboardingPlans(
      onboardingPlans.map((p) => {
        if (p.id !== planId) return p;
        const tasks = p.tasks.map((t) =>
          t.id === taskId ? { ...t, done: !t.done, doneAt: !t.done ? new Date().toISOString() : undefined } : t
        );
        const allDone = tasks.every((t) => t.done);
        return { ...p, tasks, status: allDone ? 'Completed' : 'In Progress' };
      })
    );
  };

  /* ------------------------------------------------------------- performance */
  const createReview = () => {
    if (!revEmployee || !revCycle.trim()) { setStatusBanner?.('Choose an employee and a review cycle.'); return; }
    const review: PerformanceReview = {
      id: `PR-${Date.now().toString().slice(-5)}`,
      employeeId: revEmployee,
      employeeName: empName(revEmployee),
      cycle: revCycle.trim(),
      reviewerName: revReviewer.trim() || undefined,
      goals: newReviewGoals(),
      status: 'Self Assessment',
    };
    onChangePerformanceReviews([review, ...performanceReviews]);
    setStatusBanner?.(`Review opened for ${review.employeeName} (${review.cycle}).`);
  };

  const rateGoal = (reviewId: string, goalId: string, field: 'selfRating' | 'managerRating', value: number) => {
    onChangePerformanceReviews(
      performanceReviews.map((r) =>
        r.id === reviewId
          ? { ...r, goals: r.goals.map((g) => (g.id === goalId ? { ...g, [field]: value } : g)) }
          : r
      )
    );
  };

  const saveSelf = (review: PerformanceReview) => {
    onChangePerformanceReviews(
      performanceReviews.map((r) => (r.id === review.id ? { ...r, selfComments: selfText, status: 'Manager Review' } : r))
    );
    setStatusBanner?.('Self assessment submitted.');
    setSelfText('');
    setOpenReview(null);
  };

  const saveManager = (review: PerformanceReview) => {
    const avg = reviewAverage(review);
    onChangePerformanceReviews(
      performanceReviews.map((r) =>
        r.id === review.id ? { ...r, managerComments: mgrText, overallRating: avg ?? undefined, status: 'Completed' } : r
      )
    );
    setStatusBanner?.(`Review completed${avg ? ` — overall ${avg}/5` : ''}.`);
    setMgrText('');
    setOpenReview(null);
  };

  /* ---------------------------------------------------------------- training */
  const addProgram = () => {
    if (!trTitle.trim()) { setStatusBanner?.('A training title is required.'); return; }
    const program: TrainingProgram = {
      id: `TRN-${Date.now().toString().slice(-5)}`,
      title: trTitle.trim(),
      trainer: trTrainer.trim() || undefined,
      startDate: trStart,
      mode: trMode,
      status: 'Planned',
    };
    onChangeTrainingPrograms([program, ...trainingPrograms]);
    setStatusBanner?.(`Training "${program.title}" added to the calendar.`);
    setTrTitle(''); setTrTrainer('');
  };

  const nominate = () => {
    if (!nomProgram || !nomEmployee) { setStatusBanner?.('Choose a program and an employee.'); return; }
    if (trainingNominations.some((n) => n.programId === nomProgram && n.employeeId === nomEmployee)) {
      setStatusBanner?.('That employee is already nominated for this program.');
      return;
    }
    const n: TrainingNomination = {
      id: `NOM-${Date.now().toString().slice(-5)}`,
      programId: nomProgram,
      employeeId: nomEmployee,
      employeeName: empName(nomEmployee),
      status: 'Nominated',
    };
    onChangeTrainingNominations([n, ...trainingNominations]);
    setStatusBanner?.(`${n.employeeName} nominated for ${trainingPrograms.find((p) => p.id === nomProgram)?.title}.`);
  };

  const setNominationStatus = (id: string, status: TrainingNominationStatus, certificate?: boolean) => {
    onChangeTrainingNominations(
      trainingNominations.map((n) =>
        n.id === id
          ? { ...n, status, certificate: certificate ?? n.certificate, completionDate: status === 'Completed' ? todayIso() : n.completionDate }
          : n
      )
    );
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = mode === 'employee'
    ? [
        { id: 'onboarding', label: 'My Onboarding', icon: <ClipboardList className="w-3.5 h-3.5" /> },
        { id: 'performance', label: 'My Performance', icon: <Target className="w-3.5 h-3.5" /> },
        { id: 'training', label: 'My Training', icon: <GraduationCap className="w-3.5 h-3.5" /> },
      ]
    : [
        { id: 'recruitment', label: 'Recruitment', icon: <Briefcase className="w-3.5 h-3.5" /> },
        { id: 'onboarding', label: 'Onboarding', icon: <ClipboardList className="w-3.5 h-3.5" /> },
        { id: 'performance', label: 'Performance', icon: <Target className="w-3.5 h-3.5" /> },
        { id: 'training', label: 'Training', icon: <GraduationCap className="w-3.5 h-3.5" /> },
      ];

  return (
    <div className="space-y-4">
      <div className="sh-card">
        <div className="sh-card-header">
          <div className="flex items-center gap-2.5">
            <span className="icon-depth w-9 h-9"><Users className="w-4.5 h-4.5" /></span>
            <div>
              <h3 className="sh-card-title">{mode === 'employee' ? 'My talent & development' : 'Talent management'}</h3>
              <p className="text-[11.5px] text-slate-500">
                {mode === 'employee'
                  ? 'Your onboarding plan, performance reviews and training nominations.'
                  : 'Recruitment, onboarding, performance reviews and training in one place.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {mode === 'admin' && <span className="sh-badge sh-badge-info">{openOpenings.length} open roles</span>}
            {mode === 'admin' && <span className="sh-badge sh-badge-success">{hiredCount} hired</span>}
            {mode === 'admin' && <span className="sh-badge sh-badge-neutral">{completedReviews} reviews done</span>}
            {mode === 'admin' && <span className="sh-badge sh-badge-warning">{certified} certified</span>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 px-4 py-3 border-b border-slate-100">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`sh-btn ${tab === t.id ? 'sh-btn-soft' : ''}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ------------------------------------------------------ RECRUITMENT */}
        {tab === 'recruitment' && mode === 'admin' && (
          <div className="sh-card-body space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <input className="sh-input max-w-[220px]" placeholder="Job title" value={openTitle} onChange={(e) => setOpenTitle(e.target.value)} />
              <input className="sh-input max-w-[160px]" placeholder="Department" value={openDept} onChange={(e) => setOpenDept(e.target.value)} />
              <input type="number" className="sh-input max-w-[100px]" placeholder="Seats" value={openCount} onChange={(e) => setOpenCount(e.target.value)} />
              <button type="button" className="sh-btn sh-btn-primary" onClick={addOpening}><Plus className="w-3.5 h-3.5" /> Publish opening</button>
            </div>

            <div className="overflow-x-auto">
              <table className="sh-table w-full">
                <thead><tr><th>Opening</th><th>Department</th><th>Seats</th><th>Posted</th><th>Status</th><th>Pipeline</th><th className="text-right">Action</th></tr></thead>
                <tbody>
                  {jobOpenings.map((o) => (
                    <tr key={o.id}>
                      <td className="font-semibold text-slate-800">{o.title}<div className="text-[11px] text-slate-500">{o.id}</div></td>
                      <td>{o.department || '—'}</td>
                      <td>{o.openings}</td>
                      <td>{o.postedAt}</td>
                      <td><span className={`sh-badge ${o.status === 'Open' ? 'sh-badge-success' : o.status === 'On Hold' ? 'sh-badge-warning' : 'sh-badge-neutral'}`}>{o.status}</span></td>
                      <td className="text-[12px]">{candidates.filter((c) => c.openingId === o.id).length} candidates</td>
                      <td className="text-right">
                        {o.status === 'Open' && (
                          <button type="button" className="sh-btn" onClick={() => { onChangeJobOpenings(jobOpenings.map((x) => (x.id === o.id ? { ...x, status: 'Closed' } : x))); setStatusBanner?.(`${o.title} closed.`); }}>
                            <X className="w-3.5 h-3.5" /> Close
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {jobOpenings.length === 0 && <tr><td colSpan={7} className="text-center py-6 text-slate-400">No openings yet.</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="text-[12px] font-bold text-slate-700 mb-2">Candidates</div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <select className="sh-input max-w-[190px]" value={candOpening} onChange={(e) => setCandOpening(e.target.value)}>
                  <option value="">Opening…</option>
                  {jobOpenings.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
                </select>
                <input className="sh-input max-w-[180px]" placeholder="Candidate name" value={candName} onChange={(e) => setCandName(e.target.value)} />
                <input className="sh-input max-w-[200px]" placeholder="Email" value={candEmail} onChange={(e) => setCandEmail(e.target.value)} />
                <select className="sh-input max-w-[140px]" value={candSource} onChange={(e) => setCandSource(e.target.value as CandidateSource)}>
                  {CANDIDATE_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {candSource === 'Referral' && (
                  <input className="sh-input max-w-[170px]" placeholder="Referred by" value={candReferredBy} onChange={(e) => setCandReferredBy(e.target.value)} />
                )}
                <button type="button" className="sh-btn sh-btn-primary" onClick={addCandidate}><Plus className="w-3.5 h-3.5" /> Add candidate</button>
              </div>
              <div className="overflow-x-auto">
                <table className="sh-table w-full">
                  <thead><tr><th>Candidate</th><th>Opening</th><th>Source</th><th>Stage</th><th>Applied</th><th className="text-right">Move to</th></tr></thead>
                  <tbody>
                    {candidates.map((c) => (
                      <tr key={c.id}>
                        <td className="font-semibold text-slate-800">{c.name}<div className="text-[11px] text-slate-500">{c.email || c.id}</div></td>
                        <td>{openTitleOf(c.openingId)}</td>
                        <td>{c.source}{c.referredBy ? ` · ${c.referredBy}` : ''}</td>
                        <td><span className={stageChip[c.stage]}>{c.stage}</span></td>
                        <td>{c.appliedAt}</td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {CANDIDATE_STAGES.filter((s) => s !== c.stage).map((s) => (
                              <button key={s} type="button" className="sh-btn !px-2 !py-1 !text-[10.5px]" onClick={() => moveStage(c, s)}>{s}</button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {candidates.length === 0 && <tr><td colSpan={6} className="text-center py-6 text-slate-400">No candidates yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------- ONBOARDING */}
        {tab === 'onboarding' && (
          <div className="sh-card-body space-y-4">
            {mode === 'admin' && (
              <div className="flex flex-wrap items-center gap-2">
                <select className="sh-input max-w-[220px]" value={onbEmployee} onChange={(e) => setOnbEmployee(e.target.value)}>
                  <option value="">Employee…</option>
                  {employees.map((e) => <option key={e.userId} value={e.userId}>{e.name || e.userId}</option>)}
                </select>
                <input type="date" className="sh-input max-w-[160px]" value={onbDate} onChange={(e) => setOnbDate(e.target.value)} />
                <button type="button" className="sh-btn sh-btn-primary" onClick={createPlan}><Plus className="w-3.5 h-3.5" /> Create onboarding plan</button>
              </div>
            )}
            <div className="space-y-3">
              {(mode === 'employee' ? myOnboarding : onboardingPlans).map((p) => {
                const done = p.tasks.filter((t) => t.done).length;
                const pct = Math.round((done / Math.max(p.tasks.length, 1)) * 100);
                return (
                  <div key={p.id} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div>
                        <div className="font-semibold text-slate-800 text-[13px]">{p.employeeName || empName(p.employeeId)}</div>
                        <div className="text-[11px] text-slate-500">Joining {p.joiningDate} · {done}/{p.tasks.length} done</div>
                      </div>
                      <span className={`sh-badge ${p.status === 'Completed' ? 'sh-badge-success' : 'sh-badge-warning'}`}>{p.status}</span>
                    </div>
                    <div className="sh-progress mb-3"><span style={{ width: `${pct}%` }} /></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {p.tasks.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => toggleTask(p.id, t.id)}
                          className="flex items-center gap-2 text-left text-[12px] text-slate-700 hover:text-slate-900"
                        >
                          <span className={`w-4 h-4 rounded-[4px] flex items-center justify-center shrink-0 ${t.done ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-transparent'}`}>
                            <Check className="w-3 h-3" />
                          </span>
                          <span className={t.done ? 'line-through text-slate-400' : ''}>{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              {(mode === 'employee' ? myOnboarding : onboardingPlans).length === 0 && (
                <div className="text-center py-6 text-slate-400 text-sm">
                  {mode === 'employee' ? 'No onboarding plan for you.' : 'No onboarding plans yet.'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------ PERFORMANCE */}
        {tab === 'performance' && (
          <div className="sh-card-body space-y-4">
            {mode === 'admin' && (
              <div className="flex flex-wrap items-center gap-2">
                <select className="sh-input max-w-[200px]" value={revEmployee} onChange={(e) => setRevEmployee(e.target.value)}>
                  <option value="">Employee…</option>
                  {employees.map((e) => <option key={e.userId} value={e.userId}>{e.name || e.userId}</option>)}
                </select>
                <input className="sh-input max-w-[150px]" placeholder="Cycle" value={revCycle} onChange={(e) => setRevCycle(e.target.value)} />
                <input className="sh-input max-w-[180px]" placeholder="Reviewer" value={revReviewer} onChange={(e) => setRevReviewer(e.target.value)} />
                <button type="button" className="sh-btn sh-btn-primary" onClick={createReview}><Plus className="w-3.5 h-3.5" /> Open review</button>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="sh-table w-full">
                <thead><tr><th>Employee</th><th>Cycle</th><th>Reviewer</th><th>Rating</th><th>Status</th><th className="text-right">Action</th></tr></thead>
                <tbody>
                  {(mode === 'employee' ? myReviews : performanceReviews).map((r) => (
                    <React.Fragment key={r.id}>
                      <tr>
                        <td className="font-semibold text-slate-800">{r.employeeName || empName(r.employeeId)}</td>
                        <td>{r.cycle}</td>
                        <td>{r.reviewerName || '—'}</td>
                        <td>{r.overallRating ? <span className="sh-badge sh-badge-primary"><Star className="w-3 h-3" /> {r.overallRating}/5</span> : '—'}</td>
                        <td><span className={`sh-badge ${r.status === 'Completed' ? 'sh-badge-success' : r.status === 'Manager Review' ? 'sh-badge-info' : 'sh-badge-warning'}`}>{r.status}</span></td>
                        <td className="text-right">
                          <button type="button" className="sh-btn" onClick={() => setOpenReview(openReview === r.id ? null : r.id)}>
                            {openReview === r.id ? 'Hide' : 'Open'} <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                      {openReview === r.id && (
                        <tr><td colSpan={6} className="bg-slate-50">
                          <div className="space-y-2 py-1">
                            {r.goals.map((g) => (
                              <div key={g.id} className="flex flex-wrap items-center gap-2 text-[12px]">
                                <span className="font-semibold text-slate-700 min-w-[220px]">{g.title} <span className="text-slate-400">({g.weight}%)</span></span>
                                <span className="text-slate-500">Self</span>
                                <select className="sh-input max-w-[70px]" value={g.selfRating ?? ''} onChange={(e) => rateGoal(r.id, g.id, 'selfRating', Number(e.target.value))}>
                                  <option value="">—</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                                </select>
                                {mode === 'admin' && <>
                                  <span className="text-slate-500">Manager</span>
                                  <select className="sh-input max-w-[70px]" value={g.managerRating ?? ''} onChange={(e) => rateGoal(r.id, g.id, 'managerRating', Number(e.target.value))}>
                                    <option value="">—</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                                  </select>
                                </>}
                              </div>
                            ))}
                            {r.selfComments && <div className="text-[12px] text-slate-600"><b>Self comments:</b> {r.selfComments}</div>}
                            {r.managerComments && <div className="text-[12px] text-slate-600"><b>Manager comments:</b> {r.managerComments}</div>}
                            {mode === 'employee' && r.status !== 'Completed' && (
                              <div className="flex flex-wrap items-center gap-2">
                                <input className="sh-input flex-1 min-w-[240px]" placeholder="Your self assessment comments" value={selfText} onChange={(e) => setSelfText(e.target.value)} />
                                <button type="button" className="sh-btn sh-btn-primary" onClick={() => saveSelf(r)}><Check className="w-3.5 h-3.5" /> Submit self assessment</button>
                              </div>
                            )}
                            {mode === 'admin' && r.status !== 'Completed' && (
                              <div className="flex flex-wrap items-center gap-2">
                                <input className="sh-input flex-1 min-w-[240px]" placeholder="Manager comments" value={mgrText} onChange={(e) => setMgrText(e.target.value)} />
                                <button type="button" className="sh-btn sh-btn-primary" onClick={() => saveManager(r)}><Check className="w-3.5 h-3.5" /> Complete review</button>
                              </div>
                            )}
                          </div>
                        </td></tr>
                      )}
                    </React.Fragment>
                  ))}
                  {(mode === 'employee' ? myReviews : performanceReviews).length === 0 && (
                    <tr><td colSpan={6} className="text-center py-6 text-slate-400">{mode === 'employee' ? 'No reviews for you.' : 'No reviews yet.'}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- TRAINING */}
        {tab === 'training' && (
          <div className="sh-card-body space-y-4">
            {mode === 'admin' && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <input className="sh-input max-w-[220px]" placeholder="Programme title" value={trTitle} onChange={(e) => setTrTitle(e.target.value)} />
                  <input className="sh-input max-w-[170px]" placeholder="Trainer" value={trTrainer} onChange={(e) => setTrTrainer(e.target.value)} />
                  <input type="date" className="sh-input max-w-[160px]" value={trStart} onChange={(e) => setTrStart(e.target.value)} />
                  <select className="sh-input max-w-[140px]" value={trMode} onChange={(e) => setTrMode(e.target.value as TrainingMode)}>
                    {TRAINING_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <button type="button" className="sh-btn sh-btn-primary" onClick={addProgram}><Plus className="w-3.5 h-3.5" /> Add programme</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="sh-table w-full">
                    <thead><tr><th>Programme</th><th>Trainer</th><th>Mode</th><th>Starts</th><th>Nominated</th><th>Status</th></tr></thead>
                    <tbody>
                      {trainingPrograms.map((p) => (
                        <tr key={p.id}>
                          <td className="font-semibold text-slate-800">{p.title}<div className="text-[11px] text-slate-500">{p.id}</div></td>
                          <td>{p.trainer || '—'}</td>
                          <td>{p.mode}</td>
                          <td>{p.startDate}</td>
                          <td>{trainingNominations.filter((n) => n.programId === p.id).length}</td>
                          <td><span className="sh-badge sh-badge-neutral">{p.status}</span></td>
                        </tr>
                      ))}
                      {trainingPrograms.length === 0 && <tr><td colSpan={6} className="text-center py-6 text-slate-400">No training programmes yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                  <select className="sh-input max-w-[220px]" value={nomProgram} onChange={(e) => setNomProgram(e.target.value)}>
                    <option value="">Programme…</option>
                    {trainingPrograms.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                  <select className="sh-input max-w-[200px]" value={nomEmployee} onChange={(e) => setNomEmployee(e.target.value)}>
                    <option value="">Employee…</option>
                    {employees.map((e) => <option key={e.userId} value={e.userId}>{e.name || e.userId}</option>)}
                  </select>
                  <button type="button" className="sh-btn sh-btn-primary" onClick={nominate}><Plus className="w-3.5 h-3.5" /> Nominate</button>
                </div>
              </>
            )}
            <div className="overflow-x-auto">
              <table className="sh-table w-full">
                <thead><tr><th>Programme</th><th>Employee</th><th>Status</th><th>Completed</th><th>Certificate</th>{mode === 'admin' && <th className="text-right">Action</th>}</tr></thead>
                <tbody>
                  {(mode === 'employee' ? myNominations : trainingNominations).map((n) => (
                    <tr key={n.id}>
                      <td className="font-semibold text-slate-800">{trainingPrograms.find((p) => p.id === n.programId)?.title || n.programId}</td>
                      <td>{n.employeeName || empName(n.employeeId)}</td>
                      <td><span className={`sh-badge ${n.status === 'Completed' ? 'sh-badge-success' : n.status === 'No Show' ? 'sh-badge-danger' : 'sh-badge-info'}`}>{n.status}</span></td>
                      <td>{n.completionDate || '—'}</td>
                      <td>{n.certificate ? <span className="sh-badge sh-badge-primary"><Award className="w-3 h-3" /> Yes</span> : '—'}</td>
                      {mode === 'admin' && (
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {TRAINING_NOMINATION_STATUSES.filter((s) => s !== n.status).map((s) => (
                              <button key={s} type="button" className="sh-btn !px-2 !py-1 !text-[10.5px]" onClick={() => setNominationStatus(n.id, s)}>{s}</button>
                            ))}
                            {n.status === 'Completed' && !n.certificate && (
                              <button type="button" className="sh-btn sh-btn-soft !px-2 !py-1 !text-[10.5px]" onClick={() => setNominationStatus(n.id, n.status, true)}>Certificate</button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {(mode === 'employee' ? myNominations : trainingNominations).length === 0 && (
                    <tr><td colSpan={mode === 'admin' ? 6 : 5} className="text-center py-6 text-slate-400">{mode === 'employee' ? 'No training nominations for you.' : 'No nominations yet.'}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PayrollTalentSection;
