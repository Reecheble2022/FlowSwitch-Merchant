import { useState, useEffect } from 'react';
import { X, DollarSign, TrendingUp, TrendingDown, Settings, Receipt } from 'lucide-react';
import { floatApi, FloatAccount, FloatTransaction } from '../lib/floatApi';

interface ManageFloatModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: FloatAccount | null;
  mode: 'assign' | 'topup' | 'debit' | 'limits' | 'ledger';
  onSuccess?: () => void;
}

export default function ManageFloatModal({ isOpen, onClose, account, mode, onSuccess }: ManageFloatModalProps) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [agentId, setAgentId] = useState('');
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [limitsJson, setLimitsJson] = useState('');
  const [status, setStatus] = useState<'active' | 'suspended' | 'closed'>('active');
  const [ledger, setLedger] = useState<FloatTransaction[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && account) {
      setStatus(account.status);
      setLimitsJson(JSON.stringify(account.limits_json || {}, null, 2));

      if (mode === 'ledger') {
        loadLedger();
      }
    }
  }, [isOpen, account, mode]);

  const loadLedger = async () => {
    if (!account) return;
    try {
      const data = await floatApi.getLedger(account.guid, 50);
      setLedger(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      switch (mode) {
        case 'assign':
          if (!agentId || !amount || !sourceAccountId) {
            throw new Error('Agent ID, amount, and source account are required');
          }
          await floatApi.assignFloat({
            agentId,
            amount: parseFloat(amount),
            sourceAccountId,
            reason: reason || undefined,
          });
          showToast('success', '✅ Float assigned successfully');
          break;

        case 'topup':
          if (!account || !amount) {
            throw new Error('Amount is required');
          }
          await floatApi.creditAccount({
            accountId: account.guid,
            amount: parseFloat(amount),
            reason: reason || undefined,
          });
          showToast('success', '✅ Account topped up successfully');
          break;

        case 'debit':
          if (!account || !amount) {
            throw new Error('Amount is required');
          }
          await floatApi.debitAccount({
            accountId: account.guid,
            amount: parseFloat(amount),
            reason: reason || undefined,
          });
          showToast('success', '✅ Amount debited successfully');
          break;

        case 'limits':
          if (!account) {
            throw new Error('No account selected');
          }
          const parsedLimits = JSON.parse(limitsJson);
          await floatApi.updateLimits({
            accountId: account.guid,
            limitsJson: parsedLimits,
            status,
          });
          showToast('success', '✅ Limits updated successfully');
          break;
      }

      onSuccess?.();
      handleClose();
    } catch (err: any) {
      setError(err.message);
      showToast('error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setReason('');
    setAgentId('');
    setSourceAccountId('');
    setError('');
    setLedger([]);
    onClose();
  };

  const handleExportLedger = () => {
    if (ledger.length === 0) return;

    const csv = [
      ['Date', 'Type', 'Amount', 'Balance After', 'Reason'].join(','),
      ...ledger.map(tx => [
        new Date(tx.created_at).toLocaleString(),
        tx.type,
        tx.amount,
        tx.balance_after,
        tx.reason || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `float-ledger-${account?.guid}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    const event = new CustomEvent('showToast', { detail: { type, message } });
    window.dispatchEvent(event);
  };

  if (!isOpen) return null;

  const titles = {
    assign: 'Assign Float to Agent',
    topup: 'Top-Up Account',
    debit: 'Debit Account',
    limits: 'Edit Account Limits',
    ledger: 'Account Ledger',
  };

  const icons = {
    assign: <DollarSign className="w-6 h-6" />,
    topup: <TrendingUp className="w-6 h-6" />,
    debit: <TrendingDown className="w-6 h-6" />,
    limits: <Settings className="w-6 h-6" />,
    ledger: <Receipt className="w-6 h-6" />,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            {icons[mode]}
            <h2 className="text-xl font-bold">{titles[mode]}</h2>
          </div>
          <button onClick={handleClose} className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {mode === 'ledger' ? (
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {account && (
              <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Balance</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      ${account.balance.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Available</p>
                    <p className="text-2xl font-bold text-emerald-600">${account.available.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Holds</p>
                    <p className="text-2xl font-bold text-amber-600">${account.holds.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Transaction History
              </h3>
              <button
                onClick={handleExportLedger}
                className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Export CSV
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-96">
              {ledger.map(tx => (
                <div
                  key={tx.guid}
                  className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {tx.type === 'credit' || tx.type === 'release' ? (
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {tx.type.toUpperCase()}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{tx.reason}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">
                          {new Date(tx.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${tx.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {tx.amount >= 0 ? '+' : ''}${tx.amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Balance: ${tx.balance_after?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {ledger.length === 0 && (
                <p className="text-center py-8 text-slate-500">No transactions yet</p>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {mode === 'assign' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Agent ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={agentId}
                    onChange={(e) => setAgentId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    placeholder="Agent UUID"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Source Account ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={sourceAccountId}
                    onChange={(e) => setSourceAccountId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    placeholder="Source float account UUID"
                    required
                  />
                </div>
              </>
            )}

            {(mode === 'assign' || mode === 'topup' || mode === 'debit') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reason (Optional)
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    placeholder="e.g., Monthly allocation"
                  />
                </div>
              </>
            )}

            {mode === 'limits' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Limits JSON
                  </label>
                  <textarea
                    value={limitsJson}
                    onChange={(e) => setLimitsJson(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white font-mono text-sm"
                    rows={8}
                    placeholder='{"daily_limit": 1000, "transaction_limit": 500}'
                  />
                  <p className="text-xs text-slate-500 mt-1">Must be valid JSON</p>
                </div>
              </>
            )}

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-2 rounded-lg font-medium text-white ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:shadow-lg hover:shadow-emerald-500/50'
                }`}
              >
                {isSubmitting ? 'Processing...' : mode === 'assign' ? 'Assign Float' : mode === 'topup' ? 'Top Up' : mode === 'debit' ? 'Debit' : 'Update Limits'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
