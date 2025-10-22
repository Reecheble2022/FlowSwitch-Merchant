import { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertCircle } from 'lucide-react';

interface SchedulePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentIds: string[];
  onSuccess?: () => void;
}

interface SchedulePreview {
  occurrences: string[];
  count: number;
  warnings: string[];
}

export default function SchedulePromptModal({ isOpen, onClose, agentIds, onSuccess }: SchedulePromptModalProps) {
  const [message, setMessage] = useState('');
  const [frequency, setFrequency] = useState<'once' | 'daily' | 'weekly' | 'monthly'>('once');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
  const [preview, setPreview] = useState<SchedulePreview | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'preview'>('form');

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setStartDate(tomorrow.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  const resetForm = () => {
    setMessage('');
    setFrequency('once');
    setStartTime('09:00');
    setEndDate('');
    setDaysOfWeek([1, 2, 3, 4, 5]);
    setPreview(null);
    setError('');
    setStep('form');
  };

  const handlePreview = () => {
    setError('');

    const occurrences = generateOccurrences();
    const warnings: string[] = [];

    if (occurrences.length === 0) {
      warnings.push('No valid occurrences found. Check your schedule settings.');
    }

    if (occurrences.length > 100) {
      warnings.push(`Schedule will create ${occurrences.length} prompts. Consider a shorter date range.`);
    }

    occurrences.forEach(occ => {
      const date = new Date(occ);
      const hour = date.getHours();
      const day = date.getDay();

      if (hour < 8 || hour > 20) {
        warnings.push(`Some prompts scheduled outside business hours (8 AM - 8 PM)`);
        return;
      }

      if (day === 0 || day === 6) {
        warnings.push(`Some prompts scheduled on weekends`);
        return;
      }
    });

    setPreview({
      occurrences: occurrences.slice(0, 5),
      count: occurrences.length,
      warnings: Array.from(new Set(warnings)),
    });

    setStep('preview');
  };

  const generateOccurrences = (): string[] => {
    const occurrences: string[] = [];
    const start = new Date(`${startDate}T${startTime}`);
    const end = endDate ? new Date(`${endDate}T23:59:59`) : new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000);
    if (frequency === 'once') {
      occurrences.push(start.toISOString());
      return occurrences;
    }
    let current = new Date(start);
    let count = 0;
    const maxOccurrences = 1000;
    while (current <= end && count < maxOccurrences) {
      if (frequency === 'weekly' && !daysOfWeek.includes(current.getDay())) {
        current = addTime(current, frequency);
        continue;
      }
      occurrences.push(current.toISOString());
      count++;
      current = addTime(current, frequency);
    }
    return occurrences;
  };

  const addTime = (date: Date, freq: string): Date => {
    const newDate = new Date(date);
    switch (freq) {
      case 'daily':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'weekly':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'monthly':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
    }
    return newDate;
  };

  const handleCreate = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      const occurrences = generateOccurrences();

      const schedules = agentIds.flatMap(agentId =>
        occurrences.map(scheduledAt => ({
          agent_id: agentId,
          message,
          scheduled_at: scheduledAt,
          status: 'pending',
        }))
      );

      //TODO: Send schedules to backend
      // const { error: insertError } = await supabase.from('prompt_schedules').insert(schedules);
      // if (insertError) throw insertError;

      showToast('success', `✅ Scheduled ${schedules.length} prompts for ${agentIds.length} agent(s)`);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message);
      showToast('error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDayOfWeek = (day: number) => {
    setDaysOfWeek(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    const event = new CustomEvent('showToast', { detail: { type, message } });
    window.dispatchEvent(event);
  };

  if (!isOpen) return null;

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <Calendar className="w-6 h-6" />
            <h2 className="text-xl font-bold">
              {step === 'form' ? 'Schedule Prompt' : 'Preview Schedule'}
            </h2>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {step === 'form' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Scheduling for {agentIds.length} agent{agentIds.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  rows={3}
                  placeholder="Enter the message to send..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Frequency
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                >
                  <option value="once">Once</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>

              {frequency !== 'once' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                  <p className="text-xs text-slate-500 mt-1">Leave empty for recurring schedule</p>
                </div>
              )}

              {frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Days of Week
                  </label>
                  <div className="flex gap-2">
                    {dayNames.map((day, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => toggleDayOfWeek(index)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          daysOfWeek.includes(index)
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePreview}
                  disabled={!message || !startDate}
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:shadow-lg hover:shadow-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Preview
                </button>
              </div>
            </div>
          )}

          {step === 'preview' && preview && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {preview.count} prompt{preview.count !== 1 ? 's' : ''} will be scheduled
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  for {agentIds.length} agent{agentIds.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First 5 occurrences:
                </h3>
                <div className="space-y-2">
                  {preview.occurrences.map((occ, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">{new Date(occ).toLocaleString()}</span>
                    </div>
                  ))}
                  {preview.count > 5 && (
                    <p className="text-sm text-slate-500 text-center">
                      ... and {preview.count - 5} more
                    </p>
                  )}
                </div>
              </div>

              {preview.warnings.length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="font-medium text-amber-600 dark:text-amber-400 mb-1">Warnings:</p>
                  {preview.warnings.map((warning, idx) => (
                    <p key={idx} className="text-sm text-amber-600 dark:text-amber-400">• {warning}</p>
                  ))}
                </div>
              )}

              <div className="flex justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setStep('form')}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Back
                </button>
                <button
                  onClick={handleCreate}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:shadow-lg hover:shadow-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Scheduling...' : 'Create Schedule'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
