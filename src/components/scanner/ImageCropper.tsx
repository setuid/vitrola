import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { Crop, RotateCw, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImageCropperProps {
  imageSrc: string
  onCropDone: (croppedFile: File) => void
  onCancel: () => void
}

function getCroppedCanvas(
  imageSrc: string,
  cropArea: Area
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = cropArea.width
      canvas.height = cropArea.height
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
        cropArea.width,
        cropArea.height
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
    const canvas = await getCroppedCanvas(imageSrc, croppedAreaPixels)
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' })
          onCropDone(file)
        }
      },
      'image/jpeg',
      0.9
    )
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
