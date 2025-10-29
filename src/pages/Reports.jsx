import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { FileText, Download, Copy, MapPin, AlertCircle } from 'lucide-react';
import { buildAgentReport, buildPortfolioReport } from '../services/reportBuilder';
import { useItemDetailsViewrMutation, useItemsListReadrMutation } from "../backend/api/sharedCrud"
import { selectList, selectOneItemByGuid } from "../backend/features/sharedMainState"

export function Reports() {
  const [selectedMerchantGuid, setSelectedMerchantGuid] = useState('');
  const [selectedAgentGuid, setSelectedAgentGuid] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [portfolioReport, setPortfolioReport] = useState(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const [fetchMerchantsFn, {
    isLoading: merchantsLoading,
    isSuccess: merchantsFetchSucceeded,
    isError: merchantsFetchFailed
  }] = useItemsListReadrMutation()

  const [fetchAgentsFn, {
    isLoading: agentsLoading,
    isSuccess: agentsFetchSucceeded,
    isError: agentsFetchFailed
  }] = useItemsListReadrMutation()

  const [fetchAgentDetailsFn, {
    isLoading: agentDetailsLoading,
    isSuccess: agentDetailsFetchSucceeded,
    isError: agentDetailsFetchFailed
  }] = useItemDetailsViewrMutation()

  const [fetchAgentVerificationsFn, {
    isLoading: agentVerificationsLoading,
    isSuccess: agentVerificationsFetchSucceeded,
    isError: agentVerificationsFetchFailed
  }] = useItemsListReadrMutation()

  const merchants = useSelector(st => selectList(st, "merchant"))
  const agents = useSelector(st => selectList(st, "agent"))

  useEffect(() => {
    loadData(page);
  }, [page]);

  const loadData = async (page) => {
    // fetchAgentsFn({ entity: "agent", page });
    fetchMerchantsFn({ entity: "merchant", page });
  }

  async function handleBuildReport() {
    setLoading(true);
    setReport(null);
    setPortfolioReport(null);
    setError('');

    try {
      if (selectedAgentGuid) {
        const dateRange = startDate && endDate ? { start: startDate, end: endDate } : undefined;
        const agentReport = await buildAgentReport(dateRange, (agents || []).find(agt => agt.guid === selectedAgentGuid));
        if (agentReport) {
          setReport(agentReport);
        } else {
          setError('No verification data found for selected agent. Agent must have GPS-verified locations to generate a report.');
        }
      } else {
        const filters = {
          merchantId: selectedMerchantGuid || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        };
        const portfolio = await buildPortfolioReport(filters, agents);
        setPortfolioReport(portfolio);
      }
    } catch (err) {
      console.error('Failed to build report:', err);
      setError('Failed to build report. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleCopyJSON() {
    const data = report || portfolioReport;
    if (data) {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    }
  }

  function handleExport() {
    const data = report || portfolioReport;
    if (!data) return;

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowswitch-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">
          AI Report Builder
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Generate intelligent reports from verification data with offline reverse-geocoding
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Filters */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Report Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Merchant (optional)
              </label>
              <select
                value={selectedMerchantGuid}
                onChange={(e) => {
                  const merchantGuid = e.target.value
                  setSelectedMerchantGuid(merchantGuid);
                  fetchAgentsFn({ entity: "agent", filters: { merchantGuid } })
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="">All Merchants</option>
                {(merchants || []).map(m => (
                  <option key={m.guid} value={m.guid}>{m.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Agent (optional)
              </label>
              <select
                value={selectedAgentGuid}
                disabled={merchantsLoading || agentsLoading}
                onChange={(e) => setSelectedAgentGuid(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="">{(merchantsLoading || agentsLoading) ? "Loading..." : "Portfolio Report (All Agents)"}</option>
                {(agents || []).map(agent => (
                  <option key={agent.guid} value={agent.guid}>
                    {agent.firstName} {agent.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Start Date (optional)
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                End Date (optional)
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <Button
              onClick={handleBuildReport}
              disabled={loading}
              className="w-full"
            >
              <FileText className="w-4 h-4" />
              {loading ? 'Building Report...' : 'Build Report'}
            </Button>

            {(report || portfolioReport) && (
              <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button
                  variant="outline"
                  onClick={handleCopyJSON}
                  className="w-full"
                >
                  <Copy className="w-4 h-4" />
                  Copy JSON
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExport}
                  className="w-full"
                >
                  <Download className="w-4 h-4" />
                  Export JSON
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Panel - Report Display */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-error/10 border border-error/30">
                  <AlertCircle className="w-5 h-5 text-error mt-0.5" />
                  <div>
                    <p className="font-medium text-error">Unable to Generate Report</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!report && !portfolioReport && !loading && !error && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400 text-lg">
                    Configure filters and click "Build Report" to generate an AI-powered analysis
                  </p>
                  <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">
                    Reports include geospatial clustering, movement analysis, and location intelligence
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {loading && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">
                    Analyzing verification data and computing geospatial clusters...
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {report && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Report Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-brand-accent mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                          {report.agent.name}
                        </h3>
                        {report.agent.merchant && (
                          <Badge variant="info" className="mb-3">
                            {report.agent.merchant}
                          </Badge>
                        )}
                        <div
                          className="prose dark:prose-invert max-w-none text-sm text-slate-700 dark:text-slate-300"
                          dangerouslySetInnerHTML={{ __html: report.narrative.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Key Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 rounded-xl bg-brand-green/10">
                      <p className="text-2xl font-bold text-brand-green">
                        {report.clusters.length}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Location Clusters
                      </p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-brand-cyan/10">
                      <p className="text-2xl font-bold text-brand-cyan">
                        {report.evidence.length}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Verifications
                      </p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-warning/10">
                      <p className="text-2xl font-bold text-warning">
                        {report.outliers.length}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Outliers (&gt;10km)
                      </p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-success/10">
                      <p className="text-2xl font-bold text-success">
                        {report.primaryCluster ? Math.round(report.primaryCluster.share * 100) : 0}%
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Primary Consistency
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {report.outliers.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-warning" />
                      <CardTitle>Outlier Locations</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {report.outliers.map((outlier, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl bg-warning/5 border border-warning/20"
                        >
                          <span className="text-sm font-mono text-slate-700 dark:text-slate-300">
                            {outlier.lat.toFixed(5)}, {outlier.lng.toFixed(5)}
                          </span>
                          <Badge variant="warning">
                            {outlier.distanceFromPrimaryKm.toFixed(1)}km from primary
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Verification Evidence</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800">
                          <th className="text-left text-xs font-medium text-slate-600 dark:text-slate-400 pb-3">
                            Timestamp
                          </th>
                          <th className="text-left text-xs font-medium text-slate-600 dark:text-slate-400 pb-3">
                            Location
                          </th>
                          <th className="text-left text-xs font-medium text-slate-600 dark:text-slate-400 pb-3">
                            Place
                          </th>
                          <th className="text-left text-xs font-medium text-slate-600 dark:text-slate-400 pb-3">
                            Cluster
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.evidence.slice(0, 10).map((ev, idx) => (
                          <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
                            <td className="py-3 text-sm text-slate-700 dark:text-slate-300">
                              {new Date(ev.verifiedAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 text-xs font-mono text-slate-600 dark:text-slate-400">
                              {ev.lat.toFixed(5)}, {ev.lng.toFixed(5)}
                            </td>
                            <td className="py-3 text-sm text-slate-700 dark:text-slate-300">
                              {ev.place.cityOrNearest}
                            </td>
                            <td className="py-3">
                              <Badge variant="info" className="text-xs">
                                {ev.clusterId}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {portfolioReport && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-xl bg-brand-green/10">
                      <p className="text-3xl font-bold text-brand-green">
                        {portfolioReport.summary.totalAgents}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Total Agents
                      </p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-brand-cyan/10">
                      <p className="text-3xl font-bold text-brand-cyan">
                        {portfolioReport.summary.totalVerifications}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Total Verifications
                      </p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-brand-accent/10">
                      <p className="text-3xl font-bold text-brand-accent">
                        {Object.keys(portfolioReport.summary.regionDistribution).length}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Regions
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Regional Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(portfolioReport.summary.regionDistribution).map(([region, count]) => (
                      <div key={count} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {region}
                        </span>
                        <Badge variant="info">{count} agents</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Agent Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {portfolioReport.agents.slice(0, 5).map((agentReport) => (
                      <div
                        key={agentReport.agent.guid}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                            {agentReport.agent.name}
                          </h4>
                          <Badge variant="success">
                            {agentReport.evidence.length} verifications
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {agentReport.placeSummary.cityOrNearest}, {agentReport.placeSummary.region}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
