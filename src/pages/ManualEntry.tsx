import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Upload, Camera, X, Disc3 } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { useCreateRecord } from '@/hooks/useRecords'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/hooks/useToast'
import { fileToDataUrl } from '@/lib/vision'
import { Button } from '@/components/ui/button'
import { RecordForm } from '@/components/record/RecordForm'
import { CameraView } from '@/components/scanner/CameraView'
import { ImageCropper } from '@/components/scanner/ImageCropper'
import type { VinylRecord } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

export function ManualEntry() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const createRecord = useCreateRecord()

  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
  const [showCamera, setShowCamera] = useState(false)

  const handleFileDrop = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setCropImageSrc(await fileToDataUrl(file))
  }, [])

  const handleCropDone = useCallback(async (croppedFile: File) => {
    setCropImageSrc(null)
    setCapturedFile(croppedFile)
    setPreviewUrl(await fileToDataUrl(croppedFile))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    onDrop: handleFileDrop,
    multiple: false,
  })

  const clearCover = () => {
    setCapturedFile(null)
    setPreviewUrl(null)
  }

  const handleCreate = async (data: Partial<VinylRecord>) => {
    if (!user) {
      toast({ title: 'Você precisa estar logado', variant: 'destructive' })
      return
    }

    const payload = {
      ...data,
      user_id: user.id,
      title: data.title || '',
      artist: data.artist || '',
      format: data.format || 'LP',
      rpm: data.rpm || 33,
      condition: data.condition || 'VG+',
      play_count: 0,
    } as Omit<VinylRecord, 'id' | 'created_at' | 'updated_at'>

    // Optional cover upload (same storage flow as the scanner).
    if (capturedFile) {
      const tmpId = crypto.randomUUID()
      const path = `covers/${user.id}/${tmpId}.jpg`
      const { error } = await supabase.storage
        .from('covers')
        .upload(path, capturedFile, { upsert: true })
      if (error) {
        // Surface the real reason instead of silently dropping the cover.
        toast({
          title: 'Falha ao enviar a capa',
          description: `${error.message}. O disco será salvo sem capa.`,
          variant: 'destructive',
        })
      } else {
        const { data: urlData } = supabase.storage.from('covers').getPublicUrl(path)
        payload.cover_image_url = urlData.publicUrl
        payload.cover_storage_path = path
      }
    }

    createRecord.mutate(payload, {
      onSuccess: (record) => {
        toast({ title: 'Disco adicionado!', description: record.title, variant: 'success' })
        navigate(`/shelf/${record.id}`)
      },
      onError: () => toast({ title: 'Erro ao salvar disco', variant: 'destructive' }),
    })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/scanner')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F5F0E8]">
            Cadastro manual
          </h1>
          <p className="text-[#9A9080] text-sm mt-0.5">Preencha os dados do disco à mão</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Optional cover */}
        <div className="space-y-2">
          <p className="text-xs text-[#5A5248] uppercase tracking-wider">Capa (opcional)</p>
          <div className="flex items-center gap-3">
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-[#1A1A1A] border border-[#2A2A2A] flex-shrink-0 flex items-center justify-center">
              {previewUrl ? (
                <img src={previewUrl} alt="Capa" className="w-full h-full object-cover" />
              ) : (
                <Disc3 className="w-8 h-8 text-[#5A5248]" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowCamera(true)}>
                  <Camera className="w-3.5 h-3.5 mr-1.5" /> Câmera
                </Button>
                <div {...getRootProps()}>
                  <input {...getInputProps()} />
                  <Button
                    variant="outline"
                    size="sm"
                    className={isDragActive ? 'border-[#C9A84C] bg-[#C9A84C]/5' : ''}
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload
                  </Button>
                </div>
                {previewUrl && (
                  <Button variant="ghost" size="sm" onClick={clearCover}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-[#5A5248]">
                Sem capa? Sem problema — dá para adicionar depois.
              </p>
            </div>
          </div>
        </div>

        {cropImageSrc && (
          <ImageCropper
            imageSrc={cropImageSrc}
            onCropDone={handleCropDone}
            onCancel={() => setCropImageSrc(null)}
          />
        )}

        <RecordForm
          defaultValues={{}}
          onSubmit={handleCreate}
          submitLabel="Adicionar à coleção"
        />
      </motion.div>

      {showCamera && (
        <CameraView
          onCapture={(file: File) => {
            setShowCamera(false)
            handleFileDrop([file])
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  )
}
