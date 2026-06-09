import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Sidebar } from '../../components/layout/Sidebar';
import { Header } from '../../components/layout/Header';

const cards = [
  { label: 'Pedidos activos', key: 'activeOrders', color: 'text-blue-400' },
  { label: 'Productos', key: 'products', color: 'text-green-400' },
  { label: 'Empleados', key: 'employees', color: 'text-yellow-400' },
  { label: 'Stock bajo', key: 'lowStock', color: 'text-red-400' },
];

export default function DashboardPage() {
  const employee = useAuthStore((s) => s.employee);

  const { data: counts } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const [ordersRes, productsRes, employeesRes, stockRes] = await Promise.allSettled([
        api.get('/api/orders'),
        api.get('/api/products'),
        api.get('/api/employees'),
        api.get('/api/inventory/low-stock'),
      ]);
      return {
        activeOrders: ordersRes.status === 'fulfilled' ? ordersRes.value.data.length : 0,
        products: productsRes.status === 'fulfilled' ? productsRes.value.data.length : 0,
        employees: employeesRes.status === 'fulfilled' ? employeesRes.value.data.length : 0,
        lowStock: stockRes.status === 'fulfilled' ? stockRes.value.data.length : 0,
      };
    },
    refetchInterval: 30000,
  });

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Dashboard" />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <h2 className="text-2xl font-semibold text-slate-100">
            Bienvenido, {employee?.fullName}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card) => (
              <div
                key={card.key}
                className="bg-slate-800 rounded-xl p-5 border border-slate-700"
              >
                <p className="text-sm text-slate-400">{card.label}</p>
                <p className={`text-3xl font-bold mt-1 ${card.color}`}>
                  {counts?.[card.key as keyof typeof counts] ?? '—'}
                </p>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
