import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import type { VinylRecord } from '@/lib/supabase'
import { CONDITIONS, RPMS } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StarRating } from './StarRating'

const schema = z.object({
  title: z.string().min(1, 'Título obrigatório'),
  artist: z.string().min(1, 'Artista obrigatório'),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1).nullable(),
  label: z.string().optional(),
  catalog_number: z.string().optional(),
  country: z.string().optional(),
  format: z.string().min(1),
  rpm: z.coerce.number(),
  condition: z.string().min(1),
  notes: z.string().optional(),
  tags: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface RecordFormProps {
  defaultValues?: Partial<VinylRecord>
  onSubmit: (data: Partial<VinylRecord>) => Promise<void>
  submitLabel?: string
}

export function RecordForm({ defaultValues, onSubmit, submitLabel = 'Salvar' }: RecordFormProps) {
  const [rating, setRating] = useState<number | null>(defaultValues?.rating ?? null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      artist: defaultValues?.artist ?? '',
      year: defaultValues?.year ?? null,
      label: defaultValues?.label ?? '',
      catalog_number: defaultValues?.catalog_number ?? '',
      country: defaultValues?.country ?? '',
      format: defaultValues?.format ?? 'LP',
      rpm: defaultValues?.rpm ?? 33,
      condition: defaultValues?.condition ?? 'VG+',
      notes: defaultValues?.notes ?? '',
      tags: defaultValues?.tags?.join(', ') ?? '',
    },
  })

  const condition = watch('condition')
  const rpm = watch('rpm')

  const handleFormSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const tags = data.tags
        ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : []
      await onSubmit({
        ...data,
        year: data.year ?? null,
        label: data.label || null,
        catalog_number: data.catalog_number || null,
        country: data.country || null,
        notes: data.notes || null,
        rating,
        tags,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">Título *</Label>
          <Input id="title" placeholder="Título do disco" {...register('title')} />
          {errors.title && <p className="text-xs text-red-400">{errors.title.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="artist">Artista *</Label>
          <Input id="artist" placeholder="Nome do artista" {...register('artist')} />
          {errors.artist && <p className="text-xs text-red-400">{errors.artist.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="year">Ano</Label>
          <Input id="year" type="number" placeholder="1970" {...register('year')} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="label">Selo</Label>
          <Input id="label" placeholder="Columbia, Blue Note..." {...register('label')} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="catalog_number">Catálogo</Label>
          <Input id="catalog_number" placeholder="CS 9428" {...register('catalog_number')} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="country">País</Label>
          <Input id="country" placeholder="Brazil, US..." {...register('country')} />
        </div>

        <div className="space-y-1.5">
          <Label>Condição</Label>
          <Select
            value={condition}
            onValueChange={(v) => setValue('condition', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONDITIONS.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>RPM</Label>
          <Select
            value={String(rpm)}
            onValueChange={(v) => setValue('rpm', Number(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RPMS.map((r) => (
                <SelectItem key={r} value={String(r)}>{r} RPM</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
        <Input id="tags" placeholder="jazz, bossa nova, anos 70" {...register('tags')} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" placeholder="Observações sobre o disco..." rows={3} {...register('notes')} />
      </div>

      <div className="space-y-1.5">
        <Label>Avaliação</Label>
        <StarRating value={rating} onChange={setRating} />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  )
}
