import { useState, useEffect } from 'react';
import { X, Ticket, AlertCircle, Download, Printer } from 'lucide-react';
import { voucherApi, VoucherPreview, Voucher } from '../lib/floatApi';

interface CreateVouchersModalProps {
  isOpen: boolean;
  onClose: () => void;
  issuerAccountId: string;
  onSuccess?: () => void;
}

export default function CreateVouchersModal({ isOpen, onClose, issuerAccountId, onSuccess }: CreateVouchersModalProps) {
  const [count, setCount] = useState('1');
  const [amountEach, setAmountEach] = useState('');
  const [purpose, setPurpose] = useState('');
  const [eligibleRedeemerType, setEligibleRedeemerType] = useState<'any' | 'agent' | 'merchant'>('any');
  const [eligibleRedeemerId, setEligibleRedeemerId] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('30');
  const [preview, setPreview] = useState<VoucherPreview | null>(null);
  const [createdVouchers, setCreatedVouchers] = useState<Voucher[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'preview' | 'created'>('form');

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setCount('1');
    setAmountEach('');
    setPurpose('');
    setEligibleRedeemerType('any');
    setEligibleRedeemerId('');
    setExpiresInDays('30');
    setPreview(null);
    setCreatedVouchers([]);
    setError('');
    setStep('form');
  };

  const handlePreview = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      const previewData = await voucherApi.preview({
        issuerAccountId,
        count: parseInt(count),
        amountEach: parseFloat(amountEach),
        purpose,
        eligibleRedeemerType,
        eligibleRedeemerId: eligibleRedeemerId || undefined,
        expiresInDays: expiresInDays ? parseInt(expiresInDays) : undefined,
      });

      setPreview(previewData);
      setStep('preview');
    } catch (err: any) {
      setError(err.message);
      showToast('error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreate = async () => {
    if (!preview?.canCreate) {
      setError('Cannot create vouchers - insufficient balance');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const idempotencyKey = crypto.randomUUID();
      const result = await voucherApi.create({
        issuerAccountId,
        count: parseInt(count),
        amountEach: parseFloat(amountEach),
        purpose,
        eligibleRedeemerType,
        eligibleRedeemerId: eligibleRedeemerId || undefined,
        expiresInDays: expiresInDays ? parseInt(expiresInDays) : undefined,
        idempotencyKey,
      });

      setCreatedVouchers(result.vouchers);
      setStep('created');
      showToast('success', `✅ ${result.vouchers.length} vouchers created successfully`);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
      showToast('error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const csv = [
      ['Code', 'Checksum', 'Amount', 'Purpose', 'Expires'].join(','),
      ...createdVouchers.map(v => [
        v.code,
        v.checksum,
        v.amount,
        v.purpose,
        v.expires_at ? new Date(v.expires_at).toLocaleDateString() : 'Never'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowswitch-vouchers-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintQR = () => {
    let html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>FlowSwitch Vouchers</title>';
    html += '<style>';
    html += 'body { font-family: Arial, sans-serif; padding: 20px; }';
    html += '.voucher { page-break-inside: avoid; border: 2px solid #10b981; border-radius: 8px; padding: 15px; margin-bottom: 15px; }';
    html += '.code { font-size: 24px; font-weight: bold; color: #10b981; font-family: monospace; }';
    html += '.amount { font-size: 18px; color: #06b6d4; font-weight: 600; margin: 10px 0; }';
    html += '.checksum { font-size: 12px; color: #6b7280; font-family: monospace; }';
    html += '@media print { button { display: none; } }';
    html += '</style></head><body>';
    html += '<h1 style="color: #10b981;">FlowSwitch Vouchers</h1>';
    html += `<p>Total: ${createdVouchers.length} vouchers | Purpose: ${purpose}</p>`;

    createdVouchers.forEach(v => {
      html += '<div class="voucher">';
      html += `<div class="code">${v.code}</div>`;
      html += `<div class="amount">$${v.amount.toFixed(2)}</div>`;
      html += `<div class="checksum">Checksum: ${v.checksum}</div>`;
      if (v.expires_at) {
        html += `<div style="font-size: 12px; color: #6b7280;">Expires: ${new Date(v.expires_at).toLocaleDateString()}</div>`;
      }
      html += '</div>';
    });

    html += '<button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">Print</button>';
    html += '</body></html>';

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    const event = new CustomEvent('showToast', { detail: { type, message } });
    window.dispatchEvent(event);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <Ticket className="w-6 h-6" />
            <h2 className="text-xl font-bold">
              {step === 'form' ? 'Create Vouchers' : step === 'preview' ? 'Preview Vouchers' : 'Vouchers Created'}
            </h2>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {step === 'form' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Number of Vouchers <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount Each <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={amountEach}
                      onChange={(e) => setAmountEach(e.target.value)}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Purpose <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  placeholder="e.g., Agent commission, Promotion"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Eligible Redeemer
                </label>
                <select
                  value={eligibleRedeemerType}
                  onChange={(e) => setEligibleRedeemerType(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                >
                  <option value="any">Anyone</option>
                  <option value="agent">Specific Agent</option>
                  <option value="merchant">Specific Merchant</option>
                </select>
              </div>

              {eligibleRedeemerType !== 'any' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Redeemer ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={eligibleRedeemerId}
                    onChange={(e) => setEligibleRedeemerId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    placeholder={`${eligibleRedeemerType === 'agent' ? 'Agent' : 'Merchant'} UUID`}
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Expires In (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  placeholder="Leave empty for no expiry"
                />
              </div>

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
                  disabled={isSubmitting || !count || !amountEach || !purpose}
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:shadow-lg hover:shadow-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Loading...' : 'Preview'}
                </button>
              </div>
            </div>
          )}

          {step === 'preview' && preview && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Total Vouchers:</span>
                  <span className="font-bold text-lg">{count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Amount Each:</span>
                  <span className="font-bold text-lg">${parseFloat(amountEach).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-3 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Total Amount Required:</span>
                  <span className="font-bold text-2xl text-emerald-600">${preview.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Available Balance:</span>
                  <span className={`font-bold text-lg ${preview.canCreate ? 'text-emerald-600' : 'text-red-600'}`}>
                    ${preview.availableBalance.toFixed(2)}
                  </span>
                </div>
              </div>

              {!preview.canCreate && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-600 dark:text-red-400">Insufficient Balance</p>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      You need ${preview.totalAmount.toFixed(2)} but only have ${preview.availableBalance.toFixed(2)} available.
                    </p>
                  </div>
                </div>
              )}

              {preview.warnings.length > 0 && preview.canCreate && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  {preview.warnings.map((warning, idx) => (
                    <p key={idx} className="text-sm text-amber-600 dark:text-amber-400">{warning}</p>
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
                  disabled={!preview.canCreate || isSubmitting}
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:shadow-lg hover:shadow-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating...' : 'Create Vouchers'}
                </button>
              </div>
            </div>
          )}

          {step === 'created' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-center">
                <p className="text-emerald-600 dark:text-emerald-400 font-medium text-lg">
                  ✅ Successfully created {createdVouchers.length} vouchers!
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleExportCSV}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
                <button
                  onClick={handlePrintQR}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Codes
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {createdVouchers.slice(0, 20).map(v => (
                  <div key={v.guid} className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-mono font-bold text-emerald-600">{v.code}</p>
                        <p className="text-xs text-slate-500 font-mono">Checksum: {v.checksum}</p>
                      </div>
                      <p className="font-bold text-lg">${v.amount.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
                {createdVouchers.length > 20 && (
                  <p className="text-center text-sm text-slate-500">
                    ... and {createdVouchers.length - 20} more (export to see all)
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:shadow-lg hover:shadow-emerald-500/50"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
