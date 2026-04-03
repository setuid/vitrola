import { HashRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from '@/components/layout/Layout'
import { Home } from '@/pages/Home'
import { Shelf } from '@/pages/Shelf'
import { RecordDetail } from '@/pages/RecordDetail'
import { RecordEdit } from '@/pages/RecordEdit'
import { Scanner } from '@/pages/Scanner'
import { Sessions } from '@/pages/Sessions'
import { SessionBuilder } from '@/pages/SessionBuilder'
import { SessionView } from '@/pages/SessionView'
import { Graph } from '@/pages/Graph'
import { Settings } from '@/pages/Settings'
import { SharedCollection } from '@/pages/SharedCollection'
import { SharedSession } from '@/pages/SharedSession'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <Routes>
          {/* Public routes — no auth, no navbar */}
          <Route path="/shared/session/:token" element={<SharedSession />} />
          <Route path="/shared/:token" element={<SharedCollection />} />

          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/shelf" element={<Shelf />} />
            <Route path="/shelf/:id" element={<RecordDetail />} />
            <Route path="/shelf/:id/edit" element={<RecordEdit />} />
            <Route path="/scanner" element={<Scanner />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/sessions/new" element={<SessionBuilder />} />
            <Route path="/sessions/:id" element={<SessionView />} />
            <Route path="/sessions/:id/edit" element={<SessionBuilder />} />
            <Route path="/graph" element={<Graph />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </HashRouter>
    </QueryClientProvider>
  )
}
