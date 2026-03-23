import { Outlet } from 'react-router-dom'
import { Heart, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePortalAuth } from '../hooks/usePortal'

export function PortalShell() {
  const { session, logout } = usePortalAuth()

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
              <Heart className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">Hope OS</h1>
              <p className="text-xs text-muted-foreground">Participant Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{session?.name}</span>
              {session?.relationship && (
                <span className="text-xs">({session.relationship})</span>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-1" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation tabs */}
      <nav className="border-b bg-background">
        <div className="mx-auto max-w-5xl px-4">
          <PortalNav />
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t bg-background mt-auto">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground">Need help? Contact us</p>
              <p>Erfan &middot; 0405 092 779 &middot; erfan@hopedisability.com.au</p>
            </div>
            <div className="text-center sm:text-right">
              <p>NDIS Quality and Safeguards Commission</p>
              <p className="font-medium text-foreground">1800 035 544</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Wallet, FileText, FolderOpen, Calendar, MessageSquareWarning, Target } from 'lucide-react'

const portalNavItems = [
  { to: '/portal', icon: LayoutDashboard, label: 'Home', end: true },
  { to: '/portal/budget', icon: Wallet, label: 'Budget' },
  { to: '/portal/goals', icon: Target, label: 'Goals' },
  { to: '/portal/notes', icon: FileText, label: 'Notes' },
  { to: '/portal/documents', icon: FolderOpen, label: 'Documents' },
  { to: '/portal/bookings', icon: Calendar, label: 'Bookings' },
  { to: '/portal/complaint', icon: MessageSquareWarning, label: 'Feedback' },
]

function PortalNav() {
  return (
    <div className="flex gap-1 overflow-x-auto -mb-px">
      {portalNavItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2 px-3 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
            )
          }
        >
          <item.icon className="h-4 w-4" />
          <span className="hidden sm:inline">{item.label}</span>
        </NavLink>
      ))}
    </div>
  )
}
