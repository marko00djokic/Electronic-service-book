import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Vehicles from './pages/Vehicles'
import Owners from './pages/Owners'
import ServiceOrders from './pages/ServiceOrders'
import Catalog from './pages/Catalog'
import Reminders from './pages/Reminders'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="owners" element={<Owners />} />
          <Route path="service-orders" element={<ServiceOrders />} />
          <Route path="catalog" element={<Catalog />} />
          <Route path="reminders" element={<Reminders />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
