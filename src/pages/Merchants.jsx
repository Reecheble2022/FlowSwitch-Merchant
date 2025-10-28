import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Building2, Mail, Phone } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { useItemsListReadrMutation } from "../backend/api/sharedCrud"
import { selectList } from "../backend/features/sharedMainState"


export function Merchants() {
  const [merchantsPage, setMerchantsPage] = useState(1);
  const [pageSize, setPageSize] = useState(50)

  const [fetchMerchantsFn, {
    isLoading: merchantsLoading,
    isSuccess: merchantsFetchSucceeded,
    isError: merchantsFetchFailed
  }] = useItemsListReadrMutation()

  const merchants = useSelector(st => selectList(st, "merchant"))

  useEffect(() => {
    fetchMerchantsFn({ entity: "merchant", page: merchantsPage, max: pageSize, limit: pageSize });
  }, [merchantsPage]);

  if (merchantsLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-2 border-[#1F6FEB] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">
          Merchants
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          {(merchants || []).length} total merchants
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(merchants || []).map((merchant) => (
          <Card key={merchant.guid} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1F6FEB] to-[#0EA5E9] flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <Badge className={merchant.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'}>
                  {merchant.status}
                </Badge>
              </div>
              <CardTitle className="mt-4">{merchant.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Mail className="w-4 h-4" />
                  {merchant.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Phone className="w-4 h-4" />
                  {merchant.phone}
                </div>
                <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Contact: {merchant.contact_name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Joined {formatDate(merchant.createdAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
