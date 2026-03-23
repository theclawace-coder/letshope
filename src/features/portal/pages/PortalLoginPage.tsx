import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { usePortalAuth } from '../hooks/usePortal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Heart, AlertCircle, KeyRound } from 'lucide-react'

export function PortalLoginPage() {
  const [token, setToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { session, login } = usePortalAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Auto-login if token is in URL
  useEffect(() => {
    const urlToken = searchParams.get('token')
    if (urlToken) {
      setToken(urlToken)
      handleLogin(urlToken)
    }
  }, [searchParams])

  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      navigate('/portal', { replace: true })
    }
  }, [session, navigate])

  async function handleLogin(accessToken?: string) {
    const t = accessToken ?? token
    if (!t.trim()) {
      setError('Please enter your access code')
      return
    }

    setError(null)
    try {
      await login.mutateAsync(t.trim())
      navigate('/portal', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired access link')
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    handleLogin()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary">
            <Heart className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">My Portal</CardTitle>
            <CardDescription className="text-base mt-1">
              Hope Disability Support &middot; Participant Portal
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="token">Access Code</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="token"
                  type="text"
                  placeholder="Paste your access code here"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="off"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Your access code was provided by Hope Disability Support. Check your email for the link.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? 'Verifying...' : 'Access My Portal'}
            </Button>
          </form>

          <div className="mt-6 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">Need help?</p>
            <p>Contact Erfan at 0405 092 779 or erfan@hopedisability.com.au</p>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Hope Disability Support &middot; ABN 59 677 810 498
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
