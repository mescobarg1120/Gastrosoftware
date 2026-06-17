import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Sidebar } from '../../components/layout/Sidebar';
import { Header } from '../../components/layout/Header';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import type { Order } from '../../types';

interface SummaryData {
  salesToday: number;
  completedOrders: number;
  avgTicket: number;
  lowStockAlerts: number;
}

export default function ReportsPage() {
  const { employee } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [ordersRes, stockRes] = await Promise.allSettled([
          api.get(`/api/orders/branch/${employee?.branchId}/active`),
          api.get(`/api/inventory/branch/${employee?.branchId}/low-stock`),
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
    };
    fetch();
  }, [employee?.branchId]);

  const summary: SummaryData = {
    salesToday: orders.filter((o) => o.orderStatusName === 'DELIVERED').reduce((sum, o) => sum + o.total, 0),
    completedOrders: orders.filter((o) => o.orderStatusName === 'DELIVERED').length,
    avgTicket: (() => {
      const delivered = orders.filter((o) => o.orderStatusName === 'DELIVERED');
      return delivered.length > 0
        ? Math.round(delivered.reduce((s, o) => s + o.total, 0) / delivered.length)
        : 0;
    })(),
    lowStockAlerts: lowStockCount,
  };

  const cards = [
    { label: 'Ventas del día', value: `$${summary.salesToday.toLocaleString()}`, color: 'text-green-400' },
    { label: 'Pedidos completados', value: summary.completedOrders, color: 'text-blue-400' },
    { label: 'Ticket promedio', value: `$${summary.avgTicket.toLocaleString()}`, color: 'text-yellow-400' },
    { label: 'Alertas de stock bajo', value: summary.lowStockAlerts, color: 'text-red-400' },
  ];

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Reportes" />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
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

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Últimos pedidos</h2>
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
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                        <td className="py-3 px-4 text-foreground font-medium">#{o.id}</td>
                        <td className="py-3 px-4 text-muted-foreground">{o.orderTypeName}</td>
                        <td className="py-3 px-4">
                          <Badge variant={o.orderStatusName === 'DELIVERED' ? 'default' : 'secondary'}>
                            {o.orderStatusName}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{o.items?.length ?? 0}</td>
                        <td className="py-3 px-4 text-foreground">${o.total.toLocaleString()}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(o.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
