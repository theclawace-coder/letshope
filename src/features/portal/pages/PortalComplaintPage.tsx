import { useState } from 'react'
import { usePortalAuth } from '../hooks/usePortal'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MessageSquareWarning, Send, CheckCircle2, Phone, Info } from 'lucide-react'
import { toast } from 'sonner'

const COMPLAINT_CATEGORIES = [
  'Service quality',
  'Worker conduct',
  'Communication',
  'Billing / invoicing',
  'Scheduling',
  'Safety concern',
  'Privacy',
  'Other',
]

export function PortalComplaintPage() {
  const { session } = usePortalAuth()
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [contactPreference, setContactPreference] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!session || !description.trim()) return

    setSubmitting(true)
    try {
      const now = new Date().toISOString().split('T')[0]
      const acknowledgeDeadline = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const resolutionDeadline = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const { error } = await supabase.from('complaints').insert({
        participant_id: session.participantId,
        complainant_name: session.name,
        complainant_relationship: session.relationship ?? session.role,
        complaint_date: now,
        description: description.trim() + (contactPreference ? `\n\nPreferred contact: ${contactPreference}` : ''),
        category: category || null,
        acknowledge_deadline: acknowledgeDeadline,
        resolution_deadline: resolutionDeadline,
        status: 'received',
        submitted_via_portal: true,
        portal_submitter_name: session.name,
        portal_submitter_email: session.email,
        portal_submitter_relationship: session.relationship ?? session.role,
      } as never)

      if (error) throw error

      setSubmitted(true)
      toast.success('Your feedback has been submitted')
    } catch {
      toast.error('Unable to submit. Please try again or call us directly.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-8 space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold">Thank you for your feedback</h2>
              <p className="text-muted-foreground max-w-md">
                We have received your submission and will acknowledge it within 2 business days.
                Our team will work to resolve this within 21 days per NDIS requirements.
              </p>
              <p className="text-sm text-muted-foreground">
                If this is urgent, please call Erfan on <strong>0405 092 779</strong>.
              </p>
              <Button variant="outline" onClick={() => {
                setSubmitted(false)
                setDescription('')
                setCategory('')
                setContactPreference('')
              }}>
                Submit another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquareWarning className="h-6 w-6" />
          Feedback & Complaints
        </h1>
        <p className="text-muted-foreground mt-1">
          We value your feedback. All complaints are taken seriously and handled per our complaints policy.
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          We will acknowledge your complaint within <strong>2 business days</strong> and work to resolve it
          within <strong>21 days</strong>. You can also contact the NDIS Quality and Safeguards Commission
          directly on <strong>1800 035 544</strong>.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Submit Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Your Name</Label>
              <Input value={session?.name ?? ''} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v ?? '')}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category..." />
                </SelectTrigger>
                <SelectContent>
                  {COMPLAINT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Tell us what happened *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe your feedback or complaint in detail. Include dates, times, and names if relevant."
                rows={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">How would you like us to contact you?</Label>
              <Input
                id="contact"
                value={contactPreference}
                onChange={(e) => setContactPreference(e.target.value)}
                placeholder="e.g. Phone call, email, in person"
              />
            </div>

            <Button type="submit" disabled={submitting || !description.trim()}>
              <Send className="h-4 w-4 mr-2" />
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Alternative contact methods */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Other ways to contact us
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div className="rounded-lg bg-muted p-3">
              <p className="font-medium">Hope Disability Support</p>
              <p className="text-muted-foreground">Erfan: 0405 092 779</p>
              <p className="text-muted-foreground">erfan@hopedisability.com.au</p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="font-medium">NDIS Commission</p>
              <p className="text-muted-foreground">1800 035 544</p>
              <p className="text-muted-foreground">www.ndiscommission.gov.au</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
