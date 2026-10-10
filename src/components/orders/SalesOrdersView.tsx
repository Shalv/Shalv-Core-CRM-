import React, { useState, useEffect } from 'react';
import { useCrm } from '../../context/CrmContext';
import {
  FileSpreadsheet,
  Plus,
  Search,
  CheckCircle2,
  Layers,
  CalendarCheck,
  Receipt,
  Trash2,
  FileText,
  RefreshCw,
  ArrowUpRight,
  AlertTriangle,
  AlertCircle,
  X,
  Lock,
} from 'lucide-react';
import { SalesOrder } from '../../types';

interface SalesOrdersViewProps {
  onOpenTrace: (leadId?: string, customerId?: string, orderId?: string) => void;
  onNavigateToCustomer: (customerId: string) => void;
  onNavigateToInvoice: (invoiceId: string) => void;
  onNavigateToMilestones?: (filter?: string) => void;
  onNavigateToReport?: (reportTab: string) => void;
  initialOrderId?: string;
}

export const SalesOrdersView: React.FC<SalesOrdersViewProps> = ({
  onOpenTrace,
  onNavigateToCustomer,
  onNavigateToInvoice,
  onNavigateToMilestones,
  onNavigateToReport,
  initialOrderId,
}) => {
  const {
    orders,
    addOrder,
    updateOrderStatus,
    deleteOrder,
    milestones,
    invoices,
    payments,
    generateProformaFromMilestone,
    generateInvoiceFromMilestone,
    getOrderFinanceSummary,
    customers,
    products,
    paymentTerms,
    formatCurrency,
    supplierCompany,
    canCreate,
    canEdit,
    canDelete,
  } = useCrm();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    initialOrderId || orders[0]?.id || ''
  );

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Delete Order Confirmation state
  const [orderToDelete, setOrderToDelete] = useState<SalesOrder | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // New Order Form state
  const [orderCustId, setOrderCustId] = useState<string>(customers[0]?.id || '');
  const [orderPaymentTermId, setOrderPaymentTermId] = useState<string>(
    paymentTerms[0]?.id || ''
  );
  const [orderDeliveryDate, setOrderDeliveryDate] = useState<string>(
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [orderRemarks, setOrderRemarks] = useState('');
  const [orderItems, setOrderItems] = useState<
    Array<{ productId: string; quantity: number; discountPercent: number }>
  >([{ productId: products[0]?.id || '', quantity: 1, discountPercent: 0 }]);

  useEffect(() => {
    if (!initialOrderId) return;
    if (initialOrderId === 'ACTION:CREATE') {
      setIsCreateModalOpen(true);
    } else if (initialOrderId === 'FILTER:PENDING_APPROVAL') {
      setStatusFilter('Pending Approval');
    } else if (initialOrderId === 'FILTER:APPROVED') {
      setStatusFilter('Approved');
    } else {
      setSelectedOrderId(initialOrderId);
    }
  }, [initialOrderId]);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || orders[0];
  const orderMilestones = selectedOrder
    ? milestones.filter((m) => m.salesOrderId === selectedOrder.id)
    : [];
  const financeSummary = selectedOrder
    ? getOrderFinanceSummary(selectedOrder.id)
    : null;

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.leadReferenceNumber &&
        o.leadReferenceNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddItem = () => {
    setOrderItems((prev) => [
      ...prev,
      { productId: products[0]?.id || '', quantity: 1, discountPercent: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (orderItems.length === 1) return;
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === orderCustId);
    if (!cust) return;

    const billing =
      cust.addresses.find((a) => a.type === 'Billing') || cust.addresses[0];
    const shipping =
      cust.addresses.find((a) => a.type === 'Shipping') || billing;

    const newOrd = addOrder({
      customerId: cust.id,
      paymentTermsId: orderPaymentTermId,
      deliveryDate: orderDeliveryDate,
      billingAddress: billing,
      shippingAddress: shipping,
      items: orderItems,
      remarks: orderRemarks,
    });

    setIsCreateModalOpen(false);
    setSelectedOrderId(newOrd.id);
  };

  // Preview taxes for form
  const previewCustomer = customers.find((c) => c.id === orderCustId);
  const previewStateCode = previewCustomer?.addresses[0]?.stateCode || '07';
  const isInterStatePreview = previewStateCode !== supplierCompany.stateCode;

  const handleInitiateDelete = (order: SalesOrder) => {
    setOrderToDelete(order);
    setDeleteErrorMessage(null);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!orderToDelete) return;
    const result = deleteOrder(orderToDelete.id);
    if (!result.success) {
      setDeleteErrorMessage(result.message);
      return;
    }

    const remaining = orders.filter((o) => o.id !== orderToDelete.id);
    if (selectedOrderId === orderToDelete.id) {
      setSelectedOrderId(remaining[0]?.id || '');
    }

    setIsDeleteModalOpen(false);
    setOrderToDelete(null);
    setDeleteErrorMessage(null);
    setSuccessBanner(result.message);
    setTimeout(() => {
      setSuccessBanner(null);
    }, 4500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-amber-600 shrink-0" />
            <span>Sales Order & Contract Billing Management</span>
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          {onNavigateToReport && (
            <button
              onClick={() => onNavigateToReport('sales_register')}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl shadow-2xs transition"
            >
              <span>Sales Order Report</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
          {canCreate('orders') ? (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 sidebar-tab-active-depth hover:bg-slate-200/70 text-slate-900 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Create Sales Order</span>
            </button>
          ) : (
            <span
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-400 text-xs font-semibold rounded-xl border border-slate-200 cursor-not-allowed"
              title="Permission Denied: Your role does not have Create rights for Sales Orders."
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Create Order: Restricted</span>
            </span>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between text-xs font-semibold shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-500 hover:text-emerald-800 p-0.5 rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Clickable Sales Orders KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => {
            setStatusFilter('ALL');
            setSearchQuery('');
          }}
          className={`text-left p-3.5 rounded-xl border transition group cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/15'
              : 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Total Order Book
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition" />
          </div>
          <div className="text-base font-extrabold font-mono tabular-nums text-slate-900 mt-1 truncate">
            {formatCurrency(orders.reduce((s, o) => s + o.grandTotal, 0))}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            {orders.length} total contract(s)
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Pending Approval')}
          className={`text-left p-3.5 rounded-xl border transition group cursor-pointer ${
            statusFilter === 'Pending Approval'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-500/15'
              : 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Pending Approval
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400 group-hover:text-amber-700 transition" />
          </div>
          <div className="text-base font-extrabold font-mono tabular-nums text-amber-800 mt-1 truncate">
            {orders.filter((o) => o.status === 'Pending Approval').length} Orders
          </div>
          <span className="text-[10px] text-amber-700 mt-0.5 block">
            Click to filter queue
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Approved')}
          className={`text-left p-3.5 rounded-xl border transition group cursor-pointer ${
            statusFilter === 'Approved'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/15'
              : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Approved Contracts
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 group-hover:text-emerald-700 transition" />
          </div>
          <div className="text-base font-extrabold font-mono tabular-nums text-emerald-800 mt-1 truncate">
            {orders.filter((o) => o.status === 'Approved' || o.status === 'In Progress').length} Active
          </div>
          <span className="text-[10px] text-emerald-700 mt-0.5 block">
            Click to filter active
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateToMilestones?.('ALL')}
          className="text-left p-3.5 rounded-xl border bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-xs transition group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
              CRM Milestones
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-700 transition" />
          </div>
          <div className="text-base font-extrabold font-mono tabular-nums text-indigo-800 mt-1 truncate">
            {milestones.length} Scheduled
          </div>
          <span className="text-[10px] text-indigo-600 mt-0.5 block">
            Open Milestone Billing →
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateToReport?.('sales_register')}
          className="text-left p-3.5 rounded-xl border bg-white border-slate-200 hover:border-slate-400 hover:bg-slate-50 hover:shadow-xs transition group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Contract Register
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 transition" />
          </div>
          <div className="text-base font-extrabold text-slate-900 mt-1 truncate">
            Export & Audit
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Open Sales Register →
          </span>
        </button>
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Orders Register List */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-3.5 border-b border-slate-200 bg-slate-50 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by SO #, Customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Approved">Approved</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>

              <span className="text-[11px] text-slate-400 font-mono">
                {filteredOrders.length} Orders
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[700px] overflow-y-auto">
            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-600 mb-1">No orders found</p>
                <p className="text-[11px]">No sales orders match your search or filter.</p>
              </div>
            ) : (
              filteredOrders.map((ord) => {
                const isSelected = selectedOrder?.id === ord.id;
                const ordFin = getOrderFinanceSummary(ord.id);

                return (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedOrderId(ord.id)}
                    className={`p-3.5 cursor-pointer transition flex items-start justify-between text-xs group ${
                      isSelected
                        ? 'bg-amber-50/70 border-l-4 border-amber-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1 flex-1 min-w-0 pr-2">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="font-mono text-amber-800 font-bold bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">
                          {ord.orderNumber}
                        </span>
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                              ordFin.paymentStatus === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ordFin.paymentStatus === 'Partially Paid'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {ordFin.paymentStatus}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                              ord.status === 'Approved' ||
                              ord.status === 'In Progress' ||
                              ord.status === 'Completed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : ord.status === 'Pending Approval'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {ord.status}
                          </span>
                          {canDelete('orders') && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleInitiateDelete(ord);
                              }}
                              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded transition opacity-80 group-hover:opacity-100"
                              title={`Delete order ${ord.orderNumber}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <h4 className="font-bold text-slate-900 leading-snug truncate">
                        {ord.customerName}
                      </h4>

                      <div className="text-[11px] text-slate-500 truncate">
                        Date: {ord.orderDate}{' '}
                        {ord.opportunityReferenceNumber
                          ? `• ${ord.opportunityReferenceNumber}`
                          : ord.leadReferenceNumber
                          ? `• ${ord.leadReferenceNumber}`
                          : ''}
                      </div>

                      <div className="flex justify-between items-center pt-1 text-[11px] font-mono tabular-nums">
                        <span className="text-slate-500">
                          Total: {formatCurrency(ord.grandTotal)}
                        </span>
                        <span
                          className={`font-bold ${
                            ordFin.remainingBalance > 0
                              ? 'text-rose-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          Rem: {formatCurrency(ordFin.remainingBalance)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Order Detail & Financials */}
        {selectedOrder && financeSummary ? (
          <div className="lg:col-span-8 space-y-6 min-w-0">
            {/* Header Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                      {selectedOrder.orderNumber}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        selectedOrder.status === 'Approved' ||
                        selectedOrder.status === 'In Progress'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedOrder.status === 'Pending Approval'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {selectedOrder.status}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        financeSummary.paymentStatus === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : financeSummary.paymentStatus === 'Partially Paid'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      Payment: {financeSummary.paymentStatus}
                    </span>
                    {selectedOrder.opportunityReferenceNumber && (
                      <span className="text-xs text-violet-700 bg-violet-50 border border-violet-200 font-mono font-bold px-2 py-0.5 rounded">
                        From {selectedOrder.opportunityReferenceNumber}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => onNavigateToCustomer(selectedOrder.customerId)}
                    className="text-xl font-extrabold text-slate-900 hover:text-indigo-600 mt-1 block text-left truncate max-w-full"
                  >
                    {selectedOrder.customerName}
                  </button>
                  <div className="text-xs text-slate-500 flex flex-wrap gap-3 mt-0.5">
                    <span>
                      Order Date: <strong>{selectedOrder.orderDate}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Payment Terms: <strong>{selectedOrder.paymentTermsName}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Salesperson: <strong>{selectedOrder.salespersonName}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() =>
                      onOpenTrace(
                        selectedOrder.leadReferenceId,
                        selectedOrder.customerId,
                        selectedOrder.id
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Trace Flow</span>
                  </button>

                  {selectedOrder.status === 'Pending Approval' && canEdit('orders') && (
                    <button
                      onClick={() =>
                        updateOrderStatus(
                          selectedOrder.id,
                          'Approved',
                          'Approved by Management'
                        )
                      }
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Order</span>
                    </button>
                  )}

                  {canDelete('orders') && (
                    <button
                      type="button"
                      onClick={() => handleInitiateDelete(selectedOrder)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition"
                      title="Delete Sales Order"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Order</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Order Financial Recalculation Strip (Every tile clickable) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    onOpenTrace(
                      selectedOrder.leadReferenceId,
                      selectedOrder.customerId,
                      selectedOrder.id
                    )
                  }
                  className="text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 hover:border-slate-300 min-w-0 overflow-hidden transition group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block truncate">
                      Order Value
                    </span>
                    <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-slate-700 shrink-0" />
                  </div>
                  <span className="text-sm font-extrabold font-mono tabular-nums text-slate-900 block truncate mt-0.5">
                    {formatCurrency(financeSummary.orderTotal)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const piMs = orderMilestones.find((m) => m.proformaInvoiceId);
                    if (piMs?.proformaInvoiceId) {
                      onNavigateToInvoice(piMs.proformaInvoiceId);
                    } else {
                      onNavigateToMilestones?.(selectedOrder.orderNumber);
                    }
                  }}
                  className="text-left p-3 bg-amber-50/50 hover:bg-amber-100/60 rounded-xl border border-amber-200/70 hover:border-amber-300 min-w-0 overflow-hidden transition group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 block truncate">
                      Proforma (PI)
                    </span>
                    <ArrowUpRight className="w-3 h-3 text-amber-500 group-hover:text-amber-800 shrink-0" />
                  </div>
                  <span className="text-sm font-extrabold font-mono tabular-nums text-amber-800 block truncate mt-0.5">
                    {formatCurrency(financeSummary.proformaTotal)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const invMs = orderMilestones.find((m) => m.invoiceId);
                    if (invMs?.invoiceId) {
                      onNavigateToInvoice(invMs.invoiceId);
                    } else {
                      onNavigateToReport?.('gst_tax_register');
                    }
                  }}
                  className="text-left p-3 bg-indigo-50/50 hover:bg-indigo-100/60 rounded-xl border border-indigo-200/70 hover:border-indigo-300 min-w-0 overflow-hidden transition group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-700 block truncate">
                      Tax Invoiced
                    </span>
                    <ArrowUpRight className="w-3 h-3 text-indigo-500 group-hover:text-indigo-800 shrink-0" />
                  </div>
                  <span className="text-sm font-extrabold font-mono tabular-nums text-indigo-800 block truncate mt-0.5">
                    {formatCurrency(financeSummary.taxInvoicedTotal)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateToReport?.('collection_register')}
                  className="text-left p-3 bg-emerald-50/50 hover:bg-emerald-100/60 rounded-xl border border-emerald-200/70 hover:border-emerald-300 min-w-0 overflow-hidden transition group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 block truncate">
                      Collected
                    </span>
                    <ArrowUpRight className="w-3 h-3 text-emerald-500 group-hover:text-emerald-800 shrink-0" />
                  </div>
                  <span className="text-sm font-extrabold font-mono tabular-nums text-emerald-800 block truncate mt-0.5">
                    {formatCurrency(financeSummary.collectedTotal)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateToMilestones?.(selectedOrder.orderNumber)}
                  className="text-left p-3 bg-rose-50/50 hover:bg-rose-100/60 rounded-xl border border-rose-200/70 hover:border-rose-300 min-w-0 overflow-hidden transition group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-700 block truncate">
                      Remaining Bal
                    </span>
                    <ArrowUpRight className="w-3 h-3 text-rose-500 group-hover:text-rose-800 shrink-0" />
                  </div>
                  <span className="text-sm font-extrabold font-mono tabular-nums text-rose-800 block truncate mt-0.5">
                    {formatCurrency(financeSummary.remainingBalance)}
                  </span>
                </button>
              </div>

              {/* GST & State Code Audit Summary (Clickable Cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => onNavigateToReport?.('gst_tax_register')}
                  className="text-left p-2 rounded-lg hover:bg-white transition cursor-pointer"
                >
                  <span className="text-slate-400 block text-[10px]">Supplier Location:</span>
                  <span className="font-semibold text-slate-800">
                    {supplierCompany.state}
                  </span>
                  <span className="text-indigo-600 font-mono font-bold block text-[10px]">
                    State Code: {selectedOrder.supplierStateCode}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateToCustomer(selectedOrder.customerId)}
                  className="text-left p-2 rounded-lg hover:bg-white transition cursor-pointer"
                >
                  <span className="text-slate-400 block text-[10px]">
                    Customer Place of Supply:
                  </span>
                  <span className="font-semibold text-slate-800">
                    {selectedOrder.billingAddress.state}
                  </span>
                  <span className="text-indigo-600 font-mono font-bold block text-[10px]">
                    State Code: {selectedOrder.billingAddress.stateCode}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateToReport?.('gst_tax_register')}
                  className="text-left p-2 rounded-lg hover:bg-white transition cursor-pointer"
                >
                  <span className="text-slate-400 block text-[10px]">
                    Applicable Tax System:
                  </span>
                  <span
                    className={`font-bold block ${
                      selectedOrder.isInterState ? 'text-purple-700' : 'text-blue-700'
                    }`}
                  >
                    {selectedOrder.isInterState
                      ? 'Inter-state IGST'
                      : 'Intra-state CGST + SGST'}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {selectedOrder.isInterState
                      ? '18% Integrated Tax (View Register →)'
                      : '9% CGST + 9% SGST (View Register →)'}
                  </span>
                </button>
              </div>

              {/* Line Items Table */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Order Line Items
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Item / Service</th>
                        <th className="p-3">HSN/SAC</th>
                        <th className="p-3 text-right">Qty</th>
                        <th className="p-3 text-right">Unit Rate</th>
                        <th className="p-3 text-right">Discount</th>
                        <th className="p-3 text-right">Taxable</th>
                        <th className="p-3 text-right">GST Rate</th>
                        <th className="p-3 text-right">Tax Amount</th>
                        <th className="p-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.items.map((it) => (
                        <tr key={it.id}>
                          <td className="p-3">
                            <span className="font-bold text-slate-900 block">
                              {it.productName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {it.description}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-600">{it.hsnSac}</td>
                          <td className="p-3 text-right font-medium font-mono">
                            {it.quantity} {it.uom}
                          </td>
                          <td className="p-3 text-right font-mono tabular-nums">
                            {formatCurrency(it.unitRate)}
                          </td>
                          <td className="p-3 text-right text-slate-500 font-mono">
                            {it.discountPercent}%
                          </td>
                          <td className="p-3 text-right font-medium font-mono tabular-nums">
                            {formatCurrency(it.taxableAmount)}
                          </td>
                          <td className="p-3 text-right font-mono">{it.gstRate}%</td>
                          <td className="p-3 text-right text-indigo-600 font-mono tabular-nums">
                            {formatCurrency(it.totalTax)}
                          </td>
                          <td className="p-3 text-right font-extrabold text-slate-900 font-mono tabular-nums">
                            {formatCurrency(it.lineTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Grand Total Breakdown */}
                <div className="flex justify-end pt-3">
                  <div className="w-72 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs font-mono tabular-nums">
                    <div className="flex justify-between text-slate-600">
                      <span className="font-sans">Subtotal:</span>
                      <span>{formatCurrency(selectedOrder.subtotal)}</span>
                    </div>
                    {selectedOrder.totalDiscount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span className="font-sans">Discount:</span>
                        <span>-{formatCurrency(selectedOrder.totalDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <span className="font-sans">Taxable Value:</span>
                      <span>{formatCurrency(selectedOrder.totalTaxable)}</span>
                    </div>
                    {selectedOrder.isInterState ? (
                      <div className="flex justify-between text-purple-700">
                        <span className="font-sans">IGST (18%):</span>
                        <span>{formatCurrency(selectedOrder.totalIgst)}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between text-blue-700">
                          <span className="font-sans">CGST (9%):</span>
                          <span>{formatCurrency(selectedOrder.totalCgst)}</span>
                        </div>
                        <div className="flex justify-between text-blue-700">
                          <span className="font-sans">SGST (9%):</span>
                          <span>{formatCurrency(selectedOrder.totalSgst)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                      <span className="font-sans">Grand Total:</span>
                      <span className="text-amber-800">
                        {formatCurrency(selectedOrder.grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Milestone Schedule */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                        CRM Milestone Billing Schedule
                      </h4>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Milestone</th>
                        <th className="p-3">Description</th>
                        <th className="p-3 text-right">Percent</th>
                        <th className="p-3 text-right">Amount & Rem.</th>
                        <th className="p-3">Due Date</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Proforma / Tax Invoice</th>
                        <th className="p-3 text-center">Quick Bill</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orderMilestones.map((m) => {
                        const rem = Math.max(0, m.amount - m.paidAmount);
                        return (
                          <tr key={m.id} className="hover:bg-slate-50">
                            <td className="p-3 font-mono font-bold text-indigo-700">
                              {m.milestoneCode}
                            </td>
                            <td className="p-3 text-slate-800 max-w-xs truncate">
                              {m.description}
                            </td>
                            <td className="p-3 text-right font-mono font-medium">
                              {m.percentage}%
                            </td>
                            <td className="p-3 text-right font-mono tabular-nums">
                              <span className="font-bold text-slate-900 block">
                                {formatCurrency(m.amount)}
                              </span>
                              <span
                                className={`text-[10px] font-semibold block ${
                                  rem > 0 ? 'text-rose-600' : 'text-emerald-600'
                                }`}
                              >
                                {rem > 0 ? `Rem: ${formatCurrency(rem)}` : 'Paid'}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-slate-600">{m.dueDate}</td>
                            <td className="p-3">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  m.status === 'Paid'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : m.status === 'Overdue'
                                    ? 'bg-rose-100 text-rose-800'
                                    : m.status === 'Partially Paid'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {m.status}
                              </span>
                            </td>
                            <td className="p-3 space-y-1">
                              {m.proformaInvoiceNumber && (
                                <button
                                  onClick={() => onNavigateToInvoice(m.proformaInvoiceId!)}
                                  className="font-mono text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded hover:underline font-bold text-[10px] block"
                                >
                                  {m.proformaInvoiceNumber}
                                </button>
                              )}
                              {m.invoiceNumber ? (
                                <button
                                  onClick={() => onNavigateToInvoice(m.invoiceId!)}
                                  className="font-mono text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded hover:underline font-bold text-[10px] block"
                                >
                                  {m.invoiceNumber}
                                </button>
                              ) : !m.proformaInvoiceNumber ? (
                                <span className="text-slate-400 text-[11px]">Not Billed</span>
                              ) : null}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {!m.proformaInvoiceId && !m.invoiceId && (
                                  <button
                                    onClick={() => {
                                      const pi = generateProformaFromMilestone(m.id);
                                      if (pi) onNavigateToInvoice(pi.id);
                                    }}
                                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-[10px] font-bold flex items-center gap-1"
                                    title="Issue Proforma Invoice"
                                  >
                                    <FileText className="w-3 h-3" />
                                    <span>PI</span>
                                  </button>
                                )}
                                {!m.invoiceId && (
                                  <button
                                    onClick={() => {
                                      const inv = generateInvoiceFromMilestone(m.id);
                                      if (inv) onNavigateToInvoice(inv.id);
                                    }}
                                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold flex items-center gap-1"
                                    title={
                                      m.proformaInvoiceId
                                        ? 'Convert Proforma to Tax Invoice'
                                        : 'Issue GST Tax Invoice'
                                    }
                                  >
                                    {m.proformaInvoiceId ? (
                                      <>
                                        <RefreshCw className="w-3 h-3" />
                                        <span>Tax</span>
                                      </>
                                    ) : (
                                      <>
                                        <Receipt className="w-3 h-3" />
                                        <span>Tax</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-4 border border-amber-100">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">No Sales Order Selected</h3>
            <p className="text-xs text-slate-500 max-w-sm mb-6">
              Create a new sales order or select one from the list to view billing milestones, line items, and financial records.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Sales Order</span>
            </button>
          </div>
        )}
      </div>

      {/* DELETE ORDER CONFIRMATION MODAL */}
      {isDeleteModalOpen && orderToDelete && (() => {
        const linkedPayments = payments.filter((p) => p.salesOrderId === orderToDelete.id);
        const linkedActiveTaxInvoices = invoices.filter(
          (i) => i.salesOrderId === orderToDelete.id && i.invoiceType !== 'Proforma' && i.status !== 'Cancelled'
        );
        const linkedProformas = invoices.filter(
          (i) => i.salesOrderId === orderToDelete.id && i.invoiceType === 'Proforma'
        );
        const linkedOrderMilestones = milestones.filter(
          (m) => m.salesOrderId === orderToDelete.id
        );
        const isBlocked = linkedPayments.length > 0 || linkedActiveTaxInvoices.length > 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
              {/* Modal Header */}
              <div className="px-6 py-4 bg-rose-50 border-b border-rose-100 flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-rose-950">
                      Delete Sales Order
                    </h3>
                    <p className="text-xs text-rose-700 font-mono">
                      {orderToDelete.orderNumber}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setOrderToDelete(null);
                    setDeleteErrorMessage(null);
                  }}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 text-xs">
                {deleteErrorMessage && (
                  <div className="p-3 bg-rose-100 border border-rose-300 text-rose-800 rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Action Blocked</span>
                      <span>{deleteErrorMessage}</span>
                    </div>
                  </div>
                )}

                {/* Order Summary Box */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-slate-500">Customer:</span>
                    <span className="font-bold text-slate-900">{orderToDelete.customerName}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-slate-500">Order Date:</span>
                    <span className="font-mono text-slate-800">{orderToDelete.orderDate}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-slate-500">Status:</span>
                    <span className="font-bold px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-800">
                      {orderToDelete.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Grand Total:</span>
                    <span className="font-mono font-extrabold text-slate-900 text-sm">
                      {formatCurrency(orderToDelete.grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Validation and Impact Details */}
                {isBlocked ? (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-rose-900">
                    <div className="flex items-center gap-2 font-bold text-rose-800">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>This order cannot be deleted yet</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-rose-700">
                      For financial audit integrity, orders with active payment receipts or tax invoices cannot be deleted:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-800 font-medium pl-1">
                      {linkedPayments.length > 0 && (
                        <li>
                          <strong>{linkedPayments.length} Payment Receipt(s):</strong>{' '}
                          {linkedPayments.map((p) => p.receiptNumber).join(', ')} ({formatCurrency(linkedPayments.reduce((acc, p) => acc + p.amount, 0))}). Delete these receipts first in Collections.
                        </li>
                      )}
                      {linkedActiveTaxInvoices.length > 0 && (
                        <li>
                          <strong>{linkedActiveTaxInvoices.length} Active Tax Invoice(s):</strong>{' '}
                          {linkedActiveTaxInvoices.map((i) => i.invoiceNumber).join(', ')}. Cancel or delete the tax invoices first.
                        </li>
                      )}
                    </ul>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-amber-900">
                    <div className="flex items-center gap-2 font-bold text-amber-800">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Warning: Permanent Deletion</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-amber-800">
                      Deleting this sales order will permanently remove:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-900 font-medium pl-1">
                      <li>Sales Order record <strong>{orderToDelete.orderNumber}</strong></li>
                      <li><strong>{linkedOrderMilestones.length} CRM Payment Milestone(s)</strong> scheduled for this order</li>
                      {linkedProformas.length > 0 && (
                        <li><strong>{linkedProformas.length} Proforma Invoice(s)</strong> ({linkedProformas.map((p) => p.invoiceNumber).join(', ')})</li>
                      )}
                      {orderToDelete.opportunityReferenceNumber && (
                        <li>Revert linked opportunity <strong>{orderToDelete.opportunityReferenceNumber}</strong> conversion state</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setOrderToDelete(null);
                    setDeleteErrorMessage(null);
                  }}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs transition"
                >
                  Cancel
                </button>
                {isBlocked ? (
                  <button
                    type="button"
                    disabled
                    className="px-4 py-2 bg-slate-300 text-slate-500 rounded-xl font-bold text-xs cursor-not-allowed flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Cannot Delete (Active Records)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Delete Sales Order</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* CREATE ORDER MODAL (Clean Light Theme) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 block">
                  COMMERCIAL CONTRACT & MILESTONES
                </span>
                <h3 className="font-bold text-base text-slate-900">
                  Create New Sales Order
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleCreateOrderSubmit}
              className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto"
            >
              {/* Header Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer *</label>
                  <select
                    value={orderCustId}
                    onChange={(e) => setOrderCustId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.customerCode} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={orderPaymentTermId}
                    onChange={(e) => setOrderPaymentTermId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium"
                  >
                    {paymentTerms.map((pt) => (
                      <option key={pt.id} value={pt.id}>
                        {pt.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Target Delivery Date
                  </label>
                  <input
                    type="date"
                    value={orderDeliveryDate}
                    onChange={(e) => setOrderDeliveryDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
              </div>

              {/* State & Tax Regime Auto-indicator */}
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-900 block">
                    Tax Treatment:{' '}
                    {isInterStatePreview
                      ? 'Inter-state IGST'
                      : 'Intra-state CGST + SGST'}
                  </span>
                  <span className="text-[11px] text-amber-800">
                    Supplier State: {supplierCompany.state} ({supplierCompany.stateCode}) →
                    Customer State: {previewCustomer?.addresses[0]?.state} (
                    {previewStateCode})
                  </span>
                </div>
                <span className="text-xs font-mono font-bold bg-white text-amber-900 px-2.5 py-1 rounded border border-amber-300">
                  {isInterStatePreview ? 'IGST 18%' : 'CGST 9% + SGST 9%'}
                </span>
              </div>

              {/* Dynamic Line Items */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-800">
                    Products & Services Line Items
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-amber-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                {orderItems.map((item, idx) => {
                  const prod =
                    products.find((p) => p.id === item.productId) || products[0];
                  return (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end"
                    >
                      <div className="sm:col-span-5">
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                          Item / Service
                        </label>
                        <select
                          value={item.productId}
                          onChange={(e) => {
                            const newPId = e.target.value;
                            setOrderItems((prev) =>
                              prev.map((it, i) =>
                                i === idx ? { ...it, productId: newPId } : it
                              )
                            );
                          }}
                          className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-semibold"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.code} - {p.name} ({formatCurrency(p.sellingPrice)})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                          Qty ({prod?.uom})
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setOrderItems((prev) =>
                              prev.map((it, i) =>
                                i === idx ? { ...it, quantity: val } : it
                              )
                            );
                          }}
                          className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-bold font-mono"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                          Discount %
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discountPercent}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setOrderItems((prev) =>
                              prev.map((it, i) =>
                                i === idx ? { ...it, discountPercent: val } : it
                              )
                            );
                          }}
                          className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-mono"
                        />
                      </div>

                      <div className="sm:col-span-2 text-right font-mono tabular-nums">
                        <span className="text-[10px] text-slate-400 block font-sans">
                          Est. Line Total
                        </span>
                        <span className="font-bold text-slate-900 block pt-1">
                          {formatCurrency(
                            prod
                              ? prod.sellingPrice *
                                  item.quantity *
                                  (1 - item.discountPercent / 100) *
                                  1.18
                              : 0
                          )}
                        </span>
                      </div>

                      <div className="sm:col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                          disabled={orderItems.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Order Remarks / Contract Clauses
                </label>
                <textarea
                  rows={2}
                  value={orderRemarks}
                  onChange={(e) => setOrderRemarks(e.target.value)}
                  placeholder="Delivery terms, milestone conditions..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Generate Sales Order & Milestones
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
