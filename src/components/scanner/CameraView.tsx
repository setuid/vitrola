import { useRef, useCallback, useState } from 'react'
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

  const startCamera = async () => {
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
  }

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

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
    <div className="relative bg-black rounded-xl overflow-hidden min-h-[300px] flex flex-col items-center justify-center">
      {!started && !captured && !error && (
        <div className="text-center space-y-4 p-8">
          <Camera className="w-12 h-12 text-[#9A9080] mx-auto" />
          <p className="text-[#9A9080] text-sm">Aponte a câmera para a capa do disco</p>
          <Button onClick={startCamera}>Iniciar câmera</Button>
        </div>
      )}

      {error && (
        <div className="text-center space-y-3 p-8">
          <p className="text-red-400 text-sm">{error}</p>
          <Button variant="outline" onClick={handleClose}>Fechar</Button>
        </div>
      )}

      {started && !captured && (
        <>
          <video ref={videoRef} className="w-full" playsInline muted />
          <div className="absolute bottom-4 flex gap-3 justify-center w-full">
            <Button variant="secondary" size="icon" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              className="w-14 h-14 rounded-full bg-[#C9A84C] hover:bg-[#E8B84B]"
              onClick={capture}
            >
              <Camera className="w-6 h-6 text-[#0A0A0A]" />
            </Button>
          </div>
        </>
      )}

      {captured && (
        <>
          <img src={captured} alt="Captura" className="w-full" />
          <div className="absolute bottom-4 flex gap-3 justify-center w-full">
            <Button variant="secondary" onClick={retake}>
              <X className="w-4 h-4 mr-1" /> Tentar novamente
            </Button>
            <Button onClick={confirm}>
              <Check className="w-4 h-4 mr-1" /> Usar foto
            </Button>
          </div>
        </>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
