import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboard } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { KPICard } from '../components/ui/KPICard';
import { GradientButton } from '../components/ui/GradientButton';
import { Users, CheckCircle, Clock, Building2, TrendingUp, ArrowRight, Zap, Plus } from 'lucide-react';
import { formatRelativeTime } from '../lib/utils';
import { useModal } from '../contexts/ModalContext';
import type { DashboardKPIs, ActivityItem } from '../types';

export function Dashboard() {
  const { openModal } = useModal();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();

    const handleAgentCreated = () => {
      loadData();
    };

    window.addEventListener('agentCreated', handleAgentCreated as EventListener);
    return () => window.removeEventListener('agentCreated', handleAgentCreated as EventListener);
  }, []);

  async function loadData() {
    try {
      const [kpisData, activityData] = await Promise.all([
        dashboard.getKPIs(),
        dashboard.getRecentActivity(10)
      ]);

      setKpis(kpisData);
      setActivity(activityData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="-m-6 lg:-m-8 mb-6 lg:mb-8 h-48 bg-gradient-brand animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="-m-6 lg:-m-8 mb-0 relative overflow-hidden bg-gradient-brand rounded-b-3xl shadow-glow">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />

        <div className="relative px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Zap className="w-10 h-10" />
                FlowSwitch Command
              </h1>
              <p className="text-white/90 text-lg">
                Monitor and manage your agent network in real-time
              </p>
            </div>
            <GradientButton
              variant="outline"
              size="lg"
              className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
              onClick={() => openModal('addAgent')}
            >
              <Plus className="w-5 h-5" />
              New Agent
            </GradientButton>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Verifiable Agents"
          value={kpis?.verifiable_agents || 0}
          trend={{ value: 12, positive: true }}
          icon={<Users className="w-6 h-6" />}
          color="green"
        />
        <KPICard
          title="Verified Cash Notes"
          value={kpis?.verified_cash_notes || 0}
          trend={{ value: 8, positive: true }}
          icon={<CheckCircle className="w-6 h-6" />}
          color="cyan"
        />
        <KPICard
          title="Pending Prompts"
          value={kpis?.pending_prompts || 0}
          trend={{ value: 5, positive: false }}
          icon={<Clock className="w-6 h-6" />}
          color="warning"
        />
        <KPICard
          title="Active Merchants"
          value={kpis?.active_merchants || 0}
          trend={{ value: 3, positive: true }}
          icon={<Building2 className="w-6 h-6" />}
          color="accent"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 shadow-soft-lg border-slate-200/50 dark:border-slate-800/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-green" />
                Recent Activity
              </CardTitle>
              <Link to="/agents">
                <button className="text-sm text-brand-accent hover:text-brand-cyan transition-colors font-medium">
                  View all
                </button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activity.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    item.type === 'verification'
                      ? 'bg-brand-green/10 text-brand-green'
                      : item.type === 'cash_note'
                      ? 'bg-brand-cyan/10 text-brand-cyan'
                      : 'bg-brand-accent/10 text-brand-accent'
                  }`}>
                    {item.type === 'verification' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : item.type === 'cash_note' ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {item.description}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {formatRelativeTime(item.timestamp)}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-accent transition-colors opacity-0 group-hover:opacity-100" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-soft-lg border-slate-200/50 dark:border-slate-800/50">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link to="/agents">
                <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-brand-green/10 to-brand-cyan/10 hover:from-brand-green/20 hover:to-brand-cyan/20 border border-brand-green/20 text-left transition-all hover:scale-102 group">
                  <div className="w-10 h-10 rounded-lg bg-gradient-brand flex items-center justify-center text-white shadow-glow">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white text-sm">View All Agents</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Manage your network</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-accent transition-colors" />
                </button>
              </Link>

              <Link to="/reports">
                <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left transition-all hover:scale-102 group">
                  <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white text-sm">AI Reports</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Generate insights</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-accent transition-colors" />
                </button>
              </Link>

              <Link to="/merchants">
                <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left transition-all hover:scale-102 group">
                  <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white text-sm">Merchants</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">View partners</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-accent transition-colors" />
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
