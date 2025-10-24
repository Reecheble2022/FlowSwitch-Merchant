import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, Download, FileJson, FileText } from 'lucide-react';
import { useSelector } from 'react-redux';
import { ChatPane } from '../components/chat/ChatPane';
import { ContextPanel } from '../components/chat/ContextPanel';
import { GradientButton } from '../components/ui/GradientButton';
import { generateAgentReport } from '../services/aiReportService';
import { useItemDetailsViewrMutation, useItemsListReadrMutation } from "../backend/api/sharedCrud"
import { selectOneItemByGuid } from "../backend/features/sharedMainState"

export function AIReportBuilder() {
  const [searchParams] = useSearchParams();
  const agentId = searchParams.get('agentId');

  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [report, setReport] = useState(null);

  const [fetchAgentDetailsFn, {
    isLoading: agentDetailsLoading,
    isSuccess: agentDetailsFetchSucceeded,
    isError: agentDetailsFetchFailed
  }] = useItemDetailsViewrMutation()
  const agent = useSelector(st => selectOneItemByGuid(st, "agent", agentId))

  useEffect(() => {
    if (agentId) {
      fetchAgentDetailsFn({ entity: "agent", guid: agentId })
    }
  }, [agentId]);

  useEffect(() => {
    if (agent) {
      initializeSession(agentId, agent);
    }
  }, [agentDetailsFetchSucceeded, agent]);

  const initializeSession = async (agentId, agent) => {
    setIsProcessing(true);
    try {
      const generatedReport = await generateAgentReport({ agentId, lookbackDays: 30 }, agent);
      setReport(generatedReport);

      const initialMessage = {
        id: crypto.randomUUID(),
        role: 'analyst',
        content: generatedReport.narrative,
        timestamp: new Date().toISOString(),
        actionChips: [
          { label: 'Show map', action: 'Show me the verification map', icon: 'map' },
          { label: 'Explain clusters', action: 'Explain the location clusters in detail' },
          { label: 'Show outliers', action: 'Show me the outliers and how far they are' },
        ],
      };

      setMessages([initialMessage]);

      setSession({
        id: crypto.randomUUID(),
        agentIds: [agentId],
        dateRange: {
          start: generatedReport.summary.dateRange.start,
          end: generatedReport.summary.dateRange.end,
        },
        report: generatedReport,
        messages: [initialMessage],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to generate report:', error);
      const errorMessage = {
        id: crypto.randomUUID(),
        role: 'analyst',
        content: 'Sorry, I encountered an error while analyzing the agent data. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages([errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async (content) => {
    if (!report || !session) return;

    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);

    setTimeout(() => {
      const response = generateResponse(content.toLowerCase(), report);
      const analystMessage = {
        id: crypto.randomUUID(),
        role: 'analyst',
        content: response.content,
        timestamp: new Date().toISOString(),
        actionChips: response.chips,
      };

      setMessages((prev) => [...prev, analystMessage]);
      setIsProcessing(false);
    }, 1000);
  };

  const handleExportPDF = () => {
    alert('PDF export functionality: Would generate PDF with FlowSwitch logo in header and "Built by Aever" in footer');
  };

  const handleExportJSON = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowswitch-report-${report.agent.guid}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    alert('CSV export functionality: Would generate CSV with verification data');
  };

  if (!agentId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-brand-green" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Select an agent to analyze
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Go to the Agents page and click the AI icon next to an agent
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-brand-green" />
            AI Report Builder
          </h1>
          {report && (
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Analyzing {report.agent.name} • {report.summary.totalVerifications} verifications
            </p>
          )}
        </div>

        {report && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 text-sm"
              title="Export JSON"
            >
              <FileJson className="w-4 h-4" />
              JSON
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 text-sm"
              title="Export CSV"
            >
              <FileText className="w-4 h-4" />
              CSV
            </button>
            <GradientButton onClick={handleExportPDF} size="md">
              <Download className="w-4 h-4" />
              Export PDF
            </GradientButton>
          </div>
        )}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft-lg overflow-hidden flex flex-col">
          <ChatPane
            messages={messages}
            onSendMessage={handleSendMessage}
            isProcessing={isProcessing}
          />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft-lg overflow-hidden">
          <ContextPanel report={report} />
        </div>
      </div>
    </div>
  );
}

function generateResponse(
  query,
  report
) {
  if (query.includes('map') || query.includes('show')) {
    return {
      content: `🗺️ **Verification Map**\n\nI've updated the map on the right panel. ${report.primaryCluster
        ? `The map shows ${report.summary.totalVerifications} verification points. The primary cluster (shown with a green polygon) contains ${report.primaryCluster.pointCount} verifications within a ${report.primaryCluster.radius.toFixed(0)}m radius.`
        : 'All verification points are displayed on the map.'
        }\n\nThe agent primarily operates in **${report.summary.primaryLocation?.city}, ${report.summary.primaryLocation?.countryName
        }**.`,
      chips: [
        { label: 'Cluster details', action: 'Tell me more about the clusters' },
        { label: 'Outliers', action: 'Show outliers', icon: 'map' },
      ],
    };
  }

  if (query.includes('cluster')) {
    const primary = report.primaryCluster;
    if (!primary) {
      return {
        content: 'No significant clusters detected in the verification data.',
      };
    }

    return {
      content: `📍 **Cluster Analysis**\n\n**Primary Cluster**:\n• Contains ${primary.pointCount
        } verifications (${Math.round(primary.shareOfTotal * 100)}% of total)\n• Radius: ${primary.radius.toFixed(
          0
        )} meters\n• Center: ${primary.centroid.lat.toFixed(6)}, ${primary.centroid.lng.toFixed(
          6
        )}\n\n${report.clusters.length > 1
          ? `**Secondary Clusters**: ${report.clusters.length - 1} additional cluster${report.clusters.length > 2 ? 's' : ''
          } detected`
          : '**No secondary clusters detected**'
        }\n\nThis indicates the agent has a **consistent primary location** with ${primary.shareOfTotal > 0.8 ? 'very high' : primary.shareOfTotal > 0.6 ? 'good' : 'moderate'
        } location consistency.`,
      chips: [
        { label: 'Show outliers', action: 'Show me the outliers' },
        { label: 'Movement', action: 'Tell me about movement patterns' },
      ],
    };
  }

  if (query.includes('outlier')) {
    if (report.outliers.length === 0) {
      return {
        content:
          '✅ **No Outliers Detected**\n\nAll verifications are within 10km of the primary location. This indicates excellent location consistency.',
      };
    }

    const farthest = report.outliers[0];
    return {
      content: `🚩 **Outlier Analysis**\n\n**${report.outliers.length
        }** verification${report.outliers.length !== 1 ? 's' : ''
        } detected more than 10km from the primary location.\n\n**Farthest outlier**:\n• Distance: ${farthest.distanceFromPrimary.toFixed(
          1
        )} km from primary cluster\n• Coordinates: ${farthest.lat.toFixed(6)}, ${farthest.lng.toFixed(
          6
        )}\n\nOutliers may indicate:\n• Legitimate travel for work purposes\n• Unusual activity requiring investigation\n• GPS errors or anomalies\n\n${report.outliers.length > 3
          ? '⚠️ Multiple outliers detected - recommend manual review'
          : 'Outlier count is within normal range'
        }`,
      chips: [{ label: 'Export report', action: 'Export this report as PDF', icon: 'download' }],
    };
  }

  if (query.includes('movement') || query.includes('travel') || query.includes('distance')) {
    return {
      content: `🧭 **Movement Analysis**\n\n**Total Distance**: ${report.movement.totalDistanceKm.toFixed(
        1
      )} km across ${report.summary.totalVerifications
        } verifications\n**Last Movement**: ${report.movement.lastMovementKm.toFixed(
          1
        )} km\n\n**Average per verification**: ${(
          report.movement.totalDistanceKm / Math.max(report.summary.totalVerifications - 1, 1)
        ).toFixed(
          1
        )} km\n\n${report.movement.totalDistanceKm < 5
          ? '📍 Agent shows **very low mobility** - highly consistent location'
          : report.movement.totalDistanceKm < 50
            ? '🚶 Agent shows **moderate mobility** - normal for field operations'
            : '🚗 Agent shows **high mobility** - covers significant territory'
        }`,
    };
  }

  if (query.includes('same location') || query.includes('eli5') || query.includes('explain like')) {
    return {
      content: `🎯 **Are these the same location? (Simple Explanation)**\n\n${report.primaryCluster && report.primaryCluster.shareOfTotal > 0.8
        ? '✅ **Yes, basically the same spot!**\n\nImagine if you drew a small circle on a map. Over 80% of this agent\'s verifications happen inside that circle. They\'re working from the same place most of the time.'
        : report.primaryCluster && report.primaryCluster.shareOfTotal > 0.5
          ? '🟡 **Mostly the same, with some variation**\n\nThink of it like a neighborhood. Most verifications happen in one area (like staying in your neighborhood), but sometimes the agent goes to different parts of town.'
          : '🟠 **Different locations**\n\nThe agent moves around quite a bit - like having several favorite spots across the city rather than one main place.'
        }\n\n**Why it matters**: ${report.primaryCluster && report.primaryCluster.shareOfTotal > 0.8
          ? 'High consistency means the agent is reliable and stays put at their assigned location.'
          : 'More movement might be normal for their role, or could need a closer look.'
        }`,
    };
  }

  if (query.includes('location') || query.includes('where') || query.includes('city')) {
    const loc = report.summary.primaryLocation;
    if (!loc) {
      return { content: 'Location data not available.' };
    }

    return {
      content: `📍 **Location Details**\n\n${report.locationBlurb?.text || ''}\n\n**Administrative Breakdown**:\n${loc.townOrSuburb ? `• **Area**: ${loc.townOrSuburb}\n` : ''
        }• **City**: ${loc.city}\n• **Province/State**: ${loc.provinceOrState}\n• **Country**: ${loc.countryName
        }\n\n**Distance to nearest major place**: ${loc.distanceKmToNearest.toFixed(1)} km from ${loc.nearestPlace
        }\n\nSee the location card on the right for a photo and more details.`,
    };
  }

  return {
    content: `I can help you understand:\n\n📍 **Location patterns** - "Where does this agent work?"\n🧩 **Clusters** - "Are these the same location?"\n🚩 **Outliers** - "Show me unusual verifications"\n🧭 **Movement** - "How much does this agent travel?"\n📊 **Analysis** - "Explain like I'm 5"\n\nWhat would you like to know?`,
    chips: [
      { label: 'Show map', action: 'Show me the map' },
      { label: 'Clusters', action: 'Explain clusters' },
      { label: 'Outliers', action: 'Show outliers' },
    ],
  };
}
