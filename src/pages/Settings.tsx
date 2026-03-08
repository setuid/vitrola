import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon, Eye, EyeOff, LogOut, User, Key, Database } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/hooks/useToast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthModal } from '@/components/auth/AuthModal'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function Settings() {
  const { user, signOut } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [showKeys, setShowKeys] = useState(false)

  const envVars = [
    { key: 'VITE_SUPABASE_URL', label: 'Supabase URL' },
    { key: 'VITE_SUPABASE_ANON_KEY', label: 'Supabase Anon Key' },
    { key: 'VITE_DISCOGS_API_KEY', label: 'Discogs API Token' },
    { key: 'VITE_GOOGLE_VISION_API_KEY', label: 'Google Vision API Key' },
  ]

  const handleSignOut = async () => {
    await signOut()
    toast({ title: 'Até logo!', variant: 'success' })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-6 h-6 text-[#C9A84C]" />
        <h1 className="font-display text-3xl font-bold text-[#F5F0E8]">Configurações</h1>
      </div>

      {/* Account */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="w-4 h-4 text-[#C9A84C]" /> Conta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {user ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#F5F0E8]">{user.email}</p>
                  <p className="text-xs text-[#5A5248]">
                    Membro desde {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <Button variant="destructive" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-1" /> Sair
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-[#9A9080]">
                  Faça login para sincronizar sua coleção entre dispositivos.
                </p>
                <Button onClick={() => setShowAuth(true)} className="w-full">
                  Entrar / Criar conta
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* API Keys info */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Key className="w-4 h-4 text-[#C9A84C]" /> Chaves de API
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-[#9A9080]">
              As chaves de API são configuradas como variáveis de ambiente e GitHub Secrets.
              Não são expostas no código.
            </p>

            <div className="flex items-center justify-between">
              <span className="text-sm text-[#F5F0E8]">Status das variáveis</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowKeys(!showKeys)}
              >
                {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>

            {showKeys && (
              <div className="space-y-2">
                {envVars.map(({ key, label }) => {
                  const value = import.meta.env[key]
                  return (
                    <div key={key} className="flex items-center justify-between p-2 rounded bg-[#0A0A0A]">
                      <div>
                        <p className="text-xs font-mono text-[#C9A84C]">{key}</p>
                        <p className="text-xs text-[#5A5248]">{label}</p>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          value
                            ? 'bg-green-900/30 text-green-400'
                            : 'bg-red-900/30 text-red-400'
                        }`}
                      >
                        {value ? 'Configurado' : 'Não configurado'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Supabase Schema */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="w-4 h-4 text-[#C9A84C]" /> Setup Supabase
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-[#9A9080]">
              Execute o SQL abaixo no Supabase SQL Editor para criar as tabelas:
            </p>
            <div className="bg-[#0A0A0A] rounded-lg p-3 overflow-x-auto">
              <pre className="text-xs font-mono text-[#9A9080] whitespace-pre-wrap">{SQL_SCHEMA}</pre>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* About */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card>
          <CardContent className="p-4">
            <p className="text-center text-xs text-[#5A5248]">
              Vitrola v2.0 · Seus discos. Suas histórias. Seu som.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={showAuth} onOpenChange={setShowAuth}>
        <DialogContent>
          <DialogHeader><DialogTitle>Entrar na Vitrola</DialogTitle></DialogHeader>
          <AuthModal onSuccess={() => setShowAuth(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

const SQL_SCHEMA = `-- Discos
create table records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  discogs_id text,
  title text not null,
  artist text not null,
  year int, label text, catalog_number text, country text,
  genres text[], styles text[], tracklist jsonb,
  total_duration_seconds int,
  format text default 'LP', rpm int default 33,
  condition text default 'VG+', notes text,
  cover_image_url text, cover_storage_path text,
  play_count int default 0, last_played_at timestamptz,
  rating float, tags text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table listening_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null, description text, occasion text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table session_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references listening_sessions(id) on delete cascade,
  record_id uuid references records(id) on delete cascade,
  "order" int not null, side text, notes text
);

create table play_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  record_id uuid references records(id) on delete cascade,
  session_id uuid references listening_sessions(id),
  played_at timestamptz default now()
);

-- Row Level Security
alter table records enable row level security;
alter table listening_sessions enable row level security;
alter table session_records enable row level security;
alter table play_history enable row level security;

create policy "user owns records" on records
  for all using (auth.uid() = user_id);
create policy "user owns sessions" on listening_sessions
  for all using (auth.uid() = user_id);
create policy "user owns session_records" on session_records
  for all using (
    session_id in (select id from listening_sessions where user_id = auth.uid())
  );
create policy "user owns play_history" on play_history
  for all using (auth.uid() = user_id);

-- Storage bucket (run in Supabase dashboard > Storage)
-- Create bucket: covers (public: true)`
