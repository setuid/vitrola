import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useRecord, useUpdateRecord } from '@/hooks/useRecords'
import { toast } from '@/hooks/useToast'
import { Button } from '@/components/ui/button'
import { RecordForm } from '@/components/record/RecordForm'
import type { VinylRecord } from '@/lib/supabase'

export function RecordEdit() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: record, isLoading } = useRecord(id)
  const updateRecord = useUpdateRecord()

  const handleSubmit = async (data: Partial<VinylRecord>) => {
    updateRecord.mutate(
      { id, ...data },
      {
        onSuccess: () => {
          toast({ title: 'Disco atualizado!', variant: 'success' })
          navigate(`/shelf/${id}`)
        },
        onError: () => toast({ title: 'Erro ao salvar', variant: 'destructive' }),
      }
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[#C9A84C]" />
      </div>
    )
  }

  if (!record) {
    return (
      <div className="text-center py-16 text-[#5A5248]">
        <p>Disco não encontrado.</p>
        <Link to="/shelf"><Button variant="link">Voltar à estante</Button></Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#F5F0E8]">Editar Disco</h1>
          <p className="text-[#9A9080] text-sm">{record.title}</p>
        </div>
      </div>

      <RecordForm defaultValues={record} onSubmit={handleSubmit} submitLabel="Salvar alterações" />
    </div>
  )
}
