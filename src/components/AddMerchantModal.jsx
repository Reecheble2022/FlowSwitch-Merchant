import { useState, useEffect } from 'react';
import { X, Building2, Mail, Phone, MapPin } from 'lucide-react';
import { useModal } from '../providers/ModalContext';
import { useItemRegistrerMutation } from "../backend/api/sharedCrud"

export default function AddMerchantModal() {
  const { activeModal, closeModal } = useModal();
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    password: '',
    website: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  //=========================start
  const [submitNewMerchant, {
    data: merchantRegSuccessResponse,
    isLoading: merchantRegProcessing,
    isSuccess: merchantRegSucceeded,
    isError: merchantRegFailed,
    error: merchantRegError,
  }] = useItemRegistrerMutation()
  useEffect(() => {
    if (merchantRegSucceeded) {
      const { Data: newMerchantDetails } = merchantRegSuccessResponse || {}
      const event = new CustomEvent('merchantCreated', { detail: newMerchantDetails });
      window.dispatchEvent(event);
      const toastEvent = new CustomEvent('showToast', {
        detail: {
          type: 'success',
          message: '✅ Merchant created successfully'
        }
      });
      window.dispatchEvent(toastEvent);
      resetForm();
      closeModal();
      setIsSubmitting(false);
    } else if (merchantRegFailed) {
      setIsSubmitting(false);
      const { data: errorMsg } = merchantRegError || {}
      const toastEvent = new CustomEvent('showToast', {
        detail: {
          type: 'error',
          message: errorMsg || 'Failed to create merchant. Please try again.'
        }
      });
      window.dispatchEvent(toastEvent);
    }
  }, [merchantRegSucceeded, merchantRegFailed]);
  //=========================end

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        udid: formData.name?.replace(" ", "")?.toLowerCase(),
        name: formData.name,
        industry: formData.industry,
        website: formData.website,
        email: formData.email,
        phone: parsedPhone?.format('E.164') || formData.phone,
        physicalAddress: formData.address,
        address: formData.address,
        password: formData.password,
        photo: photoUrl,
        status: 'active',
      };
      submitNewMerchant({ entity: "merchant", data: payload })
    } catch (error) {
      const toastEvent = new CustomEvent('showToast', {
        detail: {
          type: 'error',
          message: error.message || 'Failed to create merchant. Please try again.'
        }
      });
      window.dispatchEvent(toastEvent);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      industry: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
    });
  };

  if (activeModal !== 'addMerchant') return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-white">Add New Merchant</h2>
          <button
            onClick={() => closeModal()}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="merchant-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Merchant Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="merchant-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                placeholder="FlowSwitch Kenya"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="merchant-industry" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Industry (Optional)
            </label>
            <input
              id="merchant-industry"
              type="text"
              value={formData.industry}
              onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              placeholder="Fintech"
            />
          </div>

          <div>
            <label htmlFor="merchant-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contact Email (Optional)
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="merchant-email"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                placeholder="contact@merchant.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="merchant-phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contact Phone (Optional)
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="merchant-phone"
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                placeholder="+256700000000"
              />
            </div>
          </div>

          <div>
            <label htmlFor="merchant-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Address (Optional)
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <textarea
                id="merchant-address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                rows={2}
                placeholder="123 Main Street, Nairobi"
              />
            </div>
          </div>

          <div>
            <label htmlFor="merchant-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New password
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                id="merchant-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                placeholder="+256700000000"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => closeModal()}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.name || merchantRegProcessing || isSubmitting}
              className={`px-6 py-2 rounded-lg font-medium text-white transition-all ${formData.name && !merchantRegProcessing && !isSubmitting
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:shadow-lg hover:shadow-emerald-500/50'
                : 'bg-gray-400 cursor-not-allowed'
                }`}
            >
              {(merchantRegProcessing || isSubmitting) ? 'Creating...' : 'Create Merchant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
