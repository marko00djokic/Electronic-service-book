  import { HashRouter, Routes, Route } from 'react-router-dom'
  import Layout from './components/layout/Layout'
  import Dashboard from './pages/Dashboard'
  import ServiceOrders from './pages/ServiceOrders'
  import Catalog from './pages/Catalog'
  import Reminders from './pages/Reminders'
  import VehicleList from './pages/vehicles/VehicleList'
  import VehicleForm from './pages/vehicles/VehicleForm'
  import VehicleDetail from './pages/vehicles/VehicleDetail'
  import OwnerList from './pages/owners/OwnerList'
  import OwnerForm from './pages/owners/OwnerForm'
  import OwnerDetail from './pages/owners/OwnerDetail'

  export default function App() {
    return (
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />

            <Route path="vehicles" element={<VehicleList />} />
            <Route path="vehicles/new" element={<VehicleForm />} />
            <Route path="vehicles/:id" element={<VehicleDetail />} />
            <Route path="vehicles/:id/edit" element={<VehicleForm />} />

            <Route path="owners" element={<OwnerList />} />
            <Route path="owners/new" element={<OwnerForm />} />
            <Route path="owners/:id" element={<OwnerDetail />} />
            <Route path="owners/:id/edit" element={<OwnerForm />} />

            <Route path="service-orders" element={<ServiceOrders />} />
            <Route path="catalog" element={<Catalog />} />
            <Route path="reminders" element={<Reminders />} />
          </Route>
        </Routes>
      </HashRouter>
    )
  }