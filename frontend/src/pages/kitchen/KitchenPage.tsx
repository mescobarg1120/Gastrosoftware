import { useState, useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Sidebar } from '../../components/layout/Sidebar';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

interface OrderItemResponse {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
}

interface OrderResponse {
  id: number;
  dailyOrderNumber?: number;
  orderTypeName: string;
  orderStatusId: number;
  orderStatusName: string;
  orderStatusColor: string;
  branchId: number;
  createdAt: string;
  items: OrderItemResponse[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500',
  IN_PROGRESS: 'bg-blue-500',
  READY: 'bg-purple-500',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'Preparando',
  READY: 'Listo',
};

function TicketCard({
  ticket,
  onUpdateStatus,
}: {
  ticket: OrderResponse;
  onUpdateStatus: (id: number, statusId: number) => void;
}) {
  const elapsed = Math.floor(
    (Date.now() - new Date(ticket.createdAt).getTime()) / 60000
  );
  const elapsedText =
    elapsed < 1 ? '< 1 min' : `hace ${elapsed} min`;

  const isDone = ticket.orderStatusName === 'READY';

  return (
    <Card
      className={`relative overflow-hidden ${isDone ? 'opacity-60' : ''}`}
    >
      <div
        className={`h-1 ${STATUS_COLORS[ticket.orderStatusName] || 'bg-slate-500'}`}
      />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
              <h3 className="text-lg font-bold text-foreground">
                #{ticket.dailyOrderNumber ?? ticket.id}
              </h3>
            <p className="text-xs text-muted-foreground">
              {ticket.orderTypeName} · {elapsedText}
            </p>
          </div>
          <Badge
            className={`${STATUS_COLORS[ticket.orderStatusName] || 'bg-slate-500'} text-white border-0`}
          >
            {STATUS_LABELS[ticket.orderStatusName] || ticket.orderStatusName}
          </Badge>
        </div>

        <Separator />

        <div className="space-y-1">
          {ticket.items?.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-foreground">
                <span className="font-semibold text-muted-foreground mr-1">
                  {item.quantity}x
                </span>
                {item.productName}
              </span>
            </div>
          ))}
          {(!ticket.items || ticket.items.length === 0) && (
            <p className="text-sm text-muted-foreground">Sin ítems</p>
          )}
        </div>

        {!isDone && (
          <div className="pt-1">
            {ticket.orderStatusName === 'PENDING' && (
              <Button
                size="sm"
                className="w-full"
                onClick={() => onUpdateStatus(ticket.id, 2)}
              >
                Iniciar
              </Button>
            )}
            {ticket.orderStatusName === 'IN_PROGRESS' && (
              <Button
                size="sm"
                variant="secondary"
                className="w-full"
                onClick={() => onUpdateStatus(ticket.id, 3)}
              >
                Listo
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export default function KitchenPage() {
  const { employee } = useAuthStore();
  const [tickets, setTickets] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const stompRef = useRef<Client | null>(null);

  const fetchTickets = useCallback(async () => {
    if (!employee?.branchId) return;
    try {
      const res = await api.get(`/api/orders/branch/${employee.branchId}/active`);
      setTickets(res.data ?? []);
    } catch (err) {
      console.error('Error al cargar tickets:', err);
    } finally {
      setLoading(false);
    }
  }, [employee?.branchId]);

  const updateStatus = async (orderId: number, statusId: number) => {
    console.log(`▶️ updateStatus llamado — orderId: ${orderId}, statusId: ${statusId}`);
    try {
      const response = await api.put(`/api/orders/${orderId}/status`, { orderStatusId: statusId });
      console.log('✅ PUT exitoso — status:', response.status, 'data:', response.data);
      setTickets((prev) =>
        prev.map((t) =>
          t.id === orderId
            ? {
                ...t,
                orderStatusId: statusId,
                orderStatusName:
                  statusId === 2 ? 'IN_PROGRESS' : statusId === 3 ? 'READY' : t.orderStatusName,
                orderStatusColor:
                  statusId === 2 ? '#3B82F6' : statusId === 3 ? '#8B5CF6' : t.orderStatusColor,
              }
            : t
        )
      );
    } catch (err: any) {
      console.error('❌ Error al actualizar estado:', err);
    }
  };

  /* WebSocket connection */
  useEffect(() => {
    if (!employee?.branchId) return;

    fetchTickets();
    setConnectionStatus('connecting');

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        setConnectionStatus('connected');
        client.subscribe(`/topic/kitchen/${employee.branchId}`, (message) => {
          try {
            const updated: OrderResponse = JSON.parse(message.body);
            setTickets((prev) => {
              const idx = prev.findIndex((t) => t.id === updated.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = updated;
                return next;
              }
              return [updated, ...prev];
            });
          } catch (e) {
            console.error('Error parsing WebSocket message:', e);
          }
        });
      },
      onDisconnect: () => {
        setConnectionStatus('disconnected');
      },
      onStompError: () => {
        setConnectionStatus('disconnected');
      },
    });

    client.activate();
    stompRef.current = client;

    return () => {
      client.deactivate();
      stompRef.current = null;
    };
  }, [employee?.branchId, fetchTickets]);

  const pendingCount = tickets.filter(
    (t) => t.orderStatusName === 'PENDING' || t.orderStatusName === 'IN_PROGRESS'
  ).length;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between bg-card border-b px-6 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-foreground">Cocina</h1>
            <Badge variant="secondary">{pendingCount} pendientes</Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs">
              <span
                className={`inline-block size-2 rounded-full ${
                  connectionStatus === 'connected'
                    ? 'bg-green-500'
                    : connectionStatus === 'connecting'
                    ? 'bg-yellow-500 animate-pulse'
                    : 'bg-red-500'
                }`}
              />
              {connectionStatus === 'connected'
                ? 'Conectado'
                : connectionStatus === 'connecting'
                ? 'Conectando...'
                : 'Desconectado'}
            </span>
            <Button size="sm" variant="outline" onClick={fetchTickets}>
              Refrescar
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-center text-muted-foreground py-12">Cargando tickets...</p>
          ) : tickets.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No hay tickets activos</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {tickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onUpdateStatus={updateStatus}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
