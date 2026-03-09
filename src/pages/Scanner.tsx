import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Camera, Search, Upload, AlertTriangle, Loader2, Disc3 } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SearchResults } from '@/components/scanner/SearchResults'
import { CameraView } from '@/components/scanner/CameraView'
import { ImageCropper } from '@/components/scanner/ImageCropper'
import { RecordForm } from '@/components/record/RecordForm'
import type { VinylRecord } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

type Step = 'input' | 'results' | 'confirm'

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
  const [activeTab, setActiveTab] = useState<'manual' | 'photo'>('manual')

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
    // Check duplicate
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
    setShowCamera(false)
    setActiveTab('photo')
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

    // Upload cover to Supabase Storage (from captured file or Discogs URL)
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
      // Download Discogs image and re-upload to Supabase Storage
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

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-[#F5F0E8]">Adicionar Disco</h1>
        <p className="text-[#9A9080] mt-1">Por foto, upload ou busca manual</p>
      </div>

      {step === 'input' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'manual' | 'photo')}>
            <TabsList className="w-full">
              <TabsTrigger value="manual" className="flex-1">
                <Search className="w-4 h-4 mr-2" /> Busca Manual
              </TabsTrigger>
              <TabsTrigger value="photo" className="flex-1">
                <Camera className="w-4 h-4 mr-2" /> Por Foto
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4 mt-4">
              <Input
                placeholder="Título, artista, código de barras..."
                value={query}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
              <SearchResults
                results={searchResults}
                loading={isFetching}
                onSelect={handleSelectResult}
                selectedId={selectedResult?.id}
              />
            </TabsContent>

            <TabsContent value="photo" className="space-y-4 mt-4">
              {cropImageSrc ? (
                <ImageCropper
                  imageSrc={cropImageSrc}
                  onCropDone={handleCropDone}
                  onCancel={handleCropCancel}
                />
              ) : showCamera ? (
                <CameraView
                  onCapture={(file: File) => handleFileDrop([file])}
                  onClose={() => setShowCamera(false)}
                />
              ) : (
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full h-12"
                    onClick={() => setShowCamera(true)}
                  >
                    <Camera className="w-5 h-5 mr-2" /> Abrir câmera
                  </Button>

                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                      isDragActive ? 'border-[#C9A84C] bg-[#C9A84C]/5' : 'border-[#2A2A2A] hover:border-[#C9A84C]/30'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="w-8 h-8 mx-auto mb-2 text-[#5A5248]" />
                    <p className="text-sm text-[#9A9080]">Arraste uma foto ou clique para selecionar</p>
                    <p className="text-xs text-[#5A5248] mt-1">JPG, PNG — máx 10 MB</p>
                  </div>
                </div>
              )}

              {ocrLoading && (
                <div className="flex items-center justify-center gap-2 py-4 text-[#9A9080]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Reconhecendo capa...</span>
                </div>
              )}

              {previewUrl && !ocrLoading && (
                <div className="rounded-xl overflow-hidden border border-[#2A2A2A]">
                  <img src={previewUrl} alt="Capa" className="w-full max-h-48 object-cover" />
                </div>
              )}

              {photoResults.length > 0 && (
                <SearchResults
                  results={photoResults}
                  onSelect={handleSelectResult}
                  selectedId={selectedResult?.id}
                />
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
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
