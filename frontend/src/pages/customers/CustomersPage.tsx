import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Sidebar } from '../../components/layout/Sidebar';
import { Header } from '../../components/layout/Header';
import api from '../../services/api';
import type { CustomerResponse, CreateCustomerRequest } from '../../types';

interface CustomerForm {
  fullName: string;
  phone: string;
  email: string;
}

const emptyForm: CustomerForm = { fullName: '', phone: '', email: '' };

const TIER_COLORS: Record<string, string> = {
  NORMAL: 'bg-slate-500',
  SILVER: 'bg-gray-400',
  GOLD: 'bg-yellow-500',
  VIP: 'bg-purple-500',
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchPhone, setSearchPhone] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/api/customers');
      setCustomers(res.data ?? []);
    } catch (err) {
      console.error('Error al cargar clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearchByPhone = async () => {
    if (!searchPhone.trim()) {
      await fetchCustomers();
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/api/customers/phone/${searchPhone.trim()}`);
      setCustomers(res.data ? [res.data] : []);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.fullName || !form.phone) return;
    setSubmitting(true);
    try {
      const body: CreateCustomerRequest = {
        fullName: form.fullName,
        phone: form.phone,
        email: form.email || undefined,
      };
      await api.post('/api/customers', body);
      setDialogOpen(false);
      setForm(emptyForm);
      await fetchCustomers();
    } catch (err) {
      console.error('Error al crear cliente:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Clientes" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
            <div className="flex gap-2 items-center">
              <input
                placeholder="Buscar por teléfono..."
                className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground w-64"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchByPhone()}
              />
              <Button size="sm" variant="outline" onClick={handleSearchByPhone}>
                Buscar
              </Button>
              {searchPhone && (
                <Button size="sm" variant="ghost" onClick={() => { setSearchPhone(''); fetchCustomers(); }}>
                  Limpiar
                </Button>
              )}
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">Nuevo cliente</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-card text-foreground">
                <DialogHeader>
                  <DialogTitle>Nuevo cliente</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre completo</label>
                    <input
                      className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground"
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Teléfono</label>
                    <input
                      className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreate} disabled={submitting}>
                      {submitting ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground py-8">Cargando clientes...</p>
          ) : customers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No hay clientes</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-left text-muted-foreground">
                    <th className="py-3 px-4 font-medium">Nombre</th>
                    <th className="py-3 px-4 font-medium">Teléfono</th>
                    <th className="py-3 px-4 font-medium">Email</th>
                    <th className="py-3 px-4 font-medium">Tier</th>
                    <th className="py-3 px-4 font-medium">Total pedidos</th>
                    <th className="py-3 px-4 font-medium">Total gastado</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="py-3 px-4 text-foreground font-medium">{c.fullName}</td>
                      <td className="py-3 px-4 text-muted-foreground">{c.phone}</td>
                      <td className="py-3 px-4 text-muted-foreground">{c.email ?? '—'}</td>
                      <td className="py-3 px-4">
                        <Badge
                          className={`${TIER_COLORS[c.loyaltyTier] || 'bg-slate-500'} text-white border-0`}
                        >
                          {c.loyaltyTier}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-foreground">{c.totalOrders}</td>
                      <td className="py-3 px-4 text-foreground">${Number(c.totalSpent).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
