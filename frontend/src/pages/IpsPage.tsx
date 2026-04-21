import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Globe, Network } from 'lucide-react';
import { ipsService } from '../services/ips.service';
import { subnetsService } from '../services/subnets.service';
import Pagination from '../components/Pagination';
import SortableHeader from '../components/SortableHeader';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';

const statusDotClass: Record<string, string> = {
  active: 'bg-green-500',
  reserved: 'bg-amber-500',
  deprecated: 'bg-gray-400',
};

const statusTextClass: Record<string, string> = {
  active: 'text-green-700',
  reserved: 'text-amber-700',
  deprecated: 'text-gray-500',
};

export default function IpsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [selectedSubnet, setSelectedSubnet] = useState<string>('');
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const handleSort = useCallback(
    (key: string) => {
      if (sortBy === key) {
        setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
      } else {
        setSortBy(key);
        setSortOrder('ASC');
      }
      setPage(1);
    },
    [sortBy],
  );

  const { data: subnetsData } = useQuery({
    queryKey: ['subnets-all'],
    queryFn: () => subnetsService.getAll(1, 100),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['ips', page, selectedSubnet, sortBy, sortOrder],
    queryFn: () =>
      ipsService.getAll(page, 20, selectedSubnet || undefined, sortBy, sortOrder),
  });

  const { data: statusCounts } = useQuery({
    queryKey: ['ips', 'stats', selectedSubnet],
    queryFn: () => ipsService.getStatusCounts(selectedSubnet || undefined),
  });

  const barTotal = (statusCounts?.active ?? 0) + (statusCounts?.reserved ?? 0) + (statusCounts?.deprecated ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">IP Addresses</h1>
          <p className="mt-1 text-sm text-gray-500">
            {data ? (
              data.meta.total === 0
                ? 'No IP addresses'
                : `Showing ${(data.meta.page - 1) * data.meta.limit + 1} – ${Math.min(data.meta.page * data.meta.limit, data.meta.total)} of ${data.meta.total} IP addresses`
            ) : (
              'Loading...'
            )}
          </p>
        </div>
        <select
          value={selectedSubnet}
          onChange={(e) => {
            setSelectedSubnet(e.target.value);
            setPage(1);
          }}
          className="input-field w-auto min-w-[200px]"
        >
          <option value="">All Subnets</option>
          {subnetsData?.data.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.cidr})
            </option>
          ))}
        </select>
      </div>

      {/* Status summary bar */}
      {statusCounts && barTotal > 0 && (
        <div className="card !py-4">
          <div className="mb-3 flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
              <span className="font-medium text-gray-700">Active</span>
              <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">{statusCounts.active}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="font-medium text-gray-700">Reserved</span>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">{statusCounts.reserved}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-gray-400" />
              <span className="font-medium text-gray-700">Deprecated</span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">{statusCounts.deprecated}</span>
            </div>
          </div>
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
            {statusCounts.active > 0 && (
              <div
                className="bg-green-500 transition-all duration-500"
                style={{ width: `${(statusCounts.active / barTotal) * 100}%` }}
              />
            )}
            {statusCounts.reserved > 0 && (
              <div
                className="bg-amber-500 transition-all duration-500"
                style={{ width: `${(statusCounts.reserved / barTotal) * 100}%` }}
              />
            )}
            {statusCounts.deprecated > 0 && (
              <div
                className="bg-gray-400 transition-all duration-500"
                style={{ width: `${(statusCounts.deprecated / barTotal) * 100}%` }}
              />
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner size="lg" className="py-20" />
      ) : data && data.data.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="No IP addresses found"
          description={
            selectedSubnet
              ? 'No IPs found for the selected subnet. Open the subnet to add IPs.'
              : 'Open a subnet and add IP addresses to get started.'
          }
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="w-12 px-4 py-3 text-center font-medium text-gray-500">#</th>
                  <SortableHeader
                    label="IP Address"
                    sortKey="address"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Name"
                    sortKey="name"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <th className="px-6 py-3 font-medium text-gray-500">Subnet</th>
                  <SortableHeader
                    label="Status"
                    sortKey="status"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Created"
                    sortKey="createdAt"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                  />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.data.map((ip, idx) => {
                  const subnet = subnetsData?.data.find((s) => s.id === ip.subnetId);
                  const rowNum = (page - 1) * 20 + idx + 1;
                  return (
                    <tr
                      key={ip.id}
                      className={`cursor-pointer hover:bg-gray-50 ${idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}
                      onClick={() => navigate(`/subnets/${ip.subnetId}`)}
                    >
                      <td className="w-12 px-4 py-3 text-center text-gray-400">{rowNum}</td>
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center gap-2 font-mono font-medium text-gray-900">
                          <Network className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                          {ip.address}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-700">{ip.name}</td>
                      <td className="px-6 py-3">
                        <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                          {subnet?.cidr || ip.subnetId}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center gap-1.5">
                          <span className={`inline-block h-2 w-2 rounded-full ${statusDotClass[ip.status] || statusDotClass.active} ${ip.status === 'active' ? 'animate-pulse' : ''}`} />
                          <span className={`text-sm font-medium capitalize ${statusTextClass[ip.status] || statusTextClass.active}`}>
                            {ip.status}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-500">
                        {new Date(ip.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {data && (
            <Pagination page={page} totalPages={data.meta.totalPages} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}
