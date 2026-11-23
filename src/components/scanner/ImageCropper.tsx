import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { Crop, RotateCw, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/useToast'

interface ImageCropperProps {
  imageSrc: string
  onCropDone: (croppedFile: File) => void
  onCancel: () => void
}

// Cap the cropped output size. A cover doesn't need more than this, and
// large canvases make iOS Safari's toBlob() return null (silent failure).
const MAX_OUTPUT = 1000

function getCroppedCanvas(
  imageSrc: string,
  cropArea: Area
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      // Scale the output down to MAX_OUTPUT so we stay well within the
      // iOS Safari canvas limits.
      const scale = Math.min(1, MAX_OUTPUT / Math.max(cropArea.width, cropArea.height))
      const outW = Math.max(1, Math.round(cropArea.width * scale))
      const outH = Math.max(1, Math.round(cropArea.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = outW
      canvas.height = outH
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas context not available'))
      ctx.drawImage(
        image,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        outW,
        outH
      )
      resolve(canvas)
    }
    image.onerror = () => reject(new Error('Failed to load image'))
    image.src = imageSrc
  })
}

export function ImageCropper({ imageSrc, onCropDone, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return
    try {
      const canvas = await getCroppedCanvas(imageSrc, croppedAreaPixels)
      // Prefer toBlob; some iOS versions still return null, so fall back
      // to a data URL instead of silently dropping the cover.
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9)
      )
      let file: File
      if (blob) {
        file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' })
      } else {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
        const res = await fetch(dataUrl)
        const fallbackBlob = await res.blob()
        file = new File([fallbackBlob], 'cropped.jpg', { type: 'image/jpeg' })
      }
      onCropDone(file)
    } catch {
      toast({
        title: 'Não foi possível recortar a imagem',
        description: 'Tente uma foto menor ou reduza o zoom.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="rounded-xl overflow-hidden border border-[#2A2A2A] bg-black">
      <div className="relative w-full" style={{ height: 360 }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={1}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onCropComplete={onCropComplete}
          showGrid
          style={{
            containerStyle: { borderRadius: '0.75rem 0.75rem 0 0' },
          }}
        />
      </div>

      <div className="flex items-center justify-between gap-2 p-3 bg-[#1A1A1A]">
        <div className="flex items-center gap-2 text-xs text-[#9A9080]">
          <Crop className="w-3.5 h-3.5" />
          <span>Arraste e ajuste o zoom</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setRotation((r) => (r + 90) % 360)}
          className="text-[#9A9080] hover:text-[#F5F0E8]"
        >
          <RotateCw className="w-4 h-4 mr-1" /> Girar
        </Button>
      </div>

      <div className="flex gap-2 p-3 bg-[#1A1A1A] border-t border-[#2A2A2A]">
        <Button variant="secondary" className="flex-1" onClick={onCancel}>
          <X className="w-4 h-4 mr-1" /> Cancelar
        </Button>
        <Button className="flex-1" onClick={handleConfirm}>
          <Check className="w-4 h-4 mr-1" /> Recortar
        </Button>
      </div>
    </div>
  )
}
