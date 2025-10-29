import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  ArrowLeft,
  MapPin,
  User,
  TrendingUp,
  Wallet,
  FileText,
} from 'lucide-react';
import {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatCurrency,
  getCategoryColor,
  getStatusColor,
} from '../lib/utils';
import { useItemDetailsViewrMutation } from "../backend/api/sharedCrud"
import { selectOneItemByGuid } from "../backend/features/sharedMainState"
import { useAgentVerificationScheduling } from "../providers/agentVerificationScheduleProvider";

export function AgentDetail() {
  const { id, guid } = useParams();
  const [floatLedger, setFloatLedger] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const { scheduleAgentVerificationForOneAgent } = useAgentVerificationScheduling();

  const [fetchAgentDetailsFn, {
    isLoading: agentDetailsLoading,
    isSuccess: agentDetailsFetchSucceeded,
    isError: agentDetailsFetchFailed
  }] = useItemDetailsViewrMutation()

  const {va: agent} = useSelector(st => selectOneItemByGuid(st, "agent", (id || guid))) || {}

  console.log("<>-agent =", agent)

  useEffect(() => {
    if (id || guid) {
      fetchAgentDetailsFn({ entity: "agent", guid: guid || id });
    }
  }, [id, guid]);

  async function handleVerifyCashNote(noteId, verified) {
    try {
      // await agentsApi.verifyCashNote(noteId, verified);
      //TODO: Opene cash note verifcation prompt
    } catch (error) {
      console.error('Failed to verify cash note:', error);
    }
  }

  async function handleUpdatePromptStatus(promptId, status) {
    try {
      // await agentsApi.updatePromptStatus(promptId, status);
      //TODO: implement
    } catch (error) {
      console.error('Failed to update prompt status:', error);
    }
  }

  if (agentDetailsLoading && !agent) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-2 border-[#1F6FEB] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'verifications', label: 'Verifications', icon: MapPin },
    { id: 'cash', label: 'Cash Notes', icon: Wallet },
    { id: 'float', label: 'Float Ledger', icon: TrendingUp },
    { id: 'prompts', label: 'Prompts', icon: FileText },
  ];

  const floatBalance = floatLedger.reduce((sum, entry) => {
    return sum + (entry.type === 'credit' ? entry.amount : -entry.amount);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/agents">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold gradient-text">
            {agent.firstName} {agent.lastName}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Agent Details
          </p>
        </div>
      </div>

      {/* Agent Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-brand flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-white">
                {(agent.firstName || "x")[0]}{(agent.lastName || "x")[0]}
              </span>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Category</p>
                <Badge className={getCategoryColor(agent.category)}>{agent.category}</Badge>
              </div>

              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Status</p>
                <Badge className={getStatusColor(agent.status)}>{agent.status}</Badge>
              </div>

              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Agent ID</p>
                <p className="text-sm font-mono text-slate-900 dark:text-slate-100">{agent.ussdCode}</p>
              </div>

              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Phone</p>
                <p className="text-sm font-mono text-slate-900 dark:text-slate-100">{agent.phone}</p>
              </div>

              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Merchant</p>
                <p className="text-sm text-slate-900 dark:text-slate-100">{agent.merchantGuid?.name || 'FLSW'}</p>
              </div>

              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Last Seen</p>
                <p className="text-sm text-slate-900 dark:text-slate-100">{formatRelativeTime(agent.last_seen_at)}</p>
              </div>

              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Joined</p>
                <p className="text-sm text-slate-900 dark:text-slate-100">{formatDate(agent.createdAt)}</p>
              </div>

              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Verifications</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{(agent.verifications || []).length}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="flex gap-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === tab.id
                    ? 'border-brand-green text-brand-green dark:border-brand-cyan dark:text-brand-cyan'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium text-sm whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="pb-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Verified Prompts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600 tabular-nums">{(agent?.verifications || []).length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pending Prompts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-yellow-600 tabular-nums">{agent.pending_prompts_count}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Last Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg text-slate-900 dark:text-slate-100">
                  {formatRelativeTime(agent.last_verification_date)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'verifications' && (
          <Card>
            <CardHeader>
              <CardTitle>Verification History</CardTitle>
            </CardHeader>
            <CardContent>
              {(agent?.verifications || []).length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-400">No verifications yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(agent?.verifications || []).map((verification) => (
                    <div
                      key={verification.guid}
                      className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                    >
                      <MapPin className="w-5 h-5 text-brand-accent mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          GPS: {verification.latitude.toFixed(6)}, {verification.longitude.toFixed(6)}
                        </p>
                        {verification.notes && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {verification.notes}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                          {formatDateTime(verification.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'cash' && (
          <Card>
            <CardHeader>
              <CardTitle>Cash Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {(agent?.cashNoteVerifications || []).length === 0 ? (
                <div className="text-center py-12">
                  <Wallet className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-400">No cash notes yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(agent?.cashNoteVerifications || []).map((note) => (
                    <div
                      key={note.guid}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                            {formatCurrency(note.amount || note.noteValue, note.currency || "ZAR")}
                          </p>
                          <Badge className={getStatusColor('verified')}>
                            Verified
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          Serial Number: {note.serialNumber}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {formatDateTime(note.createdAt)}
                        </p>
                        <div className="w-full py-2">
                          <img src={note.notePhoto} className="w-full h-auto"/>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'float' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Float Ledger</CardTitle>
                <div className="text-right">
                  <p className="text-xs text-slate-600 dark:text-slate-400">Current Balance</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {formatCurrency(((agent?.wallets || []).length ? agent?.wallets[0].floatFiatBalance : 0), ((agent?.wallets || []).length ? agent?.wallets[0].fiatCurrency || "ZAR": "ZAR"))}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {(agent?.wallets || []).length === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-400">No float entries yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(agent?.wallets || []).map((entry) => (
                    <div
                      key={entry.guid}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Badge className={entry.type === 'credit' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}>
                            {entry.type || "credit"}
                          </Badge>
                          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                            {entry.type === 'credit' ? '-' : '+'}{formatCurrency(entry.floatFiatBalance, entry.fiatCurrency)}
                          </p>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {entry.reference}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {formatDateTime(entry.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'prompts' && (
          <Card>
            <CardHeader>
              <CardTitle>Prompt Verifications</CardTitle>
            </CardHeader>
            <CardContent>
              {(agent?.verificationSchedules || []).length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-400">No prompts yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(agent?.verificationSchedules || []).map((prompt) => (
                    <div
                      key={prompt.guid}
                      className="flex items-start justify-between gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {prompt.prompt_text || `${prompt.verified? "Verified":"Scheduled"} prompt`}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getStatusColor(prompt.verified? "verified" : "pending")}>
                            {prompt.verified? "verified" : "pending"}
                          </Badge>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDateTime(prompt.createdAt)}
                          </span>
                        </div>
                      </div>

                      {prompt.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleUpdatePromptStatus(prompt.guid, 'verified')}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleUpdatePromptStatus(prompt.guid, 'rejected')}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="w-full items-end">
                <button onClick={() => scheduleAgentVerificationForOneAgent(agent)} className="bg-blue-100 rounded-lg px-4 py-2">
                  Prompt {agent?.firstName} {agent?.lastName} 
                </button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
