import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Bell,
  Check,
  CheckCheck,
  Archive,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow, format } from 'date-fns'
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllRead,
  useArchiveNotification,
} from '../hooks/useNotifications'

const NOTIFICATION_CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'incident', label: 'Incidents' },
  { value: 'complaint', label: 'Complaints' },
  { value: 'concern', label: 'Concerns' },
  { value: 'booking', label: 'Bookings' },
  { value: 'invoice', label: 'Invoices' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'goal', label: 'Goals' },
  { value: 'portal', label: 'Portal' },
  { value: 'message', label: 'Messages' },
  { value: 'system', label: 'System' },
]

const CATEGORY_COLORS: Record<string, string> = {
  incident: 'bg-red-100 text-red-800',
  complaint: 'bg-orange-100 text-orange-800',
  concern: 'bg-yellow-100 text-yellow-800',
  booking: 'bg-blue-100 text-blue-800',
  invoice: 'bg-emerald-100 text-emerald-800',
  compliance: 'bg-purple-100 text-purple-800',
  goal: 'bg-teal-100 text-teal-800',
  portal: 'bg-indigo-100 text-indigo-800',
  message: 'bg-sky-100 text-sky-800',
  system: 'bg-gray-100 text-gray-800',
}

const PRIORITY_BORDER: Record<string, string> = {
  urgent: 'border-l-4 border-l-red-500',
  high: 'border-l-4 border-l-orange-400',
  normal: 'border-l-4 border-l-transparent',
  low: 'border-l-4 border-l-transparent',
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('unread')
  const [category, setCategory] = useState('all')
  const { data: unreadCount = 0 } = useUnreadCount()

  const { data: notifications = [], isLoading } = useNotifications({
    category: category !== 'all' ? category : undefined,
    isRead: tab === 'unread' ? false : tab === 'read' ? true : undefined,
  })

  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllRead()
  const archive = useArchiveNotification()

  function handleClick(notif: (typeof notifications)[0]) {
    if (!notif.is_read) {
      markRead.mutate(notif.id)
    }
    if (notif.action_url) {
      navigate(notif.action_url)
    }
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        description={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
        action={
          unreadCount > 0 ? (
            <Button variant="outline" onClick={() => markAllRead.mutate()}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="unread">
                Unread
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-[10px]">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="read">Read</TabsTrigger>
            </TabsList>
          </Tabs>

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {NOTIFICATION_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications"
            description={
              tab === 'unread'
                ? "You're all caught up!"
                : 'No notifications match this filter.'
            }
          />
        ) : (
          <Card>
            <CardContent className="p-0 divide-y">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    'flex items-start gap-4 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors',
                    !notif.is_read && 'bg-muted/30',
                    PRIORITY_BORDER[notif.priority]
                  )}
                  onClick={() => handleClick(notif)}
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={cn('text-[10px] px-1.5', CATEGORY_COLORS[notif.category])}
                      >
                        {notif.category}
                      </Badge>
                      {notif.priority === 'urgent' && (
                        <Badge variant="destructive" className="text-[10px] px-1.5">
                          Urgent
                        </Badge>
                      )}
                      {notif.priority === 'high' && (
                        <Badge className="text-[10px] px-1.5 bg-orange-100 text-orange-800">
                          High
                        </Badge>
                      )}
                    </div>
                    <p className={cn('text-sm', !notif.is_read && 'font-medium')}>
                      {notif.title}
                    </p>
                    {notif.body && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notif.body}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(notif.created_at), 'dd MMM yyyy h:mm a')} &middot;{' '}
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!notif.is_read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Mark as read"
                        onClick={(e) => {
                          e.stopPropagation()
                          markRead.mutate(notif.id)
                        }}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Archive"
                      onClick={(e) => {
                        e.stopPropagation()
                        archive.mutate(notif.id)
                      }}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
