import { Sidebar } from '../../components/layout/Sidebar';
import { Header } from '../../components/layout/Header';

export default function EmployeesPage() {
  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Empleados" />
        <main className="flex-1 flex items-center justify-center text-slate-400">
          <p className="text-lg">Módulo Empleados — próximamente</p>
        </main>
      </div>
    </div>
  );
}
