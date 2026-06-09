import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const links = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/pos', label: 'POS', icon: '🛒' },
  { to: '/orders', label: 'Pedidos', icon: '📋' },
  { to: '/kitchen', label: 'Cocina', icon: '🍳' },
  { to: '/inventory', label: 'Inventario', icon: '📦' },
  { to: '/employees', label: 'Empleados', icon: '👥' },
  { to: '/customers', label: 'Clientes', icon: '👤' },
  { to: '/suppliers', label: 'Proveedores', icon: '🏭' },
  { to: '/reports', label: 'Reportes', icon: '📈' },
];

export function Sidebar() {
  const { employee, logout } = useAuthStore();

  return (
    <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col h-screen">
      <div className="p-5 border-b border-slate-700">
        <h1 className="text-xl font-bold text-blue-500">Gastrosoftware</h1>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700'
              }`
            }
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <p className="text-sm font-medium text-slate-200 truncate">
          {employee?.fullName}
        </p>
        <p className="text-xs text-slate-400 capitalize">{employee?.role?.toLowerCase()}</p>
        <button
          onClick={logout}
          className="mt-2 w-full text-sm text-red-400 hover:text-red-300 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
