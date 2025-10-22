import { useState, useEffect, FormEvent } from 'react';
import { X, Upload, User, Mail, Phone, MapPin, CreditCard, Calendar, Users } from 'lucide-react';
import { useModal } from '../providers/ModalContext';
import { z } from 'zod';
import { isValidPhoneNumber, format } from 'libphonenumber-js';
import { calculateAge } from '../lib/ageUtils';
import { useItemRegistrerMutation, useItemsListReadrMutation } from "../backend/api/sharedCrud"

const agentSchema = z.object({
  firstName: z.string().min(1, 'First name is required').regex(/^[a-zA-Z\s-]+$/, 'Only letters and hyphens allowed'),
  lastName: z.string().min(1, 'Last name is required').regex(/^[a-zA-Z\s-]+$/, 'Only letters and hyphens allowed'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  reportedAddr: z.string().optional(),
  nationalId: z.string().regex(/^[A-Z0-9-]{6,20}$/, 'Must be 6-20 alphanumeric characters').optional().or(z.literal('')),
  nationality: z.string().length(2, 'Select a nationality'),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'non-binary', 'prefer-not-to-say']),
  merchantIds: z.array(z.string()),
});

const countries = [
  { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
];

export default function AddAgentModal() {
  const { activeModal, closeModal, openModal } = useModal();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    reportedAddr: '',
    nationalId: '',
    nationality: 'UG',
    dateOfBirth: '',
    gender: 'male',
    merchantIds: [],
  });
  const [errors, setErrors] = useState({});
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [merchantSearch, setMerchantSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [age, setAge] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  //=========================start
  const [submitNewAgent, {
    data: agentRegSuccessResponse,
    isLoading: agentRegProcessing,
    isSuccess: agentRegSucceeded,
    isError: agentRegFailed,
    error: agentRegError,
  }] = useItemRegistrerMutation()
  useEffect(() => {
    if (agentRegSucceeded) {
      const { Data: newAgentDetails } = agentRegSuccessResponse || {}
      const event = new CustomEvent('agentCreated', { detail: newAgentDetails });
      window.dispatchEvent(event);
      setHasUnsavedChanges(false);
      closeModal();
      const toastEvent = new CustomEvent('showToast', {
        detail: {
          type: 'success',
          message: '✅ Agent created successfully'
        }
      });
      window.dispatchEvent(toastEvent);
      setIsSubmitting(false);
      resetForm();
      closeModal();
    } else if (agentRegFailed) {
      setIsSubmitting(false);
      const { data: errorMsg } = agentRegError || {}
      const toastEvent = new CustomEvent('showToast', {
        detail: {
          type: 'error',
          message: errorMsg || 'Failed to create agent. Please try again.'
        }
      });
      window.dispatchEvent(toastEvent);
    }
  }, [agentRegSucceeded, agentRegFailed]);
  //=========================end

  useEffect(() => {
    if (activeModal === 'addAgent') {
      fetchMerchants();
      const firstInput = document.getElementById('agent-first-name');
      setTimeout(() => firstInput?.focus(), 100);
    }
  }, [activeModal]);

  useEffect(() => {
    if (formData.dateOfBirth) {
      const calculatedAge = calculateAge(formData.dateOfBirth);
      setAge(calculatedAge);
    } else {
      setAge(null);
    }
  }, [formData.dateOfBirth]);

  useEffect(() => {
    const hasChanges = Object.values(formData).some(val =>
      Array.isArray(val) ? val.length > 0 : val !== '' && val !== 'UG' && val !== 'male'
    );
    setHasUnsavedChanges(hasChanges || photoFile !== null);
  }, [formData, photoFile]);

  const [fetchMerchantsFn, { data: merchantsResponse, isLoading: merchantsLoading, isError: merchantsFetchFailed }] = useItemsListReadrMutation()
  const fetchMerchants = async () => {
    fetchMerchantsFn({ entity: "merchant", page: 1 });
  };
  const merchants = useSelector(st => selectList(st, "merchant"))

  //---- profile image ----
  const [uploadNewImage, {
    data: fileUploadSuccessResponse,
    isLoading: fileUploadProcessing,
    isSuccess: fileUploadSucceeded,
    isError: fileUploadFailed,
    error: fileUploadError,
  }] = useFileUploaderMutation()
  const { Data: { url: photoUrl } = {} } = fileUploadSuccessResponse || {}

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, photo: 'File size must be less than 2MB' }));
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setErrors(prev => ({ ...prev, photo: 'Only JPG, PNG, and WebP formats are allowed' }));
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setErrors(prev => ({ ...prev, photo: undefined }));
      const fData = new FormData();
      fData.set('file', file);
      uploadNewImage({
        entity: "fileupload",
        data: fData,
      })
    } else {
      setPreview(null);
    }
  };

  const validateForm = () => {
    try {
      const phoneValid = isValidPhoneNumber(formData.phone, formData.nationality);
      if (!phoneValid) {
        setErrors(prev => ({ ...prev, phone: 'Invalid phone number for selected country' }));
        return false;
      }
      agentSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors = {};
        error.errors.forEach(err => {
          const field = err.path[0];
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);
    try {
      const parsedPhone = format(formData.phone, formData.nationality);
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        category: "Individuals",
        phone: parsedPhone?.format('E.164') || formData.phone,
        email: formData.email,
        physicalAddress: formData.reportedAddr,
        nationality: formData.nationality,
        dateOfBirth: formData.dateOfBirth,
        photo: photoUrl
      }
      submitNewAgent({ entity: "agent", data: payload })
      resetForm();
    } catch (error) {
      const toastEvent = new CustomEvent('showToast', {
        detail: {
          type: 'error',
          message: error.message || 'Failed to create agent. Please try again.'
        }
      });
      window.dispatchEvent(toastEvent);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      reportedAddr: '',
      nationality: 'UG',
      dateOfBirth: '',
      gender: 'male',
      merchantIds: [],
    });
    setPhotoFile(null);
    setPhotoPreview('');
    setErrors({});
    setAge(null);
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        resetForm();
        setHasUnsavedChanges(false);
        closeModal();
      }
    } else {
      resetForm();
      closeModal();
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && activeModal === 'addAgent') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [activeModal, hasUnsavedChanges]);

  const filteredMerchants = (merchants || []).filter(m =>
    m.name.toLowerCase().includes(merchantSearch.toLowerCase()) ||
    (m.industry && m.industry.toLowerCase().includes(merchantSearch.toLowerCase()))
  );

  if (activeModal !== 'addAgent') {
    return null;
  }

  const isFormValid = formData.firstName && formData.lastName && formData.phone &&
    formData.nationality && Object.keys(errors).length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Add New Agent</h2>
          <button
            onClick={handleClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="agent-first-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="agent-first-name"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${errors.firstName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="John"
                  />
                </div>
                {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
              </div>

              <div>
                <label htmlFor="agent-last-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="agent-last-name"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${errors.lastName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Obbi"
                  />
                </div>
                {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
              </div>

              <div>
                <label htmlFor="agent-nationality" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nationality <span className="text-red-500">*</span>
                </label>
                <select
                  id="agent-nationality"
                  value={formData.nationality}
                  onChange={(e) => setFormData(prev => ({ ...prev, nationality: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                >
                  {countries.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.flag} {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="agent-phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="agent-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="+256781234567"
                  />
                </div>
                {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label htmlFor="agent-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email (Optional)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="agent-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="john@example.com"
                  />
                </div>
                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="agent-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reported Address (Optional)
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <textarea
                    id="agent-address"
                    value={formData.reportedAddr}
                    onChange={(e) => setFormData(prev => ({ ...prev, reportedAddr: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    rows={2}
                    placeholder="Plot 12 Kololo, Kampala"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="agent-national-id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ID Number (Optional)
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="agent-national-id"
                    type="text"
                    value={formData.nationalId}
                    onChange={(e) => setFormData(prev => ({ ...prev, nationalId: e.target.value.toUpperCase() }))}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${errors.nationalId ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="CF12345"
                  />
                </div>
                {errors.nationalId && <p className="text-sm text-red-500 mt-1">{errors.nationalId}</p>}
              </div>

              <div>
                <label htmlFor="agent-dob" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date of Birth (Optional)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="agent-dob"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                </div>
                {age !== null && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-emerald-500 to-cyan-500 text-white">
                      Age: {age}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gender
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'non-binary', label: 'Non-binary' },
                    { value: 'prefer-not-to-say', label: 'Prefer not to say' },
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, gender: option.value }))}
                      className={`px-4 py-2 rounded-lg border transition-all ${formData.gender === option.value
                        ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white border-transparent'
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-emerald-500'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="agent-photo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Profile Picture (Optional)
                </label>
                <div className="flex items-center space-x-4">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-20 h-20 rounded-full object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <User className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                  <label htmlFor="agent-photo" className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <Upload className="w-5 h-5 mr-2" />
                    <span>Upload</span>
                    <input
                      id="agent-photo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG, or WebP. Max 2MB.</p>
                {errors.photo && <p className="text-sm text-red-500 mt-1">{errors.photo}</p>}
              </div>

              <div>
                <label htmlFor="agent-merchants" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assign to Merchants
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={merchantSearch}
                    onChange={(e) => setMerchantSearch(e.target.value)}
                    placeholder="Search merchants..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                  <div className="border border-gray-300 dark:border-gray-700 rounded-lg max-h-40 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, merchantIds: [] }))}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-200 dark:border-gray-700 ${formData.merchantIds.length === 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.merchantIds.length === 0}
                        readOnly
                        className="mr-2"
                      />
                      Unassigned
                    </button>
                    {filteredMerchants.map(merchant => (
                      <button
                        key={merchant.id}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            merchantIds: prev.merchantIds.includes(merchant.id)
                              ? prev.merchantIds.filter(id => id !== merchant.id)
                              : [...prev.merchantIds, merchant.id]
                          }));
                        }}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${formData.merchantIds.includes(merchant.id) ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.merchantIds.includes(merchant.id)}
                          readOnly
                          className="mr-2"
                        />
                        <span className="font-medium">{merchant.name}</span>
                        {merchant.industry && (
                          <span className="text-sm text-gray-500 ml-2">({merchant.industry})</span>
                        )}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => openModal('addMerchant')}
                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-emerald-500 hover:text-emerald-500 transition-colors flex items-center justify-center"
                  >
                    <Users className="w-5 h-5 mr-2" />
                    + Add Merchant
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              disabled={agentRegProcessing || isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid || agentRegProcessing || isSubmitting}
              className={`px-6 py-2 rounded-lg font-medium text-white transition-all ${isFormValid && !agentRegProcessing && !isSubmitting
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:shadow-lg hover:shadow-emerald-500/50'
                : 'bg-gray-400 cursor-not-allowed'
                }`}
            >
              {(agentRegProcessing || isSubmitting) ? 'Creating...' : 'Create Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
