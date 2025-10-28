/* eslint-disable */
import React, { useState, useEffect, useRef } from "react";
import { useItemsListReadrMutation, useItemDetailsViewrMutation, useItemRegistrerMutation } from '../backend/api/sharedCrud';
import { useNoteSnap } from '../providers/noteSnapProvider';
import { useAgentRegistration } from "../providers/agentRegistrationProvider";
import { useAgentVerificationScheduling } from "../providers/agentVerificationScheduleProvider";
import { FaSpinner, FaCheck, FaTimes } from 'react-icons/fa';

const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const TicketIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
  </svg>
);

const Tools = () => {
  const { startNoteVerification } = useNoteSnap();
  const { triggerAgentRegistrationPrompt } = useAgentRegistration();
  const { scheduleAgentVerificationForOneAgent, scheduleAgentVerificationForAllAgents } = useAgentVerificationScheduling();
  const [activeTab, setActiveTab] = useState('location');
  const [selectedAgentToPrompt, setSelectedAgentToPrompt] = useState({});
  const [expandedAgentId, setExpandedAgentId] = useState(null);
  const [agentDetails, setAgentDetails] = useState({});
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const textareaRef = useRef(null);

  const [fetchAgents, { data: agentsData, isLoading: agentsLoading }] = useItemsListReadrMutation();
  const { Data: agentList } = agentsData || {};
  const [fetchCashNotes, { data: cashNotesResponse, isLoading: cashNotesLoading }] = useItemsListReadrMutation();
  const { Data: cashNotesVerificationsList } = cashNotesResponse || {};
  const [fetchAgentDetails, { data: singleAgentResponse, isLoading: agentDetailsLoading }] = useItemDetailsViewrMutation();
  const [fetchAIFollowUpOnAgent, { data: aiFollowUpResponse }] = useItemDetailsViewrMutation();
  const [showRedeemVoucherModal, setShowRedeemVoucherModal] = useState(false);
  const [voucherId, setVoucherId] = useState('');
  const [redeemedAmount, setRedeemedAmount] = useState('');
  const [redemptionFiatCurrency, setRedemptionFiatCurrency] = useState('');
  const [bookingId, setBookingId] = useState('');

  const [submitVoucherRedemptionRequest, voucherRedemptionResult] = useItemRegistrerMutation();
  const { isLoading: voucherRedemptionProcessing, isSuccess: voucherRedemptionSuccess, isError: voucherRedemptionError, reset: resetVoucherRedemption } = voucherRedemptionResult;

  const closeRedeemVoucherModal = () => {
    setShowRedeemVoucherModal(false);
    setVoucherId('');
    setRedeemedAmount('');
    setRedemptionFiatCurrency('');
    setBookingId('');
    resetVoucherRedemption();
  };

  useEffect(() => {
    if (!voucherRedemptionProcessing && voucherRedemptionSuccess) {
      const timer = setTimeout(closeRedeemVoucherModal, 3000);
      return () => clearTimeout(timer);
    }
  }, [voucherRedemptionProcessing, voucherRedemptionSuccess]);

  const handleRedeemVoucher = (e) => {
    e.preventDefault();
    submitVoucherRedemptionRequest({
      entity: "voucherredemption",
      data: {
        voucherId,
        bookingId,
        fiatAmount: redeemedAmount,
        fiatCurrency: redemptionFiatCurrency,
      }
    })
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Tools</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Utilities and bulk operations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-soft hover-lift hover:shadow-md transition-shadow">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="w-12 h-12 rounded-xl bg-brand-green/10 flex items-center justify-center mb-4">
              <HomeIcon />
            </div>
            <h3 className="text-lg font-semibold leading-none tracking-tight">
              Verification Scheduler
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Schedule homebase verification prompts
            </p>
          </div>
          <div className="p-6 pt-0">
            <button className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all 
            duration-200 focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2 dark:focus:ring-offset-slate-900 
            disabled:opacity-50 disabled:cursor-not-allowed border-2 border-slate-300 dark:border-slate-700 bg-transparent 
            hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 hover:border-brand-green 
            dark:hover:border-brand-cyan transition-colors px-4 py-2 text-sm w-full`}
              onClick={() => selectedAgentToPrompt.lastName ? scheduleAgentVerificationForOneAgent(selectedAgentToPrompt) : scheduleAgentVerificationForAllAgents({})}
            >
              create schedule
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-soft hover-lift hover:shadow-md transition-shadow">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="w-12 h-12 rounded-xl bg-brand-cyan/10 flex items-center justify-center mb-4">
              <CameraIcon />
            </div>
            <h3 className="text-lg font-semibold leading-none tracking-tight">
              TakeCash
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Verify cash notes by taking a snapshot capturing serial number
            </p>
          </div>
          <div className="p-6 pt-0">
            <button className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all 
            duration-200 focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2 dark:focus:ring-offset-slate-900 
            disabled:opacity-50 disabled:cursor-not-allowed border-2 border-slate-300 dark:border-slate-700 bg-transparent 
            hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 hover:border-brand-green 
            dark:hover:border-brand-cyan transition-colors px-4 py-2 text-sm w-full`}
              onClick={() => startNoteVerification({})}
            >
              Start verification
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-soft hover-lift hover:shadow-md transition-shadow">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
              <TicketIcon />
            </div>
            <h3 className="text-lg font-semibold leading-none tracking-tight">
              Redeem Voucher
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Receive cash from a sales agent and redeem their vocuher
            </p>
          </div>
          <div className="p-6 pt-0">
            <button className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 
              focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 
              disabled:cursor-not-allowed border-2 border-slate-300 dark:border-slate-700 bg-transparent hover:bg-slate-50 
              dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 hover:border-brand-green dark:hover:border-brand-cyan 
              transition-colors px-4 py-2 text-sm w-full`}
              onClick={() => setShowRedeemVoucherModal(true)}
            >
              Redeem
            </button>
          </div>
        </div>

        {/* Redeem Voucher Modal */}
        {showRedeemVoucherModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-4 sm:p-8 rounded-lg max-w-full sm:max-w-md w-full mx-4">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Redeem Voucher</h2>
              <form onSubmit={handleRedeemVoucher} className="space-y-4">
                <input
                  type="text"
                  value={voucherId}
                  onChange={(e) => setVoucherId(e.target.value)}
                  placeholder="Voucher ID"
                  className="w-full px-3 py-2 border rounded text-sm sm:text-base"
                  required
                />
                <input
                  type="number"
                  value={redeemedAmount}
                  onChange={(e) => setRedeemedAmount(e.target.value)}
                  placeholder="Amount to Redeem"
                  className="w-full px-3 py-2 border rounded text-sm sm:text-base"
                  required
                />
                <div>
                  <label> Currency </label>
                  <select
                    value={redemptionFiatCurrency}
                    onChange={(e) => {
                      const currency = e.target.value;
                      setRedemptionFiatCurrency(currency);
                    }}
                    className="w-full px-3 py-2 border rounded text-sm sm:text-base"
                  >
                    <option value="ZAR">ZAR</option>
                  </select>
                </div>
                <div className="flex flex-col sm:flex-row sm:space-x-2">
                  <button type="submit" disabled={voucherRedemptionProcessing} className="bg-lime-600 text-white px-4 py-2 rounded hover:bg-lime-700 text-sm sm:text-base">
                    Redeem Voucher
                  </button>
                  <button
                    type="button"
                    onClick={closeRedeemVoucherModal}
                    className="mt-2 sm:mt-0 text-gray-600 text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                </div>
                {voucherRedemptionProcessing && (
                  <div className="text-center flex items-center justify-center">
                    <FaSpinner className="animate-spin text-lime-600 mr-2" /> Processing...
                  </div>
                )}
                {!voucherRedemptionProcessing && (voucherRedemptionSuccess || voucherRedemptionError) && (
                  <div className={`flex items-center justify-between ${voucherRedemptionSuccess ? 'text-green-600' : 'text-red-600'}`}>
                    <span>
                      {voucherRedemptionSuccess ? <FaCheck className="inline mr-1" /> : <FaTimes className="inline mr-1" />}
                      {voucherRedemptionSuccess ? 'Voucher Redeemed Successfully' : 'Voucher Redemption Failed'}
                    </span>
                    <span onClick={closeRedeemVoucherModal} className="cursor-pointer">x</span>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export { Tools };
