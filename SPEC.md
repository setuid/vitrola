# Vitrola — Especificação Técnica v2.0
> "Seus discos. Suas histórias. Seu som."

## 1. Visão Geral

Vitrola é uma aplicação web para colecionadores de discos de vinil. Frontend estático hospedado no GitHub Pages, com Supabase como backend completo (banco de dados, autenticação e storage de imagens). Sem servidor próprio, sem Docker, sem manutenção — funciona em qualquer dispositivo com navegador.

### Princípios desta arquitetura
- **Zero manutenção**: nada para instalar, atualizar ou monitorar
- **Gratuito**: GitHub Pages + Supabase free tier + Discogs API gratuita
- **Multi-device**: celular e computador sincronizados automaticamente
- **Setup em ~10 minutos**: criar conta Supabase + fazer deploy no GitHub Pages

---

## 2. Stack Tecnológico

### Frontend (único artefato a ser desenvolvido)
- **React 18+** com TypeScript
- **Vite** como bundler
- **Tailwind CSS + shadcn/ui** para componentes
- **Framer Motion** para animações
- **TanStack Query** para cache e sincronização com Supabase
- **React Router v6** (HashRouter — compatível com GitHub Pages)
- **Zustand** para estado global
- **D3.js** para o grafo de relacionamentos

### Backend (sem código — apenas configuração)
- **Supabase** — provê tudo:
  - Banco PostgreSQL (dados da coleção e sessões)
  - Auth (login com Google ou email/senha)
  - Storage (imagens das capas)
  - Row Level Security (cada usuário vê só seus discos)

### Hospedagem
- **GitHub Pages** — deploy automático via GitHub Actions ao fazer push na main

### APIs Externas (chamadas direto do frontend)
- **Discogs API** — busca de metadados de discos (gratuita, requer cadastro)
- **Google Vision API** — OCR para reconhecimento de capa por foto (1.000 req/mês grátis)

---

## 3. Design System

### Paleta de Cores
```
--bg-primary:    #0A0A0A   /* Preto profundo */
--bg-secondary:  #111111   /* Superfícies elevadas */
--bg-card:       #1A1A1A   /* Cards */
--border:        #2A2A2A   /* Bordas sutis */
--accent-gold:   #C9A84C   /* Dourado — ação principal */
--accent-amber:  #E8B84B   /* Âmbar — hover */
--text-primary:  #F5F0E8   /* Branco quente */
--text-secondary:#9A9080   /* Cinza quente */
--text-muted:    #5A5248   /* Texto apagado */
```

### Tipografia
```
Display: "Playfair Display" — títulos e capas
Body:    "DM Sans"          — texto geral
Mono:    "JetBrains Mono"   — metadados técnicos (duração, ano, RPM)
```

### Princípios Visuais
- Dark mode premium com muito espaço negativo
- Capa do disco sempre protagoniza a interface
- Microinterações suaves em hover e transições de página
- Totalmente responsivo — mobile first

---

## 4. Módulos da Aplicação

```
Vitrola
├── 📷  Scanner         — Cadastro por foto ou busca manual
├── 📚  Shelf           — Acervo completo (CRUD)
├── 🎧  Session Planner — Montagem de planos de escuta
└── 🕸️  Vitrola Graph   — Grafo visual da discoteca
```

---

## 5. Funcionalidades

### 5.1 📷 Scanner — Cadastro de Discos

#### Fluxo: Cadastro por Foto
1. Usuário toca em "+ Adicionar Disco"
2. Escolhe [Câmera] ou [Upload de Imagem]
3. Captura/sobe a foto da capa
4. Frontend envia imagem para Google Vision API (OCR)
5. Extrai título + artista do texto reconhecido
6. Busca na Discogs API com os termos extraídos
7. Exibe lista de candidatos com thumbnail, título, artista, ano
8. Usuário seleciona o disco correto
9. Metadados preenchidos automaticamente — campos editáveis antes de salvar
10. Salva no Supabase (dados + upload da capa para Supabase Storage)

#### Fluxo: Busca Manual
1. Usuário digita título ou artista
2. Busca em tempo real na Discogs API
3. Seleciona o disco na lista de resultados
4. Confirma e salva

#### Detalhes
- Alerta de duplicata se o disco já estiver na coleção
- Scan de código de barras via câmera (busca por EAN na Discogs)
- Imagem da capa salva no Supabase Storage (fallback para URL do Discogs)

### 5.2 📚 Shelf — Gerenciamento do Acervo

#### Modos de Visualização
| Modo | Descrição |
|------|-----------|
| Grid de Capas | Grade visual com hover revelando metadados |
| Lista | Tabela ordenável por qualquer coluna |
| Por Artista | Agrupado alfabeticamente por artista |
| Por Gênero | Seções coloridas por gênero |

#### Filtros e Busca
- Busca full-text: título, artista, label, tags
- Filtros: gênero, estilo, ano (range slider), condição, RPM, tags
- Ordenação: A-Z, ano, artista, mais tocados, avaliação, data de adição
- Favoritos: marcar com estrela e filtrar

#### CRUD de Discos
- **Visualizar**: detalhe com tracklist, metadados completos e histórico de plays
- **Editar**: formulário completo com opção de re-buscar na Discogs
- **Deletar**: confirmação antes de remover
- **Avaliar**: rating de 1–5 estrelas
- **Registrar escuta**: botão "Toquei agora" — incrementa contador e salva timestamp

#### Painel de Estatísticas (topo da Shelf)
- Total de discos e horas de música
- Gêneros mais presentes (donut chart)
- Disco mais tocado e nunca ouvido
- Linha do tempo por ano de lançamento

### 5.3 🎧 Session Planner — Planos de Escuta

#### Interface
Dois painéis lado a lado (colapsável em mobile):
- **Esquerda**: Explorador com filtros
- **Direita**: Fila da sessão com drag & drop

#### Filtros do Explorador
- Gênero/Estilo, Artista, Ano/Década, Duração, Condição, Avaliação, Tags

#### Montagem e Gestão
- Arrastar disco do explorador para a fila
- Reordenar com drag & drop
- Configurar lado a tocar (A, B, ou ambos) e notas por disco
- Indicador de duração total em tempo real
- Salvar sessão com nome e ocasião (Jantar, Festa, Relaxar, Trabalho...)

#### Extras
- Templates de ocasião com filtros pré-configurados
- Histórico de sessões salvas
- Exportar sessão como PDF imprimível

### 5.4 🕸️ Vitrola Graph — Grafo da Discoteca

#### Visualização
- **Nós**: miniatura da capa de cada disco
- **Arestas**: linhas com espessura proporcional à força da relação
- **Clusters**: agrupamentos por afinidade com aura colorida de fundo
- **Engine**: D3.js force-directed layout

#### Tipos de Relação
| Tipo | Cor |
|------|-----|
| Mesmo artista | Dourado |
| Mesmo gênero | Azul |
| Mesmo estilo | Verde |
| Mesma era (±5 anos) | Roxo |
| Mesmo label | Cinza |
| Ambos favoritos | Vermelho |

#### Interações
- Zoom e pan (mouse e touch)
- Hover: destaca nó e conexões, esmaece demais
- Clique no nó: painel lateral com detalhes do disco
- Clique em "Ver relacionados": filtra o grafo para o disco selecionado
- Clique na aresta: mostra motivo da conexão
- Botão "Adicionar à Sessão" direto do grafo

#### Controles
- Toggle por tipo de relação
- Slider de força mínima de conexão
- Modo de agrupamento: gênero / artista / era
- Destacar favoritos / destacar nunca ouvidos

#### Algoritmo de Score
```
Mesmo artista            → +40 pts
Gênero principal igual   → +20 pts
Gênero secundário comum  → +10 pts
Estilo em comum          → +15 pts
Mesma era (±5 anos)      → +10 pts
Mesmo país               → +5 pts
Mesmo label              → +5 pts
Na mesma sessão salva    → +10 pts

Exibe conexão se score >= 25
```

---

## 6. Estrutura de Navegação

```
/           → Home (resumo + último disco tocado)
/shelf      → Acervo completo
/shelf/:id  → Detalhe do disco
/scanner    → Adicionar disco
/sessions   → Sessões salvas
/sessions/new    → Nova sessão
/sessions/:id    → Ver/editar sessão
/graph      → Vitrola Graph
/settings   → Configurações (chaves de API, conta)
```

> Usando HashRouter do React Router para compatibilidade com GitHub Pages (rotas com #).

---

## 7. Supabase — Schema e Configuração

### Tabelas

```sql
-- Discos
create table records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,

  discogs_id text unique,
  title text not null,
  artist text not null,
  year int,
  label text,
  catalog_number text,
  country text,

  genres text[],
  styles text[],
  tracklist jsonb,
  total_duration_seconds int,

  format text default 'LP',
  rpm int default 33,
  condition text default 'VG+',
  notes text,

  cover_image_url text,
  cover_storage_path text, -- path no Supabase Storage

  play_count int default 0,
  last_played_at timestamptz,
  rating float,
  tags text[],

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sessões de escuta
create table listening_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  occasion text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Discos dentro de uma sessão
create table session_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references listening_sessions(id) on delete cascade,
  record_id uuid references records(id) on delete cascade,
  "order" int not null,
  side text,
  notes text
);

-- Histórico de reprodução
create table play_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  record_id uuid references records(id) on delete cascade,
  session_id uuid references listening_sessions(id),
  played_at timestamptz default now()
);
```

### Row Level Security (RLS)

```sql
-- Cada usuário acessa apenas seus próprios dados
alter table records enable row level security;
alter table listening_sessions enable row level security;
alter table session_records enable row level security;
alter table play_history enable row level security;

-- Política padrão para todas as tabelas
create policy "user owns data" on records
  for all using (auth.uid() = user_id);
-- (repetir para as demais tabelas)
```

### Supabase Storage
- Bucket **covers** — público, para imagens das capas
- Organização: `covers/{user_id}/{record_id}.jpg`

---

## 8. Variáveis de Ambiente

Apenas 4 variáveis necessárias — configuradas no `.env` local e nos Secrets do GitHub:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

VITE_DISCOGS_API_KEY=seu_token_discogs

VITE_GOOGLE_VISION_API_KEY=sua_chave_vision
```

> A chave do Supabase usada no frontend é a **anon key** — segura para ser exposta, pois o RLS garante que cada usuário só acessa seus próprios dados.

---

## 9. Estrutura de Arquivos

```
vitrola/
├── public/
├── src/
│   ├── components/
│   │   ├── ui/           # shadcn/ui base
│   │   ├── record/       # RecordCard, RecordDetail, RecordForm
│   │   ├── scanner/      # CameraView, SearchResults, BarcodeScanner
│   │   ├── session/      # SessionBuilder, SessionQueue, DraggableRecord
│   │   └── graph/        # VitrolaGraph (D3), NodePanel, GraphControls
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Shelf.tsx
│   │   ├── RecordDetail.tsx
│   │   ├── Scanner.tsx
│   │   ├── Sessions.tsx
│   │   ├── SessionBuilder.tsx
│   │   ├── Graph.tsx
│   │   └── Settings.tsx
│   ├── hooks/
│   │   ├── useRecords.ts
│   │   ├── useSessions.ts
│   │   ├── useGraph.ts
│   │   └── useDiscogs.ts
│   ├── lib/
│   │   ├── supabase.ts   # Cliente Supabase
│   │   ├── discogs.ts    # Wrapper Discogs API
│   │   ├── vision.ts     # Wrapper Google Vision API
│   │   └── graph.ts      # Algoritmo de score de similaridade
│   ├── store/
│   │   └── useAppStore.ts
│   └── styles/
│       └── globals.css
├── .env.example
├── .github/
│   └── workflows/
│       └── deploy.yml    # GitHub Actions → GitHub Pages
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 10. Deploy — GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_DISCOGS_API_KEY: ${{ secrets.VITE_DISCOGS_API_KEY }}
          VITE_GOOGLE_VISION_API_KEY: ${{ secrets.VITE_GOOGLE_VISION_API_KEY }}
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## 11. Guia de Setup (para o usuário final)

### 1. Supabase (~5 min)
1. Criar conta em [supabase.com](https://supabase.com)
2. Criar novo projeto
3. Rodar o SQL do schema (seção 7) no SQL Editor
4. Ativar Auth com Google ou Email
5. Criar bucket `covers` no Storage
6. Copiar Project URL e anon key das Settings

### 2. Discogs API (~2 min)
1. Criar conta em [discogs.com](https://discogs.com)
2. Ir em Settings → Developers → Generate Token
3. Copiar o token

### 3. Google Vision API (~3 min)
1. Acessar [Google Cloud Console](https://console.cloud.google.com)
2. Criar projeto → Ativar Cloud Vision API
3. Criar API Key em Credentials

> Free tier: 1.000 requisições/mês — suficiente para cadastrar ~1.000 discos

### 4. GitHub (~2 min)
1. Fazer fork ou push do repositório
2. Ir em Settings → Secrets → Actions
3. Adicionar as 4 variáveis de ambiente
4. Ativar GitHub Pages apontando para a branch `gh-pages`

> **Total: ~12 minutos de setup, zero manutenção depois disso.**

---

## 12. Funcionalidades Futuras (Fase 2)

- **AI Curator**: assistente Claude API que sugere sessões de escuta com base no acervo
- **Disco do Dia**: destaque diário na home com curiosidades históricas
- **Modo Exposição**: tela cheia para quando estiver recebendo visitas
- **Importação Discogs CSV**: para quem já tem coleção cadastrada lá
- **PWA**: app instalável no celular com ícone na tela inicial
- **Compartilhamento**: link público para mostrar sua coleção ou uma sessão

---

*Vitrola v2.0 — Março 2026*
