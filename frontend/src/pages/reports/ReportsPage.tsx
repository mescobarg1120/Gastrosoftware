import { Sidebar } from '../../components/layout/Sidebar';
import { Header } from '../../components/layout/Header';

export default function ReportsPage() {
  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Reportes" />
        <main className="flex-1 flex items-center justify-center text-slate-400">
          <p className="text-lg">Módulo Reportes — próximamente</p>
        </main>
      </div>
    </div>
  );
}
