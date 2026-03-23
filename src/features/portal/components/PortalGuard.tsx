import { Navigate, Outlet } from 'react-router-dom'
import { usePortalAuth } from '../hooks/usePortal'

export function PortalGuard() {
  const { session, isLoading } = usePortalAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/portal/login" replace />
  }

  return <Outlet />
}
