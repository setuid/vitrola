import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Camera, Search, Upload, AlertTriangle, Loader2 } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { useCreateRecord } from '@/hooks/useRecords'
import { useAuth } from '@/hooks/useAuth'
import { useDebouncedSearch, useDiscogsRelease } from '@/hooks/useDiscogs'
import { toast } from '@/hooks/useToast'
import { detectAlbumCover, imageToBase64, fileToDataUrl } from '@/lib/vision'
import { searchDiscogs, parseDuration } from '@/lib/discogs'
import type { DiscogsSearchResult } from '@/lib/discogs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SearchResults } from '@/components/scanner/SearchResults'
import { CameraView } from '@/components/scanner/CameraView'
import { ImageCropper } from '@/components/scanner/ImageCropper'
import { RecordForm } from '@/components/record/RecordForm'
import type { VinylRecord } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

type Step = 'input' | 'confirm'

export function Scanner() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const createRecord = useCreateRecord()
  const { query, setSearch, data: searchResults = [], isFetching } = useDebouncedSearch()

  const [step, setStep] = useState<Step>('input')
  const [selectedResult, setSelectedResult] = useState<DiscogsSearchResult | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState(false)
  const [photoResults, setPhotoResults] = useState<DiscogsSearchResult[]>([])

  const { data: releaseDetails, isLoading: releaseLoading } = useDiscogsRelease(
    step === 'confirm' && selectedResult ? selectedResult.id : null
  )

  const getDefaultValues = (): Partial<VinylRecord> => {
    if (!selectedResult) return {}
    const titleParts = selectedResult.title.split(' - ')
    return {
      discogs_id: String(selectedResult.id),
      title: titleParts.slice(1).join(' - ') || selectedResult.title,
      artist: titleParts[0] || '',
      year: selectedResult.year ? Number(selectedResult.year) : null,
      label: selectedResult.label?.[0] || null,
      country: selectedResult.country || null,
      genres: selectedResult.genre || null,
      styles: selectedResult.style || null,
      cover_image_url: selectedResult.cover_image || selectedResult.thumb || null,
      ...(releaseDetails && {
        title: releaseDetails.title,
        artist: releaseDetails.artists?.[0]?.name || titleParts[0] || '',
        year: releaseDetails.year || null,
        label: releaseDetails.labels?.[0]?.name || null,
        catalog_number: releaseDetails.labels?.[0]?.catno || null,
        country: releaseDetails.country || null,
        genres: releaseDetails.genres || null,
        styles: releaseDetails.styles || null,
        tracklist: releaseDetails.tracklist || null,
        total_duration_seconds: releaseDetails.tracklist?.reduce(
          (acc, t) => acc + parseDuration(t.duration),
          0
        ) || null,
        cover_image_url:
          releaseDetails.images?.find((i) => i.type === 'primary')?.uri ||
          selectedResult.cover_image || null,
        format: releaseDetails.formats?.[0]?.name || 'LP',
      }),
    }
  }

  const handleSelectResult = async (result: DiscogsSearchResult) => {
    setSelectedResult(result)
    const { data } = await supabase
      .from('records')
      .select('id')
      .eq('discogs_id', String(result.id))
      .single()
    setDuplicateWarning(!!data)
    setStep('confirm')
  }

  const handleFileDrop = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    const url = await fileToDataUrl(file)
    setCropImageSrc(url)
  }, [])

  const handleCropDone = useCallback(async (croppedFile: File) => {
    setCropImageSrc(null)
    setCapturedFile(croppedFile)
    const url = await fileToDataUrl(croppedFile)
    setPreviewUrl(url)
    setOcrLoading(true)
    try {
      const base64 = await imageToBase64(croppedFile)
      const detection = await detectAlbumCover(base64)
      const results = await searchDiscogs(detection.query)
      setPhotoResults(results)
      if (results.length === 0) {
        toast({ title: 'Nenhum resultado', description: `Busca: "${detection.query}". Tente a busca manual.`, variant: 'destructive' })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      toast({ title: 'Reconhecimento falhou', description: message, variant: 'destructive' })
    } finally {
      setOcrLoading(false)
    }
  }, [])

  const handleCropCancel = useCallback(() => {
    setCropImageSrc(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    onDrop: handleFileDrop,
    multiple: false,
  })

  const handleSave = async (data: Partial<VinylRecord>) => {
    if (!user) {
      toast({ title: 'Você precisa estar logado', variant: 'destructive' })
      return
    }
    const defaults = getDefaultValues()
    const payload = {
      ...defaults,
      ...data,
      user_id: user.id,
      title: data.title || '',
      artist: data.artist || '',
      format: data.format || 'LP',
      rpm: data.rpm || 33,
      condition: data.condition || 'VG+',
      play_count: 0,
    } as Omit<VinylRecord, 'id' | 'created_at' | 'updated_at'>

    if (capturedFile && user) {
      const tmpId = crypto.randomUUID()
      const path = `covers/${user.id}/${tmpId}.jpg`
      const { error } = await supabase.storage.from('covers').upload(path, capturedFile, { upsert: true })
      if (!error) {
        const { data: urlData } = supabase.storage.from('covers').getPublicUrl(path)
        payload.cover_image_url = urlData.publicUrl
        payload.cover_storage_path = path
      }
    } else if (payload.cover_image_url && user) {
      try {
        const imgResp = await fetch(payload.cover_image_url)
        if (imgResp.ok) {
          const blob = await imgResp.blob()
          const tmpId = crypto.randomUUID()
          const ext = blob.type === 'image/png' ? 'png' : 'jpg'
          const path = `covers/${user.id}/${tmpId}.${ext}`
          const { error } = await supabase.storage.from('covers').upload(path, blob, {
            upsert: true,
            contentType: blob.type,
          })
          if (!error) {
            const { data: urlData } = supabase.storage.from('covers').getPublicUrl(path)
            payload.cover_image_url = urlData.publicUrl
            payload.cover_storage_path = path
          }
        }
      } catch {
        // Keep the original Discogs URL as fallback
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

  // Show photo results if available, otherwise text search results
  const displayResults = photoResults.length > 0 ? photoResults : searchResults
  const isSearching = isFetching || ocrLoading

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-[#F5F0E8]">Adicionar Disco</h1>
        <p className="text-[#9A9080] mt-1">Busque por texto, tire uma foto ou faça upload</p>
      </div>

      {step === 'input' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A5248]" />
            <Input
              placeholder="Título, artista, código de barras..."
              value={query}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Camera + Upload side by side */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-11"
              onClick={() => setShowCamera(true)}
            >
              <Camera className="w-4 h-4 mr-2" /> Câmera
            </Button>
            <div className="flex-1" {...getRootProps()}>
              <input {...getInputProps()} />
              <Button
                variant="outline"
                className={`w-full h-11 ${isDragActive ? 'border-[#C9A84C] bg-[#C9A84C]/5' : ''}`}
              >
                <Upload className="w-4 h-4 mr-2" /> Upload
              </Button>
            </div>
          </div>

          {/* Cropper */}
          {cropImageSrc && (
            <ImageCropper
              imageSrc={cropImageSrc}
              onCropDone={handleCropDone}
              onCancel={handleCropCancel}
            />
          )}

          {/* Loading */}
          {isSearching && (
            <div className="flex items-center justify-center gap-2 py-4 text-[#9A9080]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">{ocrLoading ? 'Reconhecendo capa...' : 'Buscando...'}</span>
            </div>
          )}

          {/* Preview of captured image */}
          {previewUrl && !ocrLoading && !cropImageSrc && (
            <div className="rounded-xl overflow-hidden border border-[#2A2A2A]">
              <img src={previewUrl} alt="Capa" className="w-full max-h-48 object-cover" />
            </div>
          )}

          {/* Results (from text search or photo recognition) */}
          {displayResults.length > 0 && !isSearching && (
            <SearchResults
              results={displayResults}
              onSelect={handleSelectResult}
              selectedId={selectedResult?.id}
            />
          )}
        </motion.div>
      )}

      {/* Camera fullscreen overlay */}
      {showCamera && (
        <CameraView
          onCapture={(file: File) => {
            setShowCamera(false)
            handleFileDrop([file])
          }}
          onClose={() => setShowCamera(false)}
        />
      )}

      {step === 'confirm' && selectedResult && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setStep('input')}>
            ← Voltar
          </Button>

          {duplicateWarning && (
            <div className="flex items-center gap-2 p-3 bg-yellow-900/20 border border-yellow-700/40 rounded-lg text-yellow-300 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              Este disco já parece estar na sua coleção.
            </div>
          )}

          {releaseLoading && (
            <div className="flex items-center gap-2 text-[#9A9080] text-sm py-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando detalhes completos...
            </div>
          )}

          <RecordForm
            key={releaseDetails ? 'loaded' : 'loading'}
            defaultValues={getDefaultValues()}
            onSubmit={handleSave}
            submitLabel="Adicionar à coleção"
            disabled={releaseLoading}
          />
        </motion.div>
      )}
    </div>
  )
}
