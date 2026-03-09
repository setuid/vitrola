import { useRef, useCallback, useState, useEffect } from 'react'
import { Camera, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CameraViewProps {
  onCapture: (file: File) => void
  onClose: () => void
}

export function CameraView({ onCapture, onClose }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [started, setStarted] = useState(false)
  const [captured, setCaptured] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setStarted(true)
    } catch {
      setError('Não foi possível acessar a câmera. Verifique as permissões.')
    }
  }, [])

  // Auto-start camera on mount
  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera])

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return
    const canvas = canvasRef.current
    const video = videoRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')!.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    setCaptured(dataUrl)
    stopCamera()
  }

  const confirm = () => {
    if (!canvasRef.current || !captured) return
    canvasRef.current.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' })
          onCapture(file)
          onClose()
        }
      },
      'image/jpeg',
      0.9
    )
  }

  const retake = () => {
    setCaptured(null)
    startCamera()
  }

  const handleClose = () => {
    stopCamera()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {error && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3 p-8">
            <p className="text-red-400 text-sm">{error}</p>
            <Button variant="outline" onClick={handleClose}>Fechar</Button>
          </div>
        </div>
      )}

      {!error && !captured && (
        <>
          <video
            ref={videoRef}
            className="flex-1 object-cover"
            playsInline
            muted
          />
          {started && (
            <div className="absolute bottom-0 inset-x-0 pb-10 pt-6 flex gap-3 justify-center bg-gradient-to-t from-black/80 to-transparent">
              <Button variant="secondary" size="icon" onClick={handleClose} className="bg-white/10 backdrop-blur">
                <X className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                className="w-16 h-16 rounded-full bg-[#C9A84C] hover:bg-[#E8B84B] shadow-lg"
                onClick={capture}
              >
                <Camera className="w-7 h-7 text-[#0A0A0A]" />
              </Button>
              <div className="w-10" /> {/* spacer for centering */}
            </div>
          )}
        </>
      )}

      {captured && (
        <>
          <img src={captured} alt="Captura" className="flex-1 object-contain" />
          <div className="absolute bottom-0 inset-x-0 pb-10 pt-6 flex gap-3 justify-center bg-gradient-to-t from-black/80 to-transparent">
            <Button variant="secondary" onClick={retake} className="bg-white/10 backdrop-blur">
              <X className="w-4 h-4 mr-1" /> Tentar novamente
            </Button>
            <Button onClick={confirm} className="bg-[#C9A84C] hover:bg-[#E8B84B] text-[#0A0A0A]">
              <Check className="w-4 h-4 mr-1" /> Usar foto
            </Button>
          </div>
        </>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
