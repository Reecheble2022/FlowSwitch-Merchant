import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { agents as agentsApi } from '../lib/api';
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

export function AgentDetail() {
  const { id } = useParams();
  const [agent, setAgent] = useState(null);
  const [verifications, setVerifications] = useState([]);
  const [cashNotes, setCashNotes] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [floatLedger, setFloatLedger] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadAgentData();
    }
  }, [id]);

  async function loadAgentData() {
    if (!id) { return; }

    setLoading(true);
    try {
      const [agentData, verificationsData, cashNotesData, promptsData, floatData] = await Promise.all([
        agentsApi.getById(id),
        agentsApi.getVerifications(id),
        agentsApi.getCashNotes(id),
        agentsApi.getPrompts(id),
        agentsApi.getFloatLedger(id, 1, 20),
      ]);
      setAgent(agentData);
      setVerifications(verificationsData);
      setCashNotes(cashNotesData);
      setPrompts(promptsData);
      setFloatLedger(floatData.data);
    } catch (error) {
      console.error('Failed to load agent data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCashNote(noteId, verified) {
    try {
      await agentsApi.verifyCashNote(noteId, verified);
      await loadAgentData();
    } catch (error) {
      console.error('Failed to verify cash note:', error);
    }
  }

  async function handleUpdatePromptStatus(promptId, status) {
    try {
      await agentsApi.updatePromptStatus(promptId, status);
      await loadAgentData();
    } catch (error) {
      console.error('Failed to update prompt status:', error);
    }
  }

  if (loading || !agent) {
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
            {agent.first_name} {agent.last_name}
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
                {agent.first_name[0]}{agent.last_name[0]}
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
                <p className="text-sm font-mono text-slate-900 dark:text-slate-100">{agent.national_id}</p>
              </div>

              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Phone</p>
                <p className="text-sm font-mono text-slate-900 dark:text-slate-100">{agent.phone}</p>
              </div>

              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Merchant</p>
                <p className="text-sm text-slate-900 dark:text-slate-100">{agent.merchant?.name || 'N/A'}</p>
              </div>

              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Last Seen</p>
                <p className="text-sm text-slate-900 dark:text-slate-100">{formatRelativeTime(agent.last_seen_at)}</p>
              </div>

              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Joined</p>
                <p className="text-sm text-slate-900 dark:text-slate-100">{formatDate(agent.created_at)}</p>
              </div>

              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Verifications</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{agent.verification_count}</p>
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
                <p className="text-3xl font-bold text-green-600 tabular-nums">{agent.verified_prompts_count}</p>
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
              {verifications.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-400">No verifications yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {verifications.map((verification) => (
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
                          {formatDateTime(verification.verified_at)}
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
              {cashNotes.length === 0 ? (
                <div className="text-center py-12">
                  <Wallet className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-400">No cash notes yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cashNotes.map((note) => (
                    <div
                      key={note.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                            {formatCurrency(note.amount, note.currency)}
                          </p>
                          <Badge className={note.verified ? getStatusColor('verified') : getStatusColor('pending')}>
                            {note.verified ? 'Verified' : 'Pending'}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          Receipt: {note.receipt_id}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {formatDateTime(note.created_at)}
                        </p>
                      </div>

                      {!note.verified && (
                        <Button
                          size="sm"
                          onClick={() => handleVerifyCashNote(note.id, true)}
                        >
                          Verify
                        </Button>
                      )}
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
                    {formatCurrency(floatBalance, 'UGX')}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {floatLedger.length === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-400">No float entries yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {floatLedger.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Badge className={entry.type === 'credit' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}>
                            {entry.type}
                          </Badge>
                          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                            {entry.type === 'credit' ? '+' : '-'}{formatCurrency(entry.amount, entry.currency)}
                          </p>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {entry.reference}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {formatDateTime(entry.created_at)}
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
              {prompts.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-400">No prompts yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {prompts.map((prompt) => (
                    <div
                      key={prompt.id}
                      className="flex items-start justify-between gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {prompt.prompt_text}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getStatusColor(prompt.status)}>
                            {prompt.status}
                          </Badge>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDateTime(prompt.created_at)}
                          </span>
                        </div>
                      </div>

                      {prompt.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleUpdatePromptStatus(prompt.id, 'verified')}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleUpdatePromptStatus(prompt.id, 'rejected')}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
