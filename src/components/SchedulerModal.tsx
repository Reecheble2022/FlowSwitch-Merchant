import { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertCircle, Zap } from 'lucide-react';
import { GradientButton } from './ui/GradientButton';
import { Card, CardContent } from './ui/Card';
import type { PromptScheduleRule, PromptPreview } from '../types';
import { generateScheduleDates, validateSchedule } from '../lib/scheduling';

interface SchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentCount: number;
  agentIds: string[];
  onSchedule: (rule: PromptScheduleRule, startDate: string, endDate: string, channel: string) => Promise<void>;
}

export function SchedulerModal({ isOpen, onClose, agentCount, agentIds, onSchedule }: SchedulerModalProps) {
  const [frequencyType, setFrequencyType] = useState<'one_time' | 'times_total' | 'every_n_days'>('one_time');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sendTime, setSendTime] = useState('09:00');
  const [useRandomWindow, setUseRandomWindow] = useState(false);
  const [randomStart, setRandomStart] = useState('09:00');
  const [randomEnd, setRandomEnd] = useState('17:00');
  const [timesTotal, setTimesTotal] = useState(5);
  const [everyNDays, setEveryNDays] = useState(1);
  const [quietHours, setQuietHours] = useState(true);
  const [skipWeekends, setSkipWeekends] = useState(false);
  const [retryEnabled, setRetryEnabled] = useState(true);
  const [retryIntervalMins, setRetryIntervalMins] = useState(30);
  const [maxRetries, setMaxRetries] = useState(3);
  const [channel, setChannel] = useState<'sms' | 'whatsapp' | 'app'>('sms');
  const [preview, setPreview] = useState<PromptPreview | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    setStartDate(today.toISOString().split('T')[0]);
    setEndDate(nextWeek.toISOString().split('T')[0]);
  }, [isOpen]);

  useEffect(() => {
    if (startDate && endDate) {
      updatePreview();
    }
  }, [frequencyType, startDate, endDate, sendTime, useRandomWindow, randomStart, randomEnd, timesTotal, everyNDays, quietHours, skipWeekends]);

  const updatePreview = () => {
    const rule: PromptScheduleRule = {
      type: frequencyType,
      sendTime: useRandomWindow ? undefined : sendTime,
      timesTotal: frequencyType === 'times_total' ? timesTotal : undefined,
      everyNDays: frequencyType === 'every_n_days' ? everyNDays : undefined,
      randomWindow: useRandomWindow ? { start: randomStart, end: randomEnd } : undefined,
      options: {
        quietHours,
        skipWeekends,
        retry: {
          enabled: retryEnabled,
          intervalMins: retryIntervalMins,
          maxRetries,
        },
      },
    };

    const preview = generateScheduleDates(rule, startDate, endDate);
    setPreview(preview);
  };

  const handleSchedule = async () => {
    const rule: PromptScheduleRule = {
      type: frequencyType,
      sendTime: useRandomWindow ? undefined : sendTime,
      timesTotal: frequencyType === 'times_total' ? timesTotal : undefined,
      everyNDays: frequencyType === 'every_n_days' ? everyNDays : undefined,
      randomWindow: useRandomWindow ? { start: randomStart, end: randomEnd } : undefined,
      options: {
        quietHours,
        skipWeekends,
        retry: {
          enabled: retryEnabled,
          intervalMins: retryIntervalMins,
          maxRetries,
        },
      },
    };

    const validation = validateSchedule(rule, startDate, endDate);
    if (!validation.valid) {
      alert(validation.errors.join('\n'));
      return;
    }

    setLoading(true);
    try {
      await onSchedule(rule, startDate, endDate, channel);
      onClose();
    } catch (error) {
      alert('Failed to create schedule');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-glass">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-brand-green" />
              Schedule Prompts
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {agentCount === 1 ? 'For 1 agent' : `For ${agentCount} agents`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Frequency Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Frequency
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { value: 'one_time', label: 'One-time', desc: 'Send once' },
                { value: 'times_total', label: 'X times', desc: 'Evenly spaced' },
                { value: 'every_n_days', label: 'Every N days', desc: 'Recurring' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFrequencyType(option.value as any)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    frequencyType === option.value
                      ? 'border-brand-green bg-brand-green/5'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="font-medium text-slate-900 dark:text-white">{option.label}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Frequency-specific fields */}
          {frequencyType === 'times_total' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Number of sends
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={timesTotal}
                onChange={(e) => setTimesTotal(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </div>
          )}

          {frequencyType === 'every_n_days' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Every N days
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={everyNDays}
                onChange={(e) => setEveryNDays(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </div>
          )}

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </div>
          </div>

          {/* Send Time */}
          <div>
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={useRandomWindow}
                onChange={(e) => setUseRandomWindow(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-brand-green focus:ring-brand-accent"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Random time window
              </span>
            </label>

            {useRandomWindow ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Window start</label>
                  <input
                    type="time"
                    value={randomStart}
                    onChange={(e) => setRandomStart(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Window end</label>
                  <input
                    type="time"
                    value={randomEnd}
                    onChange={(e) => setRandomEnd(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  />
                </div>
              </div>
            ) : (
              <input
                type="time"
                value={sendTime}
                onChange={(e) => setSendTime(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            )}
          </div>

          {/* Channel */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Channel
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as any)}
              className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-accent"
            >
              <option value="sms">SMS</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="app">In-App</option>
            </select>
          </div>

          {/* Rules */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Rules
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={quietHours}
                onChange={(e) => setQuietHours(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-brand-green focus:ring-brand-accent"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Respect quiet hours (22:00–06:00)
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={skipWeekends}
                onChange={(e) => setSkipWeekends(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-brand-green focus:ring-brand-accent"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Skip weekends
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={retryEnabled}
                onChange={(e) => setRetryEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-brand-green focus:ring-brand-accent"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Enable retry (up to {maxRetries} times, every {retryIntervalMins} mins)
              </span>
            </label>
          </div>

          {/* Preview */}
          {preview && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-brand-accent" />
                <span className="font-medium text-slate-900 dark:text-white">
                  Preview: {preview.count} scheduled sends
                </span>
              </div>
              <div className="space-y-1 text-sm">
                {preview.dates.map((date, i) => (
                  <div key={i} className="text-slate-700 dark:text-slate-300">
                    {i + 1}. {new Date(date).toLocaleString()}
                  </div>
                ))}
                {preview.count > 5 && (
                  <div className="text-slate-500 dark:text-slate-500 italic">
                    ... and {preview.count - 5} more
                  </div>
                )}
              </div>
              {preview.warnings.length > 0 && (
                <div className="mt-3 p-3 rounded-lg bg-warning/10 border border-warning/30">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-warning mt-0.5" />
                    <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                      {preview.warnings.slice(0, 3).map((warning, i) => (
                        <div key={i}>{warning}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <GradientButton
              onClick={handleSchedule}
              disabled={loading || !startDate || !endDate}
              className="flex-1"
            >
              {loading ? 'Creating...' : 'Create Schedule'}
            </GradientButton>
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
