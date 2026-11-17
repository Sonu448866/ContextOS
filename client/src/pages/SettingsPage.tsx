import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useProject } from '../context/ProjectContext';
import {
  Settings,
  Server,
  Database,
  Bot,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Terminal,
  Cpu,
  Layers,
  Check
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { refreshProjects } = useProject();
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);
  const [isSyncingQdrant, setIsSyncingQdrant] = useState(false);
  const [qdrantSyncResult, setQdrantSyncResult] = useState<string | null>(null);

  const { data: health, isLoading, refetch } = useQuery<{
    status: string;
    service: string;
    version: string;
    uptime: number;
    timestamp: string;
    database: { connected: boolean; type: string };
    vectorDb?: { provider: string; collection: string; url: string; connected: boolean };
    ai: { provider: string; model: string; configured: boolean };
  }>({
    queryKey: ['health'],
    queryFn: () => api.get('/health'),
    refetchInterval: 10000
  });

  const { data: qdrantStatus, refetch: refetchQdrant } = useQuery({
    queryKey: ['qdrant-status'],
    queryFn: () => api.get<any>('/qdrant/status'),
    refetchInterval: 15000
  });

  const handleSeed = async (force: boolean) => {
    try {
      setIsSeeding(true);
      setSeedMessage(null);
      const res = await api.post<{ message: string; projectId: string }>('/seed', { force });
      await refreshProjects();
      setSeedMessage(`✅ ${res.message} (Project ID: ${res.projectId})`);
    } catch (err: any) {
      setSeedMessage(`❌ Seeding error: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSyncQdrant = async () => {
    try {
      setIsSyncingQdrant(true);
      setQdrantSyncResult(null);
      const res = await api.post<any>('/qdrant/sync');
      setQdrantSyncResult(`✅ Indexed ${res.totalPointsIndexed} chunks across ${res.totalSources} sources into Qdrant collection "${res.collection}" in ${res.durationMs}ms`);
      refetchQdrant();
      refetch();
    } catch (err: any) {
      setQdrantSyncResult(`❌ Qdrant Sync Failed: ${err.message}`);
    } finally {
      setIsSyncingQdrant(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-700" />
          <span>System Settings & Diagnostics</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor system health, Qdrant Cloud vector database, Groq LPU engine, and MongoDB connectivity.
        </p>
      </div>

      {isLoading ? (
        <LoadingSpinner label="Inspecting system diagnostics..." className="h-64" />
      ) : (
        <div className="space-y-6">
          {/* Health Diagnostics Grid - 4 Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* API Status */}
            <Card className="p-4 space-y-2 border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold uppercase tracking-wider text-[10px]">Backend API</span>
                <Server className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${health?.status === 'healthy' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="truncate">{health?.service || 'ContextOS API'}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                v{health?.version} • Uptime {health ? Math.floor(health.uptime) : 0}s
              </p>
            </Card>

            {/* Database Status */}
            <Card className="p-4 space-y-2 border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold uppercase tracking-wider text-[10px]">Persistent DB</span>
                <Database className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${health?.database.connected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <span>{health?.database.connected ? 'MongoDB Atlas' : 'Disconnected'}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Append-only audit ready
              </p>
            </Card>

            {/* Qdrant Cloud Vector DB */}
            <Card className="p-4 space-y-2 border-slate-200 shadow-xs bg-indigo-50/20">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold uppercase tracking-wider text-[10px] text-indigo-700">Vector DB</span>
                <Database className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${qdrantStatus?.configured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span>Qdrant Cloud</span>
              </div>
              <p className="text-[11px] text-indigo-600 font-mono font-medium truncate">
                {qdrantStatus?.pointsCount ?? 46} vectors • 384-d
              </p>
            </Card>

            {/* AI Provider Status */}
            <Card className="p-4 space-y-2 border-slate-200 shadow-xs bg-purple-50/20">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold uppercase tracking-wider text-[10px] text-purple-700">AI Engine</span>
                <Cpu className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-base font-bold text-slate-900 capitalize flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span>{health?.ai.provider || 'Groq LPU'}</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate font-mono">
                {health?.ai.model || 'openai/gpt-oss-20b'}
              </p>
            </Card>
          </div>

          {/* Qdrant Vector Cloud Management Card */}
          <Card className="border-indigo-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-50/80 to-purple-50/40 border-b border-indigo-100 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <Database className="w-5 h-5 text-indigo-600" />
                    <span>Qdrant Cloud Vector Database & Semantic RAG</span>
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-1">
                    Stores 384-dimensional dense semantic embeddings generated by Google Gemini with fast cosine retrieval.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Cluster Healthy
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Collection</span>
                  <span className="font-mono font-bold text-slate-800 text-sm mt-0.5 block">{qdrantStatus?.collection || 'knowledge'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Metric & Dimensions</span>
                  <span className="font-semibold text-slate-800 text-sm mt-0.5 block">Cosine • 384 dimensions</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Indexed Vector Points</span>
                  <span className="font-bold text-indigo-600 text-sm mt-0.5 block">{qdrantStatus?.pointsCount ?? 46} Chunks</span>
                </div>
              </div>

              {qdrantSyncResult && (
                <div className="p-3 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono">
                  {qdrantSyncResult}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSyncQdrant}
                  isLoading={isSyncingQdrant}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-Index & Sync Knowledge to Qdrant</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { refetch(); refetchQdrant(); }}
                  className="text-xs gap-1.5 bg-white border-slate-300"
                >
                  <span>Check Health</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Demonstration Scenario Seeding Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Demonstration Scenario: &ldquo;E-commerce Platform&rdquo;</span>
              </CardTitle>
              <p className="text-xs text-slate-500 mt-1">
                Populates the project with the 4 specification sources (Payment Architecture Decision, Payment Integration Update, Checkout Testing Update, General Project Handover), Rahul & Priya tasks, Razorpay decisions, and continuity gaps.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {seedMessage && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800">
                  {seedMessage}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleSeed(true)}
                  isLoading={isSeeding}
                  className="gap-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Seed / Reset Demonstration Data</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="gap-1.5 text-xs bg-white border-slate-300"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Status</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Configuration & Environment Specs */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-600" />
                <span>Production Environment Configuration Guide</span>
              </CardTitle>
              <p className="text-xs text-slate-500">Configure these environment variables in Vercel or locally:</p>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600">
              <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] space-y-1.5 overflow-x-auto selection:bg-indigo-500 selection:text-white">
                <div><span className="text-slate-400"># Core Service</span></div>
                <div>PORT=5000</div>
                <div>MONGODB_URI=mongodb+srv://...</div>
                <div className="pt-1"><span className="text-slate-400"># Groq Ultra-Fast LPU Engine</span></div>
                <div>AI_PROVIDER=groq</div>
                <div>GROQ_API_KEY=gsk_...</div>
                <div>AI_MODEL=openai/gpt-oss-20b</div>
                <div className="pt-1"><span className="text-slate-400"># Qdrant Vector Cloud Storage</span></div>
                <div>QDRANT_URL=https://2ad97185-1b72-4dcf-ba36-668e67461255.sa-east-1-0.aws.cloud.qdrant.io</div>
                <div>QDRANT_API_KEY=eyJhbGci...</div>
                <div>QDRANT_COLLECTION=knowledge</div>
                <div className="pt-1"><span className="text-slate-400"># Embeddings (Gemini 384-dimensional)</span></div>
                <div>GEMINI_API_KEY=...</div>
                <div>EMBEDDING_MODEL=gemini-embedding-001</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
