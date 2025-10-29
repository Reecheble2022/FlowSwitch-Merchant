import { useState } from 'react';
import { Wallet, TrendingUp, Receipt, Clock } from 'lucide-react';
import { useSelector } from 'react-redux';
import { Card } from '../components/ui/Card';
import { useItemsListReadrMutation, useItemsListReaderQuery } from "../backend/api/sharedCrud";
import { selectList } from "../backend/features/sharedMainState"

export function Float() {
  const [activeTab, setActiveTab] = useState('overview');
  const [floatWalletsPage, setFloatWalletsPage] = useState(1);
  const [vouchersPage, setVouchersPage] = useState(1);
  const [voucherRedemptionsPage, setVoucherRedemptionsPage] = useState(1);
  const [pageSize, setPageSize] = useState(200)
  const { isLoading: floatWalletsLoading } = useItemsListReaderQuery({ entity: "floatwallet", page: floatWalletsPage, limit: pageSize, max: pageSize });
  const { isLoading: vouchersLoading } = useItemsListReaderQuery({ entity: "voucher", page: vouchersPage, limit: pageSize, max: pageSize });
  const { isLoading: voucherRedemptionsLoading } = useItemsListReaderQuery({ entity: "voucherredemption", page: voucherRedemptionsPage, limit: pageSize, max: pageSize });
  const floatWallets = useSelector(st => selectList(st, "floatwallet"))
  const vouchers = useSelector(st => selectList(st, "voucher"))
  const voucherRedemptions = useSelector(st => selectList(st, "voucherredemption"))

  const tabs = [
    { id: 'overview', name: 'Overview', icon: TrendingUp },
    { id: 'accounts', name: 'Float Accounts', icon: Wallet },
    { id: 'vouchers', name: 'Vouchers', icon: Receipt },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center text-white shadow-glow">
              <Wallet className="w-6 h-6" />
            </div>
            Float & Vouchers
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Manage float accounts and voucher issuance
          </p>
        </div>
      </div>

      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === tab.id
                      ? 'border-brand-green text-brand-green'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {activeTab === 'overview' && <OverviewTab setActiveTab={setActiveTab}/>}
      {activeTab === 'accounts' && <AccountsTab />}
      {activeTab === 'vouchers' && <VouchersTab />}
    </div>
  );
}

const OverviewTab = ({ setActiveTab }) => {
  const [floatWalletsPage, setFloatWalletsPage] = useState(1);
  const [vouchersPage, setVouchersPage] = useState(1);
  const [voucherRedemptionsPage, setVoucherRedemptionsPage] = useState(1);
  const [pageSize, setPageSize] = useState(200)
  const { isLoading: floatWalletsLoading } = useItemsListReaderQuery({ entity: "floatwallet", page: floatWalletsPage, limit: pageSize, max: pageSize });
  const { isLoading: vouchersLoading } = useItemsListReaderQuery({ entity: "voucher", page: vouchersPage, limit: pageSize, max: pageSize });
  const { isLoading: voucherRedemptionsLoading } = useItemsListReaderQuery({ entity: "voucherredemption", page: voucherRedemptionsPage, limit: pageSize, max: pageSize });
  const floatWallets = useSelector(st => selectList(st, "floatwallet"))
  const vouchers = useSelector(st => selectList(st, "voucher"))
  const voucherRedemptions = useSelector(st => selectList(st, "voucherredemption"))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400"> Total Float in Play </p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white"> 
                R{(floatWallets || []).reduce((sum, item) => sum + item.floatFiatBalance, 0) + (vouchers || []).reduce((sum, item) => sum + item.voucherFiatValue, 0)}
              </p>
              <p className="mt-1 text-sm text-brand-green"> +12.5% from last week </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-green/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-brand-green" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Vouchers</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white"> {(vouchers || []).length} </p>
              <p className="mt-1 text-sm text-slate-500">Worth R{(vouchers || []).reduce((sum, item) => sum + item.voucherFiatValue, 0)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-cyan/10 flex items-center justify-center">
              <Receipt className="w-6 h-6 text-brand-cyan" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Redeemed Today</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white"> {(voucherRedemptions || []).length} </p>
              <p className="mt-1 text-sm text-slate-500">Worth R{(voucherRedemptions || []).reduce((sum, item) => sum + item.fiatAmount, 0)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Receipt className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Expiring in 7 Days</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">0</p>
              <p className="mt-1 text-sm text-slate-500">Worth R0</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">System Account</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">System Float Account</p>
              <p className="text-sm text-slate-500">ID: system</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-brand-green">
                R {(floatWallets || []).reduce((sum, item) => sum + item.floatFiatBalance, 0)}
              </p>
              <p className="text-sm text-slate-500">Available balance</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="text-center py-12">
          <Wallet className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Float & Vouchers System Ready</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            The float management and voucher system is fully operational.
            <br />
            Navigate to Float Accounts or Vouchers to get started.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setActiveTab('accounts')}
              className="px-6 py-2.5 bg-gradient-brand text-white rounded-xl font-medium shadow-glow hover:shadow-glow-lg transition-all"
            >
              Manage Float Accounts
            </button>
            <button
              onClick={() => setActiveTab('vouchers')}
              className="px-6 py-2.5 border-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              Create Vouchers
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

const AccountsTab = () => {
  const [floatWalletsPage, setFloatWalletsPage] = useState(1);
  const [vouchersPage, setVouchersPage] = useState(1);
  const [voucherRedemptionsPage, setVoucherRedemptionsPage] = useState(1);
  const [pageSize, setPageSize] = useState(200)
  const { isLoading: floatWalletsLoading } = useItemsListReaderQuery({ entity: "floatwallet", page: floatWalletsPage, limit: pageSize, max: pageSize });
  const { isLoading: vouchersLoading } = useItemsListReaderQuery({ entity: "voucher", page: vouchersPage, limit: pageSize, max: pageSize });
  const { isLoading: voucherRedemptionsLoading } = useItemsListReaderQuery({ entity: "voucherredemption", page: voucherRedemptionsPage, limit: pageSize, max: pageSize });
  const floatWallets = useSelector(st => selectList(st, "floatwallet"))
  const vouchers = useSelector(st => selectList(st, "voucher"))
  const voucherRedemptions = useSelector(st => selectList(st, "voucherredemption"))
  return (
    <Card className="p-6">
      <div className="text-center py-12">
        <Wallet className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Float Accounts</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Float accounts management interface.
        </p>
        <div className="max-w-2xl mx-auto text-left space-y-4">
          {(floatWallets || []).map(walletAccount => (
              <div key={walletAccount.guid} className="p-4 rounded-xl bg-brand-cyan/5 border border-brand-cyan/20">
                <h4 className={`font-semibold mb-2 ${walletAccount.floatFiatBalance ? "text-brand-cyan" : "text-amber-600"}`}>
                  ✓ {walletAccount.agentGuid.firstName} {walletAccount.agentGuid.lastName} ({walletAccount.floatFiatBalance})
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Agent ID: {walletAccount.agentGuid?.ussdCode} , Phone: {walletAccount.agentGuid?.phone}, Address: {walletAccount.agentGuid?.address}, Merchant: {walletAccount.merchantGuid?.name || "__"}
                </p>
              </div>
          ))}
          {/*
          <div className="p-4 rounded-xl bg-brand-cyan/5 border border-brand-cyan/20">
            <h4 className="font-semibold text-brand-cyan mb-2">✓ API Functions Ready</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Complete float and voucher operations available in floatApi
            </p>
          </div>
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <h4 className="font-semibold text-amber-600 mb-2">⏳ UI Implementation In Progress</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Full UI components for account management, voucher creation, and redemption
            </p>
          </div>
          */}
        </div>
      </div>
    </Card>
  );
}

const VouchersTab = () => {
  const [floatWalletsPage, setFloatWalletsPage] = useState(1);
  const [vouchersPage, setVouchersPage] = useState(1);
  const [voucherRedemptionsPage, setVoucherRedemptionsPage] = useState(1);
  const [pageSize, setPageSize] = useState(200)
  const { isLoading: floatWalletsLoading } = useItemsListReaderQuery({ entity: "floatwallet", page: floatWalletsPage, limit: pageSize, max: pageSize });
  const { isLoading: vouchersLoading } = useItemsListReaderQuery({ entity: "voucher", page: vouchersPage, limit: pageSize, max: pageSize });
  const { isLoading: voucherRedemptionsLoading } = useItemsListReaderQuery({ entity: "voucherredemption", page: voucherRedemptionsPage, limit: pageSize, max: pageSize });
  const floatWallets = useSelector(st => selectList(st, "floatwallet"))
  const vouchers = useSelector(st => selectList(st, "voucher"))
  const voucherRedemptions = useSelector(st => selectList(st, "voucherredemption"))
  return (
    <Card className="p-6">
      <div className="text-center py-12">
        <Receipt className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Voucher Management</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Voucher creation, redemption, and tracking interface will be displayed here.
          <br />
          All backend logic is complete and ready to use.
        </p>
        <div className="max-w-2xl mx-auto text-left space-y-4">
          {(vouchers || []).map(voucher => (
              <div key={voucher.guid} className="p-4 rounded-xl bg-brand-cyan/5 border border-brand-cyan/20">
                <h4 className={`font-semibold mb-2 ${voucher.voucherFiatValue ? "text-brand-cyan" : "text-amber-600"}`}>
                  ✓ {voucher.agentGuid.firstName} {voucher.agentGuid.lastName} ({voucher.voucherFiatValue})
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Merchant: {voucher.merchantGuid?.name || "__"}, Agent ID: {voucher.agentGuid?.ussdCode} , Phone: {voucher.agentGuid?.phone}, Address: {voucher.agentGuid?.address}
                </p>
              </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function setActiveTab(tab) {
  return tab;
}
