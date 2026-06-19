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
import { validateRut, formatRut } from '../../lib/rut';
import type { SupplierResponse, CreateSupplierRequest } from '../../types';

interface SupplierForm {
  legalName: string;
  tradeName: string;
  rut: string;
  address: string;
  leadTimeDays: string;
  deliveryDays: string;
  paymentTerms: string;
}

const emptyForm: SupplierForm = {
  legalName: '',
  tradeName: '',
  rut: '',
  address: '',
  leadTimeDays: '',
  deliveryDays: '',
  paymentTerms: '',
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<SupplierResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<SupplierForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [rutError, setRutError] = useState('');

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/api/suppliers');
      setSuppliers(res.data ?? []);
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleCreate = async () => {
    if (!form.legalName || !form.rut) return;
    if (!validateRut(form.rut)) {
      setRutError('RUT inválido');
      return;
    }
    setSubmitting(true);
    try {
      const body: CreateSupplierRequest = {
        legalName: form.legalName,
        tradeName: form.tradeName || undefined,
        rut: form.rut,
        address: form.address || undefined,
        leadTimeDays: form.leadTimeDays ? Number(form.leadTimeDays) : undefined,
        deliveryDays: form.deliveryDays || undefined,
        paymentTerms: form.paymentTerms || undefined,
      };
      await api.post('/api/suppliers', body);
                      setDialogOpen(false);
                      setForm(emptyForm);
                      setRutError('');
      await fetchSuppliers();
    } catch (err) {
      console.error('Error al crear proveedor:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Proveedores" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Proveedores</h2>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">Nuevo proveedor</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-card text-foreground">
                <DialogHeader>
                  <DialogTitle>Nuevo proveedor</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre legal</label>
                    <input
                      className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground"
                      value={form.legalName}
                      onChange={(e) => setForm({ ...form, legalName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre comercial</label>
                    <input
                      className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground"
                      value={form.tradeName}
                      onChange={(e) => setForm({ ...form, tradeName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">RUT</label>
                    <input
                      className={`w-full bg-slate-800 border rounded-md px-3 py-2 text-sm text-foreground ${rutError ? 'border-red-500' : 'border-slate-700'}`}
                      value={form.rut}
                      onChange={(e) => {
                        setRutError('');
                        setForm({ ...form, rut: formatRut(e.target.value) });
                      }}
                    />
                    {rutError && <p className="text-red-500 text-xs mt-1">{rutError}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Dirección</label>
                    <input
                      className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Días de entrega (lead time)</label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      placeholder="Ej: 2"
                      className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground"
                      value={form.leadTimeDays}
                      onChange={(e) => setForm({ ...form, leadTimeDays: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Días de delivery</label>
                    <input
                      className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground"
                      value={form.deliveryDays}
                      onChange={(e) => setForm({ ...form, deliveryDays: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Términos de pago</label>
                    <input
                      className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground"
                      value={form.paymentTerms}
                      onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
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
            <p className="text-center text-muted-foreground py-8">Cargando proveedores...</p>
          ) : suppliers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No hay proveedores</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-left text-muted-foreground">
                    <th className="py-3 px-4 font-medium">Nombre legal</th>
                    <th className="py-3 px-4 font-medium">Nombre comercial</th>
                    <th className="py-3 px-4 font-medium">RUT</th>
                    <th className="py-3 px-4 font-medium">Activo</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="py-3 px-4 text-foreground font-medium">{s.legalName}</td>
                      <td className="py-3 px-4 text-muted-foreground">{s.tradeName ?? '—'}</td>
                      <td className="py-3 px-4 text-muted-foreground">{s.rut}</td>
                      <td className="py-3 px-4">
                        <Badge variant={s.active ? 'default' : 'secondary'}>
                          {s.active ? 'Sí' : 'No'}
                        </Badge>
                      </td>
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
