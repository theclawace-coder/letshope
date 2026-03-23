import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingState } from '@/components/shared/LoadingState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import {
  usePortalTokens,
  useCreatePortalToken,
  useTogglePortalToken,
  useDeletePortalToken,
} from '../hooks/usePortal'
import { useAuth } from '@/providers/AuthProvider'
import { formatDate } from '@/lib/formatters'
import { toast } from 'sonner'
import {
  Globe,
  Plus,
  Copy,
  Trash2,
  ToggleLeft,
  ToggleRight,
  UserCircle,
} from 'lucide-react'

interface PortalAccessManagerProps {
  participantId: string
  participantName: string
}

export function PortalAccessManager({ participantId, participantName }: PortalAccessManagerProps) {
  const { user } = useAuth()
  const { data: tokens, isLoading } = usePortalTokens(participantId)
  const createToken = useCreatePortalToken()
  const toggleToken = useTogglePortalToken()
  const deleteToken = useDeletePortalToken()

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'participant' | 'guardian' | 'support_coordinator'>('participant')
  const [relationship, setRelationship] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return

    try {
      const token = await createToken.mutateAsync({
        participant_id: participantId,
        email: email.trim(),
        name: name.trim(),
        role,
        relationship: relationship.trim() || undefined,
        created_by: user?.id,
      })
      toast.success(`Portal access created for ${name}`)
      copyPortalLink(token.token)
      setShowForm(false)
      setName('')
      setEmail('')
      setRole('participant')
      setRelationship('')
    } catch {
      toast.error('Failed to create portal access')
    }
  }

  function copyPortalLink(token: string) {
    const link = `${window.location.origin}/portal/login?token=${token}`
    navigator.clipboard.writeText(link)
    toast.success('Portal link copied to clipboard')
  }

  if (isLoading) return <LoadingState />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Portal Access</h3>
          <p className="text-sm text-muted-foreground">
            Manage who can view {participantName}&apos;s portal.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" />
          Invite
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invite to Portal</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="pa-name">Name *</Label>
                  <Input
                    id="pa-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Fatima Hassan"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pa-email">Email *</Label>
                  <Input
                    id="pa-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. fatima@email.com"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pa-role">Role</Label>
                  <Select value={role} onValueChange={(v) => v && setRole(v as typeof role)}>
                    <SelectTrigger id="pa-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="participant">Participant</SelectItem>
                      <SelectItem value="guardian">Guardian / Family</SelectItem>
                      <SelectItem value="support_coordinator">Support Coordinator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pa-rel">Relationship</Label>
                  <Input
                    id="pa-rel"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    placeholder="e.g. Mother, SC from XYZ"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={createToken.isPending}>
                  {createToken.isPending ? 'Creating...' : 'Create & Copy Link'}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!tokens || tokens.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="No portal access"
          description="Invite participants, guardians, or support coordinators to view the read-only portal."
        />
      ) : (
        <div className="space-y-3">
          {tokens.map((token) => (
            <Card key={token.id} className={!token.is_active ? 'opacity-60' : ''}>
              <CardContent className="flex items-center justify-between gap-4 pt-6">
                <div className="flex items-center gap-3 min-w-0">
                  <UserCircle className="h-8 w-8 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{token.name}</span>
                      <Badge variant="outline" className="capitalize text-xs">
                        {token.role.replace(/_/g, ' ')}
                      </Badge>
                      {!token.is_active && <Badge variant="secondary">Disabled</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{token.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Created {formatDate(token.created_at)}
                      {token.last_accessed_at && ` · Last access ${formatDate(token.last_accessed_at)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Copy portal link"
                    onClick={() => copyPortalLink(token.token)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title={token.is_active ? 'Disable access' : 'Enable access'}
                    onClick={() =>
                      toggleToken.mutate(
                        { id: token.id, is_active: !token.is_active, participant_id: participantId },
                        { onSuccess: () => toast.success(token.is_active ? 'Access disabled' : 'Access enabled') }
                      )
                    }
                  >
                    {token.is_active ? (
                      <ToggleRight className="h-3.5 w-3.5" />
                    ) : (
                      <ToggleLeft className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    title="Delete access"
                    onClick={() => setDeleteId(token.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Portal Access"
        description="This will permanently revoke this person's portal access. They will no longer be able to view participant information."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (deleteId) {
            deleteToken.mutate(
              { id: deleteId, participant_id: participantId },
              {
                onSuccess: () => {
                  toast.success('Portal access deleted')
                  setDeleteId(null)
                },
              }
            )
          }
        }}
      />
    </div>
  )
}
