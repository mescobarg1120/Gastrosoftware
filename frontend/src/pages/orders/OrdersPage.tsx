import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sidebar } from '../../components/layout/Sidebar';
import { Header } from '../../components/layout/Header';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import type { Order, OrderItem } from '../../types';

const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING: 'secondary',
  CONFIRMED: 'default',
  PREPARING: 'default',
  READY: 'outline',
  DELIVERED: 'default',
  CANCELLED: 'destructive',
};

type DatePreset = 'today' | 'yesterday' | 'week' | 'custom';

const PRESET_LABELS: Record<DatePreset, string> = {
  today: 'Hoy',
  yesterday: 'Ayer',
  week: 'Esta semana',
  custom: 'Personalizado',
};

const STATUS_OPTIONS = ['', 'PENDING', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELLED'] as const;

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
    default:
      return { from: end, to: end };
  }
}

function toISOLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const PAGE_SIZE = 20;

export default function OrdersPage() {
  const { employee } = useAuthStore();

  /* Date filter */
  const [preset, setPreset] = useState<DatePreset>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [appliedFrom, setAppliedFrom] = useState<Date>(() => getPresetRange('today').from);
  const [appliedTo, setAppliedTo] = useState<Date>(() => getPresetRange('today').to);

  /* Status filter */
  const [statusFilter, setStatusFilter] = useState<string>('');

  /* Pagination */
  const [page, setPage] = useState(1);

  /* Data */
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [newStatusId, setNewStatusId] = useState('');

  const fetchOrders = useCallback(async (from: Date, to: Date) => {
    if (!employee?.branchId) return;
    setLoading(true);
    setPage(1);
    try {
      const res = await api.get(`/api/orders/branch/${employee.branchId}/report`, {
        params: { from: toISOLocal(from), to: toISOLocal(to) },
      });
      setOrders(res.data ?? []);
    } catch (err) {
      console.error('Error al cargar pedidos:', err);
    } finally {
      setLoading(false);
    }
  }, [employee?.branchId]);

  useEffect(() => {
    const range = getPresetRange(preset);
    setAppliedFrom(range.from);
    setAppliedTo(range.to);
    fetchOrders(range.from, range.to);
  }, [preset, employee?.branchId, fetchOrders]);

  const handleApplyCustom = () => {
    if (!customFrom || !customTo) return;
    const from = new Date(customFrom + 'T00:00:00');
    const to = new Date(customTo + 'T23:59:59');
    setAppliedFrom(from);
    setAppliedTo(to);
    setPreset('custom');
    fetchOrders(from, to);
  };

  const handleCancel = async (id: number) => {
    if (!confirm('¿Cancelar este pedido?')) return;
    try {
      await api.delete(`/api/orders/${id}`);
      const range = preset === 'custom' ? { from: appliedFrom, to: appliedTo } : getPresetRange(preset);
      await fetchOrders(range.from, range.to);
      setDetailOpen(false);
    } catch (err) {
      console.error('Error al cancelar pedido:', err);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatusId) return;
    setUpdatingStatus(true);
    try {
      await api.put(`/api/orders/${selectedOrder.id}/status`, {
        orderStatusId: Number(newStatusId),
      });
      setStatusOpen(false);
      setNewStatusId('');
      const range = preset === 'custom' ? { from: appliedFrom, to: appliedTo } : getPresetRange(preset);
      await fetchOrders(range.from, range.to);
      const res = await api.get(`/api/orders/${selectedOrder.id}`);
      setSelectedOrder(res.data);
    } catch (err) {
      console.error('Error al actualizar estado:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

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

  /* Filtered + paginated */
  const filteredOrders = useMemo(
    () => (statusFilter ? orders.filter((o) => o.orderStatusName === statusFilter) : orders),
    [orders, statusFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageOrders = filteredOrders.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  /* Reset page when filter changes */
  useEffect(() => { setPage(1); }, [statusFilter, orders]);

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Pedidos" />
        <main className="flex-1 overflow-y-auto p-6">
          {/* ───── Filter bar ───── */}
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 mb-6">
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

              <div>
                <label className="block text-xs text-muted-foreground mb-1 font-medium">Estado</label>
                <select
                  className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-foreground"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Todos</option>
                  {STATUS_OPTIONS.filter(Boolean).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {preset !== 'custom' && (
                <div className="text-xs text-muted-foreground ml-auto self-center">
                  {appliedFrom.toLocaleDateString()} — {appliedTo.toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Pedidos {statusFilter ? `(${statusFilter})` : ''}
              <span className="text-sm text-muted-foreground font-normal ml-2">({filteredOrders.length})</span>
            </h2>
            <Button size="sm" variant="outline" onClick={() => {
              const range = preset === 'custom' ? { from: appliedFrom, to: appliedTo } : getPresetRange(preset);
              fetchOrders(range.from, range.to);
            }}>
              Refrescar
            </Button>
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground py-8">Cargando pedidos...</p>
          ) : pageOrders.length === 0 ? (
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
                    <th className="py-3 px-4 font-medium">Creado</th>
                    <th className="py-3 px-4 font-medium">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {pageOrders.map((o) => (
                    <tr key={o.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="py-3 px-4 text-foreground font-medium">#{o.dailyOrderNumber ?? o.id}</td>
                      <td className="py-3 px-4 text-muted-foreground">{o.orderTypeName}</td>
                      <td className="py-3 px-4">
                        <Badge variant={STATUS_BADGE[o.orderStatusName] || 'secondary'}>
                          {o.orderStatusName}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{totalItems(o.items)}</td>
                      <td className="py-3 px-4 text-foreground">${Number(o.total).toLocaleString()}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(o.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <Button size="sm" variant="outline" onClick={() => openDetail(o)}>
                          Detalle
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* ───── Pagination ───── */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 text-sm">
                  <span className="text-muted-foreground">
                    Página {safePage} de {totalPages} ({filteredOrders.length} resultados)
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={safePage <= 1} onClick={() => setPage((p) => p - 1)}>
                      Anterior
                    </Button>
                    <Button size="sm" variant="outline" disabled={safePage >= totalPages} onClick={() => setPage((p) => p + 1)}>
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* DETAIL DIALOG */}
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

              <div className="flex justify-between gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setNewStatusId('');
                    setStatusOpen(true);
                  }}
                >
                  Actualizar estado
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleCancel(selectedOrder.id)}
                >
                  Cancelar pedido
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* STATUS UPDATE DIALOG */}
      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent className="sm:max-w-xs bg-card text-foreground">
          <DialogHeader>
            <DialogTitle>Actualizar estado</DialogTitle>
            <DialogDescription>Pedido #{selectedOrder?.dailyOrderNumber ?? selectedOrder?.id}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-muted-foreground">
                Nuevo estado (ID)
              </label>
              <input
                type="number"
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground"
                value={newStatusId}
                onChange={(e) => setNewStatusId(e.target.value)}
                placeholder="1, 2, 3..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Consulta los IDs de estado disponibles en la base de datos
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStatusOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateStatus} disabled={!newStatusId || updatingStatus}>
                {updatingStatus ? 'Actualizando...' : 'Actualizar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
