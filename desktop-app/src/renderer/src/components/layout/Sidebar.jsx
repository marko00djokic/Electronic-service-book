import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/',               label: 'Dashboard',       end: true },
  { to: '/vehicles',       label: 'Vozila',          end: false },
  { to: '/owners',         label: 'Vlasnici',        end: false },
  { to: '/service-orders', label: 'Servisni nalozi', end: false },
  { to: '/catalog',        label: 'Katalog',         end: false },
  { to: '/reminders',      label: 'Podsetnici',      end: false }
]

export default function Sidebar() {
  return (
    <aside className="w-56 bg-gray-900 text-white flex flex-col flex-shrink-0">
      <div className="px-4 py-5 border-b border-gray-700">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          Servisna knjizica
        </span>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
