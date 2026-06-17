import { useState, useEffect } from 'react';
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

export default function OrdersPage() {
  const { employee } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [newStatusId, setNewStatusId] = useState('');

  const fetchOrders = async () => {
    if (!employee?.branchId) return;
    try {
      const res = await api.get(`/api/orders/branch/${employee.branchId}/active`);
      setOrders(res.data ?? []);
    } catch (err) {
      console.error('Error al cargar pedidos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [employee?.branchId]);

  const handleCancel = async (id: number) => {
    if (!confirm('¿Cancelar este pedido?')) return;
    try {
      await api.delete(`/api/orders/${id}`);
      await fetchOrders();
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
      await fetchOrders();
      // refresh detail
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

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Pedidos" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Pedidos activos</h2>
            <Button size="sm" variant="outline" onClick={fetchOrders}>
              Refrescar
            </Button>
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground py-8">Cargando pedidos...</p>
          ) : orders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No hay pedidos activos</p>
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
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="py-3 px-4 text-foreground font-medium">#{o.id}</td>
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
            </div>
          )}
        </main>
      </div>

      {/* DETAIL DIALOG */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg bg-card text-foreground">
          <DialogHeader>
            <DialogTitle>Pedido #{selectedOrder?.id}</DialogTitle>
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
            <DialogDescription>Pedido #{selectedOrder?.id}</DialogDescription>
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
