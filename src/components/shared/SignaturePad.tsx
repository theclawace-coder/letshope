import { useRef } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Button } from '@/components/ui/button'
import { Eraser } from 'lucide-react'

interface SignaturePadProps {
  onSave: (dataUrl: string) => void
  label?: string
  width?: number
  height?: number
}

export function SignaturePad({ onSave, label = 'Sign here', width = 500, height = 200 }: SignaturePadProps) {
  const sigRef = useRef<SignatureCanvas>(null)

  function handleClear() {
    sigRef.current?.clear()
  }

  function handleSave() {
    if (sigRef.current?.isEmpty()) return
    const dataUrl = sigRef.current?.toDataURL('image/png') || ''
    onSave(dataUrl)
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="border rounded-md bg-white">
        <SignatureCanvas
          ref={sigRef}
          canvasProps={{
            width,
            height,
            className: 'w-full rounded-md',
          }}
          penColor="black"
        />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleClear}>
          <Eraser className="h-4 w-4 mr-1" />
          Clear
        </Button>
        <Button type="button" size="sm" onClick={handleSave}>
          Save Signature
        </Button>
      </div>
    </div>
  )
}
