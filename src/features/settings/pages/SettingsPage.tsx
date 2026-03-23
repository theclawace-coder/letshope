import { useState, useEffect } from 'react'
import { useDigestPreferences, useUpsertDigestPreferences } from '../hooks/useDigestPreferences'
import {
  useNotificationPreferences,
  useUpsertNotificationPreference,
} from '@/features/notifications/hooks/useNotifications'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Mail, Save, Bell } from 'lucide-react'

const DAYS = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
]

const TIMES = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00',
  '09:30', '10:00', '12:00', '14:00', '16:00', '18:00',
]

const NOTIFICATION_CATEGORIES = [
  { value: 'incident', label: 'Incidents', description: 'New incidents and status changes' },
  { value: 'complaint', label: 'Complaints', description: 'New complaints and deadline alerts' },
  { value: 'concern', label: 'Concerns', description: 'Flagged concerns and updates' },
  { value: 'booking', label: 'Bookings', description: 'Booking confirmations and cancellations' },
  { value: 'invoice', label: 'Invoices', description: 'Invoice status changes and rejections' },
  { value: 'compliance', label: 'Compliance', description: 'Expiring screenings and certifications' },
  { value: 'goal', label: 'Goals', description: 'Goal progress and review reminders' },
  { value: 'portal', label: 'Portal', description: 'Portal access and activity alerts' },
  { value: 'message', label: 'Messages', description: 'New messages from staff' },
  { value: 'system', label: 'System', description: 'System updates and announcements' },
] as const

type NotifCategory = (typeof NOTIFICATION_CATEGORIES)[number]['value']

export function SettingsPage() {
  const { data: prefs, isLoading } = useDigestPreferences()
  const upsert = useUpsertDigestPreferences()
  const { data: notifPrefs = [], isLoading: notifLoading } = useNotificationPreferences()
  const upsertNotifPref = useUpsertNotificationPreference()

  const [frequency, setFrequency] = useState<string>('daily')
  const [includeIncidents, setIncludeIncidents] = useState(true)
  const [includeComplaints, setIncludeComplaints] = useState(true)
  const [includeCompliance, setIncludeCompliance] = useState(true)
  const [includeInvoices, setIncludeInvoices] = useState(true)
  const [includeOverdue, setIncludeOverdue] = useState(true)
  const [preferredTime, setPreferredTime] = useState('07:00')
  const [preferredDay, setPreferredDay] = useState('1')

  useEffect(() => {
    if (prefs) {
      setFrequency(prefs.frequency)
      setIncludeIncidents(prefs.include_incidents)
      setIncludeComplaints(prefs.include_complaints)
      setIncludeCompliance(prefs.include_compliance)
      setIncludeInvoices(prefs.include_invoices)
      setIncludeOverdue(prefs.include_overdue)
      setPreferredTime(prefs.preferred_time)
      setPreferredDay(String(prefs.preferred_day))
    }
  }, [prefs])

  function handleSave() {
    upsert.mutate({
      frequency: frequency as 'daily' | 'weekly' | 'off',
      digest_enabled: frequency !== 'off',
      include_incidents: includeIncidents,
      include_complaints: includeComplaints,
      include_compliance: includeCompliance,
      include_invoices: includeInvoices,
      include_overdue: includeOverdue,
      preferred_time: preferredTime,
      preferred_day: parseInt(preferredDay),
    })
  }

  function getNotifPref(cat: NotifCategory) {
    return notifPrefs.find((p) => p.category === cat)
  }

  function toggleInApp(cat: NotifCategory, enabled: boolean) {
    upsertNotifPref.mutate({
      category: cat,
      in_app_enabled: enabled,
    })
  }

  function toggleEmail(cat: NotifCategory, enabled: boolean) {
    upsertNotifPref.mutate({
      category: cat,
      email_enabled: enabled,
    })
  }

  if (isLoading || notifLoading) return <LoadingState />

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your notification and digest preferences."
      />

      <div className="max-w-2xl space-y-6">
        {/* In-app notification preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Choose which in-app and email notifications you receive for each category.
            </p>

            <div className="space-y-1">
              <div className="grid grid-cols-[1fr,80px,80px] gap-2 px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <span>Category</span>
                <span className="text-center">In-App</span>
                <span className="text-center">Email</span>
              </div>

              {NOTIFICATION_CATEGORIES.map((cat) => {
                const pref = getNotifPref(cat.value)
                return (
                  <div
                    key={cat.value}
                    className="grid grid-cols-[1fr,80px,80px] gap-2 items-center px-2 py-2 rounded hover:bg-muted/50"
                  >
                    <div>
                      <p className="text-sm font-medium">{cat.label}</p>
                      <p className="text-xs text-muted-foreground">{cat.description}</p>
                    </div>
                    <div className="flex justify-center">
                      <Switch
                        checked={pref?.in_app_enabled ?? true}
                        onCheckedChange={(v) => toggleInApp(cat.value, v)}
                      />
                    </div>
                    <div className="flex justify-center">
                      <Switch
                        checked={pref?.email_enabled ?? false}
                        onCheckedChange={(v) => toggleEmail(cat.value, v)}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Email digest (existing) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5" />
              Email Digest
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v ?? 'daily')}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="off">Off</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Receive a summary of important activity via email.
              </p>
            </div>

            {frequency !== 'off' && (
              <>
                <div className="flex gap-4 flex-wrap">
                  <div className="space-y-2">
                    <Label>Delivery time</Label>
                    <Select value={preferredTime} onValueChange={(v) => setPreferredTime(v ?? '07:00')}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {frequency === 'weekly' && (
                    <div className="space-y-2">
                      <Label>Delivery day</Label>
                      <Select value={preferredDay} onValueChange={(v) => setPreferredDay(v ?? '1')}>
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS.map((d) => (
                            <SelectItem key={d.value} value={d.value}>
                              {d.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <Label className="text-base">Include in digest</Label>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="inc-incidents" className="font-normal">
                      Open incidents & reportable alerts
                    </Label>
                    <Switch id="inc-incidents" checked={includeIncidents} onCheckedChange={setIncludeIncidents} />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="inc-complaints" className="font-normal">
                      Complaints & acknowledgment deadlines
                    </Label>
                    <Switch id="inc-complaints" checked={includeComplaints} onCheckedChange={setIncludeComplaints} />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="inc-compliance" className="font-normal">
                      Expiring worker screenings (WWCC, Police)
                    </Label>
                    <Switch id="inc-compliance" checked={includeCompliance} onCheckedChange={setIncludeCompliance} />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="inc-invoices" className="font-normal">
                      Draft & rejected invoices
                    </Label>
                    <Switch id="inc-invoices" checked={includeInvoices} onCheckedChange={setIncludeInvoices} />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="inc-overdue" className="font-normal">
                      Overdue items summary
                    </Label>
                    <Switch id="inc-overdue" checked={includeOverdue} onCheckedChange={setIncludeOverdue} />
                  </div>
                </div>
              </>
            )}

            <Button onClick={handleSave} disabled={upsert.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {upsert.isPending ? 'Saving...' : 'Save Preferences'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
