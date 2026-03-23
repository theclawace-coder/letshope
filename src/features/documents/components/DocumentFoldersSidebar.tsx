import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  Folder, FolderPlus, FileSignature, ShieldCheck, ClipboardCheck,
  ClipboardList, AlertTriangle, FileText, AlertCircle, Users,
  Building, Loader2,
} from 'lucide-react'
import { useDocumentFolders, useCreateFolder } from '../hooks/useDocumentFolders'
import { useAuth } from '@/providers/AuthProvider'
import { toast } from 'sonner'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'folder': Folder,
  'file-signature': FileSignature,
  'shield-check': ShieldCheck,
  'clipboard-check': ClipboardCheck,
  'clipboard-list': ClipboardList,
  'alert-triangle': AlertTriangle,
  'file-text': FileText,
  'alert-circle': AlertCircle,
  'users': Users,
  'building': Building,
}

interface DocumentFoldersSidebarProps {
  selectedFolderId: string | null
  onSelectFolder: (folderId: string | null) => void
}

export function DocumentFoldersSidebar({ selectedFolderId, onSelectFolder }: DocumentFoldersSidebarProps) {
  const { profile } = useAuth()
  const { data: folders, isLoading } = useDocumentFolders()
  const createFolder = useCreateFolder()
  const [createOpen, setCreateOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  async function handleCreateFolder() {
    if (!newFolderName.trim()) return

    try {
      await createFolder.mutateAsync({
        name: newFolderName.trim(),
        created_by: profile?.id,
      })
      toast.success('Folder created')
      setCreateOpen(false)
      setNewFolderName('')
    } catch {
      toast.error('Failed to create folder')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-2 mb-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Folders
        </p>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <FolderPlus className="h-3.5 w-3.5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[380px]">
            <DialogHeader>
              <DialogTitle>New Folder</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateFolder} disabled={!newFolderName.trim() || createFolder.isPending}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* All documents */}
      <button
        onClick={() => onSelectFolder(null)}
        className={cn(
          'flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm transition-colors',
          selectedFolderId === null
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <Folder className="h-4 w-4 shrink-0" />
        All Documents
      </button>

      {/* System and custom folders */}
      {(folders || []).map((folder) => {
        const IconComp = ICON_MAP[folder.icon] || Folder
        return (
          <button
            key={folder.id}
            onClick={() => onSelectFolder(folder.id)}
            className={cn(
              'flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm transition-colors',
              selectedFolderId === folder.id
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <IconComp className="h-4 w-4 shrink-0" />
            <span className="truncate">{folder.name}</span>
          </button>
        )
      })}
    </div>
  )
}
