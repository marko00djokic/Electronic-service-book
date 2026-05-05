  import { useEffect } from 'react'
  import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom'
  import Layout from './components/layout/Layout'
  import Dashboard from './pages/Dashboard'
  import Reminders from './pages/Reminders'
  import VehicleList from './pages/vehicles/VehicleList'
  import VehicleForm from './pages/vehicles/VehicleForm'
  import VehicleDetail from './pages/vehicles/VehicleDetail'
  import OwnerList from './pages/owners/OwnerList'
  import OwnerForm from './pages/owners/OwnerForm'
  import OwnerDetail from './pages/owners/OwnerDetail'
  import ServiceOrderList from './pages/service-orders/ServiceOrderList'
  import ServiceOrderForm from './pages/service-orders/ServiceOrderForm'
  import ServiceOrderDetail from './pages/service-orders/ServiceOrderDetail'
  import SpecialRecords from './pages/service-orders/SpecialRecords'
  import PartsCatalog from './pages/catalog/PartsCatalog'

  function NotificationNavigator() {
    const navigate = useNavigate()
    useEffect(() => {
      if (!window.electronEvents) return
      window.electronEvents.onNavigate((path) => navigate(path))
      return () => window.electronEvents.removeNavigateListener()
    }, [navigate])
    return null
  }

  export default function App() {
    return (
      <HashRouter>
        <NotificationNavigator />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />

            <Route path="vehicles" element={<VehicleList />} />
            <Route path="vehicles/new" element={<VehicleForm />} />
            <Route path="vehicles/:id" element={<VehicleDetail />} />
            <Route path="vehicles/:id/edit" element={<VehicleForm />} />
            <Route path="vehicles/:id/special" element={<SpecialRecords />} />

            <Route path="owners" element={<OwnerList />} />
            <Route path="owners/new" element={<OwnerForm />} />
            <Route path="owners/:id" element={<OwnerDetail />} />
            <Route path="owners/:id/edit" element={<OwnerForm />} />

            <Route path="service-orders" element={<ServiceOrderList />} />
            <Route path="service-orders/new" element={<ServiceOrderForm />} />
            <Route path="service-orders/:id" element={<ServiceOrderDetail />} />
            <Route path="service-orders/:id/edit" element={<ServiceOrderForm />} />

            <Route path="catalog" element={<PartsCatalog />} />
            <Route path="reminders" element={<Reminders />} />
          </Route>
        </Routes>
      </HashRouter>
    )
  }