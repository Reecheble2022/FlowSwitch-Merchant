import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { agents as agentsApi, merchants as merchantsApi } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Users, Search, Download, FileSpreadsheet, Printer, Eye, Plus } from 'lucide-react';
import { formatRelativeTime, getCategoryColor, getStatusColor } from '../lib/utils';
import { exportToCSV, exportToXLSX, printTable } from '../lib/export';
import { useModal } from '../providers/ModalContext';
import type { Agent, Merchant } from '../types';

export function AgentsList() {
  const { openModal } = useModal();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMerchant, setFilterMerchant] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const pageSize = 20;

  useEffect(() => {
    loadMerchants();

    const handleAgentCreated = () => {
      loadAgents();
    };

    window.addEventListener('agentCreated', handleAgentCreated as EventListener);
    return () => window.removeEventListener('agentCreated', handleAgentCreated as EventListener);
  }, []);

  useEffect(() => {
    loadAgents();
  }, [searchQuery, filterStatus, filterMerchant, page]);

  async function loadMerchants() {
    try {
      const data = await merchantsApi.list();
      setMerchants(data);
    } catch (error) {
      console.error('Failed to load merchants:', error);
    }
  }

  async function loadAgents() {
    setLoading(true);
    try {
      const { data, count } = await agentsApi.list({
        query: searchQuery || undefined,
        status: filterStatus || undefined,
        merchantId: filterMerchant || undefined,
        page,
        pageSize,
      });

      setAgents(data);
      setTotalCount(count);
    } catch (error) {
      console.error('Failed to load agents:', error);
    } finally {
      setLoading(false);
    }
  }

  function prepareExportData() {
    return agents.map(agent => ({
      first_name: agent.first_name,
      last_name: agent.last_name,
      phone: agent.phone,
      email: agent.email || '',
      national_id: agent.national_id || '',
      nationality: agent.nationality || '',
      gender: agent.gender || '',
      status: agent.status,
      created_at: new Date(agent.created_at).toLocaleDateString(),
    }));
  }

  function handleExportCSV() {
    const exportData = prepareExportData();
    const filters = {
      search: searchQuery,
      status: filterStatus,
      merchant: filterMerchant,
    };
    exportToCSV(exportData, 'agents', filters);
  }

  function handleExportXLSX() {
    const exportData = prepareExportData();
    const filters = {
      search: searchQuery,
      status: filterStatus,
      merchant: filterMerchant,
    };
    exportToXLSX(exportData, 'agents', filters);
  }

  function handlePrint() {
    const exportData = prepareExportData();
    const filters = {
      search: searchQuery,
      status: filterStatus,
      merchant: filterMerchant,
    };
    printTable(exportData, 'FlowSwitch Agents', filters);
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">
            Agents
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {totalCount} total agents
          </p>
        </div>
        <Button
          onClick={() => openModal('addAgent')}
          className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:shadow-lg hover:shadow-emerald-500/50"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Agent
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by name, ID, or phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="h-10 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1F6FEB]"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            value={filterMerchant}
            onChange={(e) => {
              setFilterMerchant(e.target.value);
              setPage(1);
            }}
            className="h-10 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1F6FEB]"
          >
            <option value="">All Merchants</option>
            {merchants.map((merchant) => (
              <option key={merchant.id} value={merchant.id}>
                {merchant.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportXLSX}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export XLSX
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Photo
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  First Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Last Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Agent ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Merchant
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Last Seen
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <div className="inline-block w-6 h-6 border-2 border-[#1F6FEB] border-t-transparent rounded-full animate-spin" />
                  </td>
                </tr>
              ) : agents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-600 dark:text-slate-400">
                      No agents yet. Add or import to get started.
                    </p>
                  </td>
                </tr>
              ) : (
                agents.map((agent) => (
                  <tr
                    key={agent.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {agent.first_name[0]}{agent.last_name[0]}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                      {agent.first_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                      {agent.last_name}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getCategoryColor(agent.category)}>
                        {agent.category}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-600 dark:text-slate-400">
                      {agent.national_id}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-600 dark:text-slate-400">
                      {agent.phone}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                      {agent.merchant?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getStatusColor(agent.status)}>
                        {agent.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {formatRelativeTime(agent.last_seen_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/agents/${agent.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} agents
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
