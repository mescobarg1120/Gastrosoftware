import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Sidebar } from '../../components/layout/Sidebar';
import { Header } from '../../components/layout/Header';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import type { Order, OrderItem } from '../../types';

type DatePreset = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING: 'secondary',
  CONFIRMED: 'default',
  PREPARING: 'default',
  READY: 'outline',
  DELIVERED: 'default',
  CANCELLED: 'destructive',
};

const PRESET_LABELS: Record<DatePreset, string> = {
  today: 'Hoy',
  yesterday: 'Ayer',
  week: 'Esta semana',
  month: 'Este mes',
  custom: 'Personalizado',
};

function getPresetRange(preset: DatePreset): { from: Date; to: Date } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (preset) {
    case 'today': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { from: start, to: end };
    }
    case 'yesterday': {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
      const yEnd = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
      return { from: start, to: yEnd };
    }
    case 'week': {
      const dayOfWeek = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      const start = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
      return { from: start, to: end };
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: start, to: end };
    }
    default:
      return { from: end, to: end };
  }
}

function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toISOLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function ReportsPage() {
  const { employee } = useAuthStore();

  /* Date filter */
  const [preset, setPreset] = useState<DatePreset>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [appliedFrom, setAppliedFrom] = useState<Date>(() => getPresetRange('today').from);
  const [appliedTo, setAppliedTo] = useState<Date>(() => getPresetRange('today').to);

  /* Data */
  const [orders, setOrders] = useState<Order[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(20);

  /* Detail modal */
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchReport = useCallback(async (from: Date, to: Date) => {
    if (!employee?.branchId) return;
    setLoading(true);
    setVisibleCount(20);
    try {
      const [ordersRes, stockRes] = await Promise.allSettled([
        api.get(`/api/orders/branch/${employee.branchId}/report`, {
          params: { from: toISOLocal(from), to: toISOLocal(to) },
        }),
        api.get(`/api/inventory/branch/${employee.branchId}/low-stock`),
      ]);

      const allOrders: Order[] =
        ordersRes.status === 'fulfilled' ? ordersRes.value.data ?? [] : [];
      const lowStockArr: any[] =
        stockRes.status === 'fulfilled' ? stockRes.value.data ?? [] : [];

      setOrders(allOrders);
      setLowStockCount(lowStockArr.length);
    } catch (err) {
      console.error('Error al cargar reportes:', err);
    } finally {
      setLoading(false);
    }
  }, [employee?.branchId]);

  useEffect(() => {
    const range = getPresetRange(preset);
    setAppliedFrom(range.from);
    setAppliedTo(range.to);
    fetchReport(range.from, range.to);
  }, [preset, employee?.branchId, fetchReport]);

  const handleApplyCustom = () => {
    if (!customFrom || !customTo) return;
    const from = new Date(customFrom + 'T00:00:00');
    const to = new Date(customTo + 'T23:59:59');
    setAppliedFrom(from);
    setAppliedTo(to);
    setPreset('custom');
    fetchReport(from, to);
  };

  /* Summary calculation based on filtered orders */
  const summary = useMemo(() => {
    const completed = orders.filter(
      (o) => o.orderStatusName === 'DELIVERED' || o.orderStatusName === 'READY'
    );
    const sales = completed.reduce((sum, o) => sum + Number(o.total), 0);
    const count = completed.length;
    return {
      sales,
      completedOrders: count,
      avgTicket: count > 0 ? Math.round(sales / count) : 0,
      lowStockAlerts: lowStockCount,
    };
  }, [orders, lowStockCount]);

  const cards = [
    { label: 'Ventas del período', value: `$${summary.sales.toLocaleString()}`, color: 'text-green-400' },
    { label: 'Pedidos completados', value: summary.completedOrders, color: 'text-blue-400' },
    { label: 'Ticket promedio', value: `$${summary.avgTicket.toLocaleString()}`, color: 'text-yellow-400' },
    { label: 'Alertas de stock bajo', value: summary.lowStockAlerts, color: 'text-red-400' },
  ];

  const visibleOrders = orders.slice(0, visibleCount);
  const hasMore = orders.length > visibleCount;

  const openDetail = async (order: Order) => {
    try {
      const res = await api.get(`/api/orders/${order.id}`);
      setSelectedOrder(res.data);
    } catch {
      setSelectedOrder(order);
    }
    setDetailOpen(true);
  };

  const totalItems = (items?: OrderItem[]) => items?.reduce((s, i) => s + i.quantity, 0) ?? 0;

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Reportes" />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ───── Filter bar ───── */}
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1 font-medium">Rango</label>
                <div className="flex gap-1">
                  {(Object.keys(PRESET_LABELS) as DatePreset[]).map((key) => (
                    <button
                      key={key}
                      className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                        preset === key
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                      onClick={() => setPreset(key)}
                    >
                      {PRESET_LABELS[key]}
                    </button>
                  ))}
                </div>
              </div>

              {preset === 'custom' && (
                <>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1 font-medium">Desde</label>
                    <input
                      type="date"
                      className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-foreground"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1 font-medium">Hasta</label>
                    <input
                      type="date"
                      className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-foreground"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                    />
                  </div>
                  <Button size="sm" onClick={handleApplyCustom} disabled={!customFrom || !customTo}>
                    Aplicar filtro
                  </Button>
                </>
              )}

              {preset !== 'custom' && (
                <div className="text-xs text-muted-foreground ml-auto self-center">
                  {appliedFrom.toLocaleDateString()} — {appliedTo.toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          {/* ───── Summary cards ───── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card) => (
              <div key={card.label} className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                <p className="text-sm text-slate-400">{card.label}</p>
                <p className={`text-3xl font-bold mt-1 ${card.color}`}>
                  {loading ? '—' : card.value}
                </p>
              </div>
            ))}
          </div>

          {/* ───── Orders table ───── */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Pedidos ({orders.length})
            </h2>
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Cargando pedidos...</p>
            ) : orders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay pedidos en este período</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-left text-muted-foreground">
                      <th className="py-3 px-4 font-medium">#</th>
                      <th className="py-3 px-4 font-medium">Tipo</th>
                      <th className="py-3 px-4 font-medium">Estado</th>
                      <th className="py-3 px-4 font-medium">Items</th>
                      <th className="py-3 px-4 font-medium">Total</th>
                      <th className="py-3 px-4 font-medium">Método de pago</th>
                      <th className="py-3 px-4 font-medium">Creado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleOrders.map((o) => (
                      <tr
                        key={o.id}
                        className="border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer"
                        onClick={() => openDetail(o)}
                      >
                        <td className="py-3 px-4 text-foreground font-medium">#{o.dailyOrderNumber ?? o.id}</td>
                        <td className="py-3 px-4 text-muted-foreground">{o.orderTypeName}</td>
                        <td className="py-3 px-4">
                          <Badge variant={STATUS_BADGE[o.orderStatusName] || 'secondary'}>
                            {o.orderStatusName}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{o.itemsCount ?? totalItems(o.items)}</td>
                        <td className="py-3 px-4 text-foreground">${Number(o.total).toLocaleString()}</td>
                        <td className="py-3 px-4 text-muted-foreground">{o.paymentMethod ?? '—'}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(o.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {hasMore && (
                  <div className="flex justify-center pt-4">
                    <Button variant="outline" onClick={() => setVisibleCount((c) => c + 20)}>
                      Ver más ({orders.length - visibleCount} restantes)
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ───── Detail modal ───── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg bg-card text-foreground">
          <DialogHeader>
            <DialogTitle>Pedido #{selectedOrder?.dailyOrderNumber ?? selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              {selectedOrder?.orderTypeName} —{' '}
              <Badge variant={STATUS_BADGE[selectedOrder?.orderStatusName ?? ''] || 'secondary'}>
                {selectedOrder?.orderStatusName}
              </Badge>
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Cliente: </span>
                  <span className="text-foreground">{selectedOrder.customerName ?? 'Mostrador'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Atendió: </span>
                  <span className="text-foreground">{selectedOrder.employeeName ?? '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Método de pago: </span>
                  <span className="text-foreground">{selectedOrder.paymentMethod ?? '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Subtotal: </span>
                  <span className="text-foreground">${Number(selectedOrder.subtotal).toLocaleString()}</span>
                </div>
                {Number(selectedOrder.discountAmount) > 0 && (
                  <div>
                    <span className="text-muted-foreground">Descuento: </span>
                    <span className="text-red-400">-${Number(selectedOrder.discountAmount).toLocaleString()}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Total: </span>
                  <span className="text-lg font-bold text-foreground">${Number(selectedOrder.total).toLocaleString()}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Creado: </span>
                  <span className="text-foreground">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Items</h4>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-left text-muted-foreground">
                      <th className="py-2 px-2 font-medium">Producto</th>
                      <th className="py-2 px-2 font-medium text-right">Cant</th>
                      <th className="py-2 px-2 font-medium text-right">P.Unit</th>
                      <th className="py-2 px-2 font-medium text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item) => (
                      <tr key={item.id} className="border-b border-slate-800">
                        <td className="py-2 px-2 text-foreground">{item.productName}</td>
                        <td className="py-2 px-2 text-right text-muted-foreground">{item.quantity}</td>
                        <td className="py-2 px-2 text-right text-muted-foreground">
                          ${Number(item.unitPrice).toLocaleString()}
                        </td>
                        <td className="py-2 px-2 text-right text-foreground">
                          ${Number(item.subtotal).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
