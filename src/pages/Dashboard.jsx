import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { GradientButton } from '../components/ui/GradientButton';
import { Users, CheckCircle, Clock, Building2, TrendingUp, ArrowRight, Zap, Plus } from 'lucide-react';
import { formatRelativeTime } from '../lib/utils';
import { useModal } from '../providers/ModalContext';
import { useItemsListReadrMutation, useItemsListReaderQuery } from "../backend/api/sharedCrud";
import { selectList } from "../backend/features/sharedMainState"

export function Dashboard() {
  const { openModal } = useModal();
  const [verificationsPage, setVerificationsPage] = useState(1);
  const [pageSize, setPageSize] = useState(50)

  const { data: merchantsResponse } = useItemsListReaderQuery({ entity: "merchant", page: 1 })
  const { Data: merchantsList } = merchantsResponse || {};
  const [fetchAgents, { data: agentsData, isLoading: agentsLoading }] = useItemsListReadrMutation();
  const { Data: agentList } = agentsData || {};

  const { isLoading: agentVerificationsLoading } = useItemsListReaderQuery({ entity: "agentverification", page: verificationsPage, limit: pageSize, max: pageSize });
  const { isLoading: cashNoteVerificationsLoading } = useItemsListReaderQuery({ entity: "cashnoteverification", page: verificationsPage, limit: pageSize, max: pageSize });
  const agentVerifications = useSelector(st => selectList(st, "agentverification"))
  const cashNoteVerifications = useSelector(st => selectList(st, "cashnoteverification"))

  const derivedArray = useMemo(() => {
    const agentItems = (agentVerifications || []).map(item => ({
      timestamp: item.createdAt,
      type: "agent_verification",
      description: "Agent homebase verified"
    }));
    const cashNoteItems = (cashNoteVerifications || []).map(item => ({
      timestamp: item.createdAt,
      type: "cash_note_verification",
      description: "Cash Note verified"
    }));
    const combined = [...agentItems, ...cashNoteItems];
    combined.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return combined;
  }, [agentVerifications, cashNoteVerifications]);

  useEffect(() => {
    fetchAgents({ entity: 'agent', page: 1 }).catch(err => console.log("Error =", err));
  }, [fetchAgents]);

  const { data: cashNotesResponse } = useItemsListReaderQuery({ entity: 'cashnoteverification', page: 1 });
  const { Data: cashNotesVerificationsList } = cashNotesResponse || {};

  if (agentsLoading) {
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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-green/10 to-transparent border-brand-green/20 border backdrop-blur-sm p-6 shadow-soft-lg hover:shadow-glass transition-all duration-150 hover:scale-102">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-brand opacity-80"></div>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                Verifiable Agents
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {agentList?.length || 10}
              </p>
              <div className="flex items-center gap-1 text-sm font-medium text-brand-green">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-trending-up w-4 h-4"
                >
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                  <polyline points="16 7 22 7 22 13"></polyline>
                </svg>
                <span>12%</span>
                <span className="text-slate-500 text-xs ml-1">
                  vs last month
                </span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 text-brand-green">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-users w-6 h-6"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-cyan/10 to-transparent border-brand-cyan/20 border backdrop-blur-sm p-6 shadow-soft-lg hover:shadow-glass transition-all duration-150 hover:scale-102">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-brand opacity-80"></div>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                Verified Cash Notes
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {cashNotesVerificationsList?.length || 0}
              </p>
              <div className="flex items-center gap-1 text-sm font-medium text-brand-green">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-trending-up w-4 h-4"
                >
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                  <polyline points="16 7 22 7 22 13"></polyline>
                </svg>
                <span>8%</span>
                <span className="text-slate-500 text-xs ml-1">
                  vs last month
                </span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 text-brand-cyan">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-check-circle w-6 h-6"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <path d="m9 11 3 3L22 4"></path>
              </svg>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-warning/10 to-transparent border-warning/20 border backdrop-blur-sm p-6 shadow-soft-lg hover:shadow-glass transition-all duration-150 hover:scale-102">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-brand opacity-80"></div>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                Pending Prompts
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {(agentList || []).reduce((sum, agent) => sum + ((agent.verificationSchedules || []).filter(vsch => !vsch.verified).length || 0), 0)}
              </p>
              <div className="flex items-center gap-1 text-sm font-medium text-error">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-trending-down w-4 h-4"
                >
                  <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline>
                  <polyline points="16 17 22 17 22 11"></polyline>
                </svg>
                <span>5%</span>
                <span className="text-slate-500 text-xs ml-1">
                  vs last month
                </span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 text-warning">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-clock w-6 h-6"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-accent/10 to-transparent border-brand-accent/20 border backdrop-blur-sm p-6 shadow-soft-lg hover:shadow-glass transition-all duration-150 hover:scale-102">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-brand opacity-80"></div>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                Active Merchants
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {merchantsList?.length || 2}
              </p>
              <div className="flex items-center gap-1 text-sm font-medium text-brand-green">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-trending-up w-4 h-4"
                >
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                  <polyline points="16 7 22 7 22 13"></polyline>
                </svg>
                <span>3%</span>
                <span className="text-slate-500 text-xs ml-1">
                  vs last month
                </span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 text-brand-accent">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-building2 w-6 h-6"
              >
                <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"></path>
                <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"></path>
                <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"></path>
                <path d="M10 6h4"></path>
                <path d="M10 10h4"></path>
                <path d="M10 14h4"></path>
                <path d="M10 18h4"></path>
              </svg>
            </div>
          </div>
        </div>
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
              {(derivedArray || []).map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    item.type === 'agent_verification'
                      ? 'bg-brand-green/10 text-brand-green'
                      : item.type === 'cash_note_verification'
                      ? 'bg-brand-cyan/10 text-brand-cyan'
                      : 'bg-brand-accent/10 text-brand-accent'
                  }`}>
                    {item.type === 'agent_verification' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : item.type === 'cash_note_verification' ? (
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
