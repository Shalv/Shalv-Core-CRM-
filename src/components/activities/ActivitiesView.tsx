import React, { useState, useEffect } from 'react';
import { useCrm } from '../../context/CrmContext';
import { ActivityType } from '../../types';
import {
  CalendarDays,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

interface ActivitiesViewProps {
  initialFilter?: string;
  onNavigateToLead: (leadId: string) => void;
  onNavigateToCustomer: (customerId: string) => void;
  onNavigateToOrder: (orderId: string) => void;
}

export const ActivitiesView: React.FC<ActivitiesViewProps> = ({
  initialFilter,
  onNavigateToLead,
  onNavigateToCustomer,
  onNavigateToOrder,
}) => {
  const {
    activities,
    addActivity,
    updateActivityStatus,
    users,
    leads,
    customers,
    orders,
    currentUser,
  } = useCrm();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Activity Form State
  const [actType, setActType] = useState<ActivityType>('Call');
  const [actSubject, setActSubject] = useState('');
  const [actDate, setActDate] = useState(new Date().toISOString().split('T')[0]);
  const [actTime, setActTime] = useState('11:00 AM');
  const [actPriority, setActPriority] = useState<'Low' | 'Medium' | 'High'>('High');
  const [actAssignedId, setActAssignedId] = useState(currentUser.id);
  const [linkCategory, setLinkCategory] = useState<'LEAD' | 'CUSTOMER' | 'ORDER' | 'GENERAL'>('LEAD');
  const [linkLeadId, setLinkLeadId] = useState(leads[0]?.id || '');
  const [linkCustomerId, setLinkCustomerId] = useState(customers[0]?.id || '');
  const [linkOrderId, setLinkOrderId] = useState(orders[0]?.id || '');
  const [actNotes, setActNotes] = useState('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!initialFilter) return;
    if (initialFilter === 'ACTION:CREATE') {
      setIsCreateModalOpen(true);
    } else if (initialFilter === 'FILTER:PENDING') {
      setStatusFilter('Pending');
    } else if (initialFilter === 'FILTER:OVERDUE') {
      setStatusFilter('Overdue');
    } else if (initialFilter === 'FILTER:TODAY') {
      setStatusFilter('Today');
    } else if (initialFilter === 'FILTER:COMPLETED') {
      setStatusFilter('Completed');
    } else {
      setStatusFilter('ALL');
    }
  }, [initialFilter]);

  const filteredActivities = activities.filter((a) => {
    const matchesSearch =
      a.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.customerName && a.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.contactPerson && a.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = typeFilter === 'ALL' || a.activityType === typeFilter;
    const isOverdue = a.status === 'Pending' && a.date < today;

    let matchesStatus = true;
    if (statusFilter === 'Pending') matchesStatus = a.status === 'Pending' && !isOverdue;
    else if (statusFilter === 'Overdue') matchesStatus = isOverdue;
    else if (statusFilter === 'Completed') matchesStatus = a.status === 'Completed';
    else if (statusFilter === 'Today') matchesStatus = a.date === today && a.status === 'Pending';

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    const assigned = users.find((u) => u.id === actAssignedId) || currentUser;

    let leadRef: string | undefined;
    let leadNum: string | undefined;
    let custRef: string | undefined;
    let custName: string | undefined;
    let ordRef: string | undefined;
    let ordNum: string | undefined;
    let contactPerson: string | undefined;

    if (linkCategory === 'LEAD') {
      const l = leads.find((x) => x.id === linkLeadId);
      if (l) {
        leadRef = l.id;
        leadNum = l.leadNumber;
        custName = l.companyName;
        contactPerson = l.contactPerson;
      }
    } else if (linkCategory === 'CUSTOMER') {
      const c = customers.find((x) => x.id === linkCustomerId);
      if (c) {
        custRef = c.id;
        custName = c.name;
        contactPerson = c.addresses[0]?.city;
      }
    } else if (linkCategory === 'ORDER') {
      const o = orders.find((x) => x.id === linkOrderId);
      if (o) {
        ordRef = o.id;
        ordNum = o.orderNumber;
        custRef = o.customerId;
        custName = o.customerName;
      }
    }

    addActivity({
      activityType: actType,
      subject: actSubject,
      date: actDate,
      time: actTime,
      priority: actPriority,
      status: 'Pending',
      assignedUserId: assigned.id,
      assignedUserName: assigned.name,
      notes: actNotes,
      leadId: leadRef,
      leadNumber: leadNum,
      customerId: custRef,
      customerName: custName,
      salesOrderId: ordRef,
      salesOrderNumber: ordNum,
      contactPerson,
    });

    setIsCreateModalOpen(false);
    setActSubject('');
    setActNotes('');
  };

  const activityTypes: ActivityType[] = [
    'Call',
    'Meeting',
    'Email',
    'Task',
    'Follow-up',
    'Demo',
    'Site Visit',
    'Reminder',
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-indigo-600" />
            <span>Activities, Scheduled Follow-ups & Tasks</span>
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 sidebar-tab-active-depth hover:bg-slate-200/70 text-slate-900 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap self-start sm:self-center shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Schedule Activity</span>
        </button>
      </div>

      {/* Clickable 5-Tile Activities KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-3.5">
        <button
          type="button"
          onClick={() => {
            setStatusFilter('ALL');
            setTypeFilter('ALL');
            setSearchQuery('');
          }}
          className={`text-left p-3.5 rounded-xl border transition group cursor-pointer ${
            statusFilter === 'ALL' && typeFilter === 'ALL' && !searchQuery
              ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-500/15'
              : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              All Activities
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition" />
          </div>
          <div className="text-lg font-extrabold font-mono tabular-nums text-slate-900 mt-1">
            {activities.length}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Show full schedule
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Today')}
          className={`text-left p-3.5 rounded-xl border transition group cursor-pointer ${
            statusFilter === 'Today'
              ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-500/15'
              : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
              Due Today
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-700 transition" />
          </div>
          <div className="text-lg font-extrabold font-mono tabular-nums text-indigo-700 mt-1">
            {activities.filter((a) => a.date === today && a.status === 'Pending').length}
          </div>
          <span className="text-[10px] text-indigo-600 mt-0.5 block">
            Priority follow-ups
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Pending')}
          className={`text-left p-3.5 rounded-xl border transition group cursor-pointer ${
            statusFilter === 'Pending'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-500/15'
              : 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Upcoming / Pending
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400 group-hover:text-amber-700 transition" />
          </div>
          <div className="text-lg font-extrabold font-mono tabular-nums text-amber-800 mt-1">
            {activities.filter((a) => a.status === 'Pending' && a.date >= today).length}
          </div>
          <span className="text-[10px] text-amber-700 mt-0.5 block">
            Scheduled tasks
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Overdue')}
          className={`text-left p-3.5 rounded-xl border transition group cursor-pointer ${
            statusFilter === 'Overdue'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-500/15'
              : 'bg-white border-slate-200 hover:border-rose-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
              Overdue
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-400 group-hover:text-rose-700 transition" />
          </div>
          <div className="text-lg font-extrabold font-mono tabular-nums text-rose-700 mt-1">
            {activities.filter((a) => a.status === 'Pending' && a.date < today).length}
          </div>
          <span className="text-[10px] text-rose-600 mt-0.5 block">
            Requires immediate action
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Completed')}
          className={`text-left p-3.5 rounded-xl border transition group cursor-pointer ${
            statusFilter === 'Completed'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/15'
              : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Completed
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 group-hover:text-emerald-700 transition" />
          </div>
          <div className="text-lg font-extrabold font-mono tabular-nums text-emerald-800 mt-1">
            {activities.filter((a) => a.status === 'Completed').length}
          </div>
          <span className="text-[10px] text-emerald-700 mt-0.5 block">
            Closed interactions
          </span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs shadow-xs">
        <div className="flex flex-1 items-center gap-2.5 min-w-[240px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by subject, customer, person..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="Today">Due Today</option>
            <option value="Pending">Pending / Upcoming</option>
            <option value="Overdue">Overdue</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium"
          >
            <option value="ALL">All Activity Types</option>
            {activityTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <span className="text-[11px] text-slate-400 font-medium px-2">
            {filteredActivities.length} Activities
          </span>
        </div>
      </div>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredActivities.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center text-slate-400 rounded-xl border border-slate-200">
            No activities match current criteria.
          </div>
        ) : (
          filteredActivities.map((act) => {
            const isOverdue = act.status === 'Pending' && act.date < today;
            const handleCardClick = () => {
              if (act.salesOrderId) {
                onNavigateToOrder(act.salesOrderId);
              } else if (act.leadId) {
                onNavigateToLead(act.leadId);
              } else if (act.customerId) {
                onNavigateToCustomer(act.customerId);
              }
            };

            return (
              <div
                key={act.id}
                onClick={handleCardClick}
                className={`p-4 rounded-xl border shadow-xs transition flex flex-col justify-between cursor-pointer group ${
                  act.status === 'Completed'
                    ? 'bg-slate-50 border-slate-200 opacity-85 hover:border-slate-300'
                    : isOverdue
                    ? 'bg-rose-50/40 border-rose-200 hover:border-rose-400'
                    : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-indigo-100 text-indigo-700">
                      {act.activityType}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          act.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : isOverdue
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isOverdue ? 'Overdue' : act.status}
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition" />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{act.subject}</h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{act.date} {act.time}</span>
                    </div>
                  </div>

                  {act.notes && (
                    <p className="text-slate-600 text-xs leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
                      {act.notes}
                    </p>
                  )}

                  {/* Linked Context entity */}
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                    {act.leadNumber && (
                      <div className="flex justify-between">
                        <span>Lead:</span>
                        <button
                          onClick={() => onNavigateToLead(act.leadId!)}
                          className="font-bold text-indigo-600 hover:underline"
                        >
                          {act.leadNumber} ({act.customerName})
                        </button>
                      </div>
                    )}

                    {act.customerId && !act.leadNumber && (
                      <div className="flex justify-between">
                        <span>Customer:</span>
                        <button
                          onClick={() => onNavigateToCustomer(act.customerId!)}
                          className="font-bold text-indigo-600 hover:underline"
                        >
                          {act.customerName}
                        </button>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-400">
                      <span>Owner:</span>
                      <span className="font-medium text-slate-700">{act.assignedUserName}</span>
                    </div>
                  </div>
                </div>

                {/* Footer action */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                  {act.status === 'Pending' ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateActivityStatus(act.id, 'Completed');
                      }}
                      className="w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-200 transition flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Completed</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Completed on {act.completionDate}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* SCHEDULE ACTIVITY MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base text-slate-900">Schedule New Activity</h3>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreateActivity} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Activity Type</label>
                  <select
                    value={actType}
                    onChange={(e) => setActType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                  >
                    {activityTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={actPriority}
                    onChange={(e) => setActPriority(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={actDate}
                    onChange={(e) => setActDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Time</label>
                  <input
                    type="text"
                    value={actTime}
                    onChange={(e) => setActTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                    placeholder="e.g. 03:00 PM"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Discuss revised discount terms"
                  value={actSubject}
                  onChange={(e) => setActSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>

              {/* Link To CRM Entity */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block">Link to CRM Record</span>
                <div className="grid grid-cols-3 gap-2">
                  <label className={`p-2 rounded border text-center cursor-pointer ${
                    linkCategory === 'LEAD' ? 'bg-indigo-100 border-indigo-500 font-bold text-indigo-900' : 'bg-white border-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="linkCat"
                      checked={linkCategory === 'LEAD'}
                      onChange={() => setLinkCategory('LEAD')}
                      className="sr-only"
                    />
                    Lead
                  </label>

                  <label className={`p-2 rounded border text-center cursor-pointer ${
                    linkCategory === 'CUSTOMER' ? 'bg-indigo-100 border-indigo-500 font-bold text-indigo-900' : 'bg-white border-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="linkCat"
                      checked={linkCategory === 'CUSTOMER'}
                      onChange={() => setLinkCategory('CUSTOMER')}
                      className="sr-only"
                    />
                    Customer
                  </label>

                  <label className={`p-2 rounded border text-center cursor-pointer ${
                    linkCategory === 'ORDER' ? 'bg-indigo-100 border-indigo-500 font-bold text-indigo-900' : 'bg-white border-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="linkCat"
                      checked={linkCategory === 'ORDER'}
                      onChange={() => setLinkCategory('ORDER')}
                      className="sr-only"
                    />
                    Sales Order
                  </label>
                </div>

                {linkCategory === 'LEAD' && (
                  <select
                    value={linkLeadId}
                    onChange={(e) => setLinkLeadId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-medium"
                  >
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.leadNumber} - {l.companyName}
                      </option>
                    ))}
                  </select>
                )}

                {linkCategory === 'CUSTOMER' && (
                  <select
                    value={linkCustomerId}
                    onChange={(e) => setLinkCustomerId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-medium"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.customerCode} - {c.name}
                      </option>
                    ))}
                  </select>
                )}

                {linkCategory === 'ORDER' && (
                  <select
                    value={linkOrderId}
                    onChange={(e) => setLinkOrderId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-medium"
                  >
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.orderNumber} - {o.customerName}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes / Call Agenda</label>
                <textarea
                  rows={2}
                  value={actNotes}
                  onChange={(e) => setActNotes(e.target.value)}
                  placeholder="Points to discuss or action plan..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md"
                >
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
