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
import { useAuthStore } from '../../store/authStore';
import type { EmployeeResponse, CreateEmployeeRequest } from '../../types';

interface Role { id: number; name: string }

interface EmployeeForm {
  fullName: string;
  rut: string;
  email: string;
  password: string;
  roleId: string;
}

const emptyForm: EmployeeForm = {
  fullName: '',
  rut: '',
  email: '',
  password: '',
  roleId: '',
};

export default function EmployeesPage() {
  const { employee } = useAuthStore();
  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);

  const fetchEmployees = async () => {
    if (!employee?.branchId) return;
    try {
      const res = await api.get(`/api/employees/branch/${employee.branchId}`);
      setEmployees(res.data ?? []);
    } catch (err) {
      console.error('Error al cargar empleados:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try { const res = await api.get('/api/roles'); setRoles(res.data ?? []); }
    catch (err) { console.error('Error al cargar roles:', err); }
  };

  useEffect(() => { fetchEmployees(); fetchRoles(); }, [employee?.branchId]);

  const handleCreate = async () => {
    if (!form.fullName || !form.rut || !form.email || !form.password || !form.roleId) return;
    setSubmitting(true);
    try {
      const body: CreateEmployeeRequest = {
        branchId: employee!.branchId,
        roleId: Number(form.roleId),
        fullName: form.fullName,
        rut: form.rut,
        email: form.email,
        password: form.password,
      };
      await api.post('/api/employees', body);
      setDialogOpen(false);
      setForm(emptyForm);
      await fetchEmployees();
    } catch (err) {
      console.error('Error al crear empleado:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: number, currentActive: boolean) => {
    try {
      if (currentActive) {
        await api.patch(`/api/employees/${id}/deactivate`);
      } else {
        await api.patch(`/api/employees/${id}/activate`);
      }
      setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, active: !currentActive } : e)));
    } catch (err) {
      console.error('Error al cambiar estado del empleado:', err);
    }
  };

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Empleados" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Empleados</h2>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">Nuevo empleado</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-card text-foreground">
                <DialogHeader>
                  <DialogTitle>Nuevo empleado</DialogTitle>
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
                    <label className="block text-sm font-medium mb-1">RUT</label>
                    <input
                      className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground"
                      value={form.rut}
                      onChange={(e) => setForm({ ...form, rut: e.target.value })}
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
                  <div>
                    <label className="block text-sm font-medium mb-1">Contraseña</label>
                    <input
                      type="password"
                      className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Rol</label>
                    <select
                      className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground"
                      value={form.roleId}
                      onChange={(e) => setForm({ ...form, roleId: e.target.value })}
                    >
                      <option value="">Seleccionar...</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
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
            <p className="text-center text-muted-foreground py-8">Cargando empleados...</p>
          ) : employees.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No hay empleados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-left text-muted-foreground">
                    <th className="py-3 px-4 font-medium">Nombre</th>
                    <th className="py-3 px-4 font-medium">RUT</th>
                    <th className="py-3 px-4 font-medium">Email</th>
                    <th className="py-3 px-4 font-medium">Rol</th>
                    <th className="py-3 px-4 font-medium">Activo</th>
                    <th className="py-3 px-4 font-medium">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((e) => (
                    <tr key={e.id} className={`border-b border-slate-800 hover:bg-slate-800/50 ${!e.active ? 'opacity-50' : ''}`}>
                      <td className={`py-3 px-4 font-medium ${e.active ? 'text-foreground' : 'text-muted-foreground'}`}>{e.fullName}</td>
                      <td className="py-3 px-4 text-muted-foreground">{e.rut}</td>
                      <td className="py-3 px-4 text-muted-foreground">{e.email}</td>
                      <td className="py-3 px-4 text-muted-foreground">{e.role}</td>
                      <td className="py-3 px-4">
                        <Badge variant={e.active ? 'default' : 'secondary'}>
                          {e.active ? 'Sí' : 'No'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          size="sm"
                          variant={e.active ? 'outline' : 'secondary'}
                          onClick={() => handleToggleStatus(e.id, e.active)}
                        >
                          {e.active ? 'Desactivar' : 'Activar'}
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
    </div>
  );
}
