import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  HardHat,
  Calendar,
  FileText,
  AlertTriangle,
  MessageSquareWarning,
  ShieldCheck,
  Flag,
  FolderOpen,
  Settings,
  Heart,
  ChevronLeft,
  Receipt,
  Bot,
  ClipboardList,
  Target,
  Bell,
  MessageCircle,
  HandHeart,
  ShieldAlert,
  FileSignature,
  Library,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const navGroups = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'People',
    items: [
      { to: '/participants', icon: Users, label: 'Participants' },
      { to: '/workers', icon: HardHat, label: 'Workers' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/calendar', icon: Calendar, label: 'Calendar' },
      { to: '/goals', icon: Target, label: 'Goals' },
      { to: '/progress-notes', icon: FileText, label: 'Progress Notes' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/service-agreements', icon: FileSignature, label: 'Agreements' },
      { to: '/invoices', icon: Receipt, label: 'Invoices' },
    ],
  },
  {
    label: 'Quality',
    items: [
      { to: '/incidents', icon: AlertTriangle, label: 'Incidents' },
      { to: '/complaints', icon: MessageSquareWarning, label: 'Complaints' },
      { to: '/concerns', icon: Flag, label: 'Concerns' },
      { to: '/compliance', icon: ShieldCheck, label: 'Compliance' },
      { to: '/consent', icon: HandHeart, label: 'Consent & Rights' },
      { to: '/risks', icon: ShieldAlert, label: 'Risk Register' },
    ],
  },
  {
    label: 'Communication',
    items: [
      { to: '/notifications', icon: Bell, label: 'Notifications' },
      { to: '/messages', icon: MessageCircle, label: 'Messages' },
    ],
  },
  {
    label: 'AI',
    items: [
      { to: '/ai-buddy', icon: Bot, label: 'AI Buddy' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/policies', icon: Library, label: 'Policy Library' },
      { to: '/audit', icon: ClipboardList, label: 'Audit Trail' },
      { to: '/documents', icon: FolderOpen, label: 'Documents' },
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
]

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r bg-sidebar transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-14 items-center justify-between border-b px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Hope OS</span>
          </div>
        )}
        {collapsed && (
          <Heart className="h-6 w-6 text-primary mx-auto" />
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn('h-8 w-8', collapsed && 'mx-auto')}
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-3.5rem)]">
        <nav className="p-2 space-y-1">
          {navGroups.map((group, gi) => (
            <div key={group.label}>
              {gi > 0 && <Separator className="my-2" />}
              {!collapsed && (
                <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground',
                      collapsed && 'justify-center px-0'
                    )
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  )
}
