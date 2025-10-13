import { useState } from 'react';
import { X, Scan, CheckCircle, AlertCircle } from 'lucide-react';
import { voucherApi } from '../lib/floatApi';

interface RedeemVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  redeemerAccountId: string;
  onSuccess?: () => void;
}

export default function RedeemVoucherModal({ isOpen, onClose, redeemerAccountId, onSuccess }: RedeemVoucherModalProps) {
  const [code, setCode] = useState('');
  const [checksum, setChecksum] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [redemptionDetails, setRedemptionDetails] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const idempotencyKey = crypto.randomUUID();
      const result = await voucherApi.redeem({
        code: code.trim().toUpperCase(),
        checksum: checksum.trim().toUpperCase(),
        redeemerAccountId,
        idempotencyKey,
      });

      setRedemptionDetails(result);
      setSuccess(true);
      showToast('success', `✅ Voucher redeemed! $${result.amount.toFixed(2)} added to your account`);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
      showToast('error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCode('');
    setChecksum('');
    setError('');
    setSuccess(false);
    setRedemptionDetails(null);
    onClose();
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    const event = new CustomEvent('showToast', { detail: { type, message } });
    window.dispatchEvent(event);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <Scan className="w-6 h-6" />
            <h2 className="text-xl font-bold">Redeem Voucher</h2>
          </div>
          <button onClick={handleClose} className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Voucher Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white font-mono text-lg"
                  placeholder="FS-XXXX-YYYY"
                  pattern="FS-[A-Z0-9]{4}-[A-Z0-9]{4}"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Format: FS-XXXX-YYYY</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Checksum <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={checksum}
                  onChange={(e) => setChecksum(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white font-mono"
                  placeholder="8-character checksum"
                  maxLength={8}
                  required
                />
                <p className="text-xs text-slate-500 mt-1">8-character verification code</p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-600 dark:text-red-400">Redemption Failed</p>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                  disabled={isSubmitting || !code || !checksum}
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:shadow-lg hover:shadow-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Redeeming...' : 'Redeem Voucher'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-center">
                <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-3" />
                <p className="text-emerald-600 dark:text-emerald-400 font-medium text-xl mb-2">
                  Voucher Redeemed!
                </p>
                <p className="text-3xl font-bold text-emerald-600">${redemptionDetails?.amount.toFixed(2)}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  has been added to your account
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Voucher Code:</span>
                  <span className="font-mono font-medium">{code}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Redeemed At:</span>
                  <span className="font-medium">{new Date(redemptionDetails?.redeemed_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleClose}
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
