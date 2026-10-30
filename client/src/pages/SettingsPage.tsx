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
  Cpu
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { refreshProjects } = useProject();
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const { data: health, isLoading, refetch } = useQuery<{
    status: string;
    service: string;
    version: string;
    uptime: number;
    timestamp: string;
    database: { connected: boolean; type: string };
    ai: { provider: string; model: string; configured: boolean };
  }>({
    queryKey: ['health'],
    queryFn: () => api.get('/health'),
    refetchInterval: 10000
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-700" />
          <span>System Settings & Diagnostics</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor system health, AI provider configuration, database connectivity, and seed demo records.
        </p>
      </div>

      {isLoading ? (
        <LoadingSpinner label="Inspecting system diagnostics..." className="h-64" />
      ) : (
        <div className="space-y-6">
          {/* Health Diagnostics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* API Status */}
            <Card className="p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold uppercase tracking-wider">Backend API</span>
                <Server className="w-4 h-4 text-brand-600" />
              </div>
              <div className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${health?.status === 'healthy' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span>{health?.service || 'ContextOS API'}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Version {health?.version} • Uptime {health ? Math.floor(health.uptime) : 0}s
              </p>
            </Card>

            {/* Database Status */}
            <Card className="p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold uppercase tracking-wider">Persistent DB</span>
                <Database className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${health?.database.connected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <span>{health?.database.connected ? 'Connected' : 'Disconnected'}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {health?.database.type} Atlas Compatible
              </p>
            </Card>

            {/* AI Provider Status */}
            <Card className="p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold uppercase tracking-wider">AI Service</span>
                <Bot className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-lg font-bold text-slate-900 capitalize flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span>{health?.ai.provider || 'AI Provider'}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Model: <code className="font-mono">{health?.ai.model}</code>
              </p>
            </Card>
          </div>

          {/* Demonstration Scenario Seeding Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Assessment Demonstration Scenario: &ldquo;E-commerce Platform&rdquo;</span>
              </CardTitle>
              <p className="text-xs text-slate-500 mt-1">
                Populates the project with the 4 specification sources (Payment Architecture Decision, Payment Integration Update, Checkout Testing Update, General Project Handover), Rahul & Priya tasks, Razorpay decisions, and context gaps.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {seedMessage && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800">
                  {seedMessage}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleSeed(true)}
                  isLoading={isSeeding}
                  className="gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Seed / Reset Demonstration Data</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="gap-1.5 text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Status</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Configuration & Environment Specs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Environment Variables Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600">
              <p>Configure the following in your local <code>.env</code> file:</p>
              <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] space-y-1">
                <div>PORT=5000</div>
                <div>MONGODB_URI=mongodb://localhost:27017/contextos</div>
                <div>AI_PROVIDER=gemini # or openai, anthropic, mock</div>
                <div>AI_API_KEY=&lt;your-key&gt;</div>
                <div>AI_MODEL=gemini-1.5-flash</div>
                <div>LOG_LEVEL=info</div>
                <div>LOG_FILE_PATH=logs/app.log</div>
                <div>MAX_UPLOAD_SIZE_MB=10</div>
                <div>STALE_TASK_DAYS=14</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
