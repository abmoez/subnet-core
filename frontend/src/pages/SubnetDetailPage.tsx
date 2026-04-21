import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Network, Globe, Plus, Pencil, Trash2, Activity, Archive, ShieldOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { subnetsService } from '../services/subnets.service';
import { ipsService } from '../services/ips.service';
import { Ip } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import SortableHeader from '../components/SortableHeader';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const ipSchema = z.object({
  address: z
    .string()
    .regex(
      /^(\d{1,3}\.){3}\d{1,3}$/,
      'Must be a valid IPv4 address (e.g., 192.168.1.10)',
    ),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  status: z.enum(['active', 'reserved', 'deprecated']).optional(),
});

type IpFormData = z.infer<typeof ipSchema>;

const statusColors: Record<string, string> = {
  active: 'bg-green-50 text-green-700',
  reserved: 'bg-amber-50 text-amber-700',
  deprecated: 'bg-gray-100 text-gray-500',
};

const statusDotColors: Record<string, string> = {
  active: 'bg-green-500',
  reserved: 'bg-amber-500',
  deprecated: 'bg-gray-400',
};

function getSubnetCapacity(cidr: string): number {
  const prefix = parseInt(cidr.split('/')[1], 10);
  return Math.pow(2, 32 - prefix);
}

function UtilizationRing({ used, capacity }: { used: number; capacity: number }) {
  const pct = capacity > 0 ? Math.min((used / capacity) * 100, 100) : 0;
  const radius = 40;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  const color = pct > 80 ? '#ef4444' : pct >= 50 ? '#f59e0b' : '#22c55e';
  const bgColor = pct > 80 ? '#fef2f2' : pct >= 50 ? '#fffbeb' : '#f0fdf4';

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="100" height="100" viewBox="0 0 100 100" className="drop-shadow-sm">
        <circle
          cx="50" cy="50" r={radius}
          fill={bgColor}
          stroke="#e5e7eb"
          strokeWidth={stroke}
        />
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          className="transition-all duration-700 ease-out"
        />
        <text x="50" y="46" textAnchor="middle" className="fill-gray-900 text-lg font-bold" fontSize="18" fontWeight="700">
          {pct.toFixed(0)}%
        </text>
        <text x="50" y="62" textAnchor="middle" className="fill-gray-400" fontSize="9">
          utilized
        </text>
      </svg>
    </div>
  );
}

export default function SubnetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [ipPage, setIpPage] = useState(1);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingIp, setEditingIp] = useState<Ip | null>(null);
  const [deletingIp, setDeletingIp] = useState<Ip | null>(null);

  const handleSort = useCallback(
    (key: string) => {
      if (sortBy === key) {
        setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
      } else {
        setSortBy(key);
        setSortOrder('ASC');
      }
      setIpPage(1);
    },
    [sortBy],
  );

  const { data: subnet, isLoading: subnetLoading } = useQuery({
    queryKey: ['subnet', id],
    queryFn: () => subnetsService.getById(id!),
    enabled: !!id,
  });

  const { data: ipsData, isLoading: ipsLoading } = useQuery({
    queryKey: ['ips', id, ipPage, sortBy, sortOrder],
    queryFn: () => ipsService.getAll(ipPage, 20, id, sortBy, sortOrder),
    enabled: !!id,
  });

  const { data: statusCounts } = useQuery({
    queryKey: ['ips', 'stats', id],
    queryFn: () => ipsService.getStatusCounts(id),
    enabled: !!id,
  });

  const createIpMutation = useMutation({
    mutationFn: (data: IpFormData) => ipsService.create(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ips', id] });
      queryClient.invalidateQueries({ queryKey: ['ips', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['subnet', id] });
      queryClient.invalidateQueries({ queryKey: ['subnets'] });
      setIsCreateOpen(false);
      toast.success('IP address created');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Failed to create IP';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  const updateIpMutation = useMutation({
    mutationFn: ({ ipId, data }: { ipId: string; data: Partial<IpFormData> }) =>
      ipsService.update(id!, ipId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ips', id] });
      queryClient.invalidateQueries({ queryKey: ['ips', 'stats'] });
      setEditingIp(null);
      toast.success('IP address updated');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Failed to update IP';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  const deleteIpMutation = useMutation({
    mutationFn: (ipId: string) => ipsService.delete(id!, ipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ips', id] });
      queryClient.invalidateQueries({ queryKey: ['ips', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['subnet', id] });
      queryClient.invalidateQueries({ queryKey: ['subnets'] });
      setDeletingIp(null);
      toast.success('IP address deleted');
    },
    onError: () => toast.error('Failed to delete IP'),
  });

  if (subnetLoading) return <LoadingSpinner size="lg" className="py-20" />;

  if (!subnet) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500">Subnet not found</p>
        <button onClick={() => navigate('/subnets')} className="btn-primary mt-4">
          Back to Subnets
        </button>
      </div>
    );
  }

  const capacity = getSubnetCapacity(subnet.cidr);
  const available = Math.max(capacity - subnet.totalIps, 0);
  const utilPct = capacity > 0 ? Math.min((subnet.totalIps / capacity) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/subnets')}
        className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Subnets
      </button>

      {/* Header card with utilization ring */}
      <div className="card">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-start gap-4">
            <div className="rounded-xl bg-blue-100 p-3">
              <Network className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{subnet.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                  {subnet.cidr}
                </span>
                <span className="text-sm text-gray-500">
                  {subnet.totalIps} IP{subnet.totalIps !== 1 ? 's' : ''} assigned
                </span>
                <span className="text-sm text-gray-500">
                  Created {new Date(subnet.createdAt).toLocaleDateString()}
                </span>
              </div>
              {subnet.description && (
                <p className="mt-3 text-sm text-gray-600">{subnet.description}</p>
              )}
            </div>
          </div>
          <div className="flex-shrink-0">
            <UtilizationRing used={subnet.totalIps} capacity={capacity} />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card flex items-center gap-4">
          <div className="rounded-lg bg-blue-50 p-2.5">
            <Globe className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Assigned</p>
            <p className="text-2xl font-bold text-gray-900">{subnet.totalIps}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="rounded-lg bg-emerald-50 p-2.5">
            <Plus className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Available Capacity</p>
            <p className="text-2xl font-bold text-gray-900">{available.toLocaleString()}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className={`rounded-lg p-2.5 ${utilPct > 80 ? 'bg-red-50' : utilPct >= 50 ? 'bg-amber-50' : 'bg-green-50'}`}>
            <Activity className={`h-5 w-5 ${utilPct > 80 ? 'text-red-600' : utilPct >= 50 ? 'text-amber-600' : 'text-green-600'}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Utilization</p>
            <p className={`text-2xl font-bold ${utilPct > 80 ? 'text-red-600' : utilPct >= 50 ? 'text-amber-600' : 'text-green-600'}`}>
              {utilPct.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* IP status breakdown */}
      {statusCounts && statusCounts.total > 0 && (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
          <span className="text-sm font-medium text-gray-500">IP Status:</span>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
            <span className="text-sm text-gray-700">Active</span>
            <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">{statusCounts.active}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="text-sm text-gray-700">Reserved</span>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">{statusCounts.reserved}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-gray-400" />
            <span className="text-sm text-gray-700">Deprecated</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">{statusCounts.deprecated}</span>
          </div>
        </div>
      )}

      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">IP Addresses</h2>
            {ipsData && ipsData.meta.total > 0 && (
              <p className="mt-0.5 text-sm text-gray-500">
                Showing {(ipsData.meta.page - 1) * ipsData.meta.limit + 1} – {Math.min(ipsData.meta.page * ipsData.meta.limit, ipsData.meta.total)} of {ipsData.meta.total} IP addresses
              </p>
            )}
          </div>
          <button onClick={() => setIsCreateOpen(true)} className="btn-primary">
            <Plus className="mr-2 h-4 w-4" />
            Add IP
          </button>
        </div>

        {ipsLoading ? (
          <LoadingSpinner className="py-10" />
        ) : ipsData && ipsData.data.length === 0 ? (
          <EmptyState
            icon={Globe}
            title="No IP addresses yet"
            description={`Add IP addresses within the ${subnet.cidr} range.`}
            action={{ label: 'Add IP Address', onClick: () => setIsCreateOpen(true) }}
          />
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="w-12 px-4 py-3 text-center font-medium text-gray-500">#</th>
                    <SortableHeader label="IP Address" sortKey="address" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
                    <SortableHeader label="Name" sortKey="name" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
                    <th className="px-6 py-3 font-medium text-gray-500">Description</th>
                    <SortableHeader label="Status" sortKey="status" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
                    <th className="px-6 py-3 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ipsData?.data.map((ip, idx) => (
                    <tr key={ip.id} className={`hover:bg-gray-50 ${idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                      <td className="w-12 px-4 py-3 text-center text-xs font-medium text-gray-400">
                        {((ipsData.meta.page - 1) * ipsData.meta.limit) + idx + 1}
                      </td>
                      <td className="px-6 py-3 font-mono font-medium text-gray-900">
                        {ip.address}
                      </td>
                      <td className="px-6 py-3 text-gray-700">{ip.name}</td>
                      <td className="max-w-xs truncate px-6 py-3 text-gray-500">
                        {ip.description || '—'}
                      </td>
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center gap-1.5">
                          <span className={`inline-block h-2 w-2 rounded-full ${statusDotColors[ip.status] || statusDotColors.active}`} />
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                              statusColors[ip.status] || statusColors.active
                            }`}
                          >
                            {ip.status}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingIp(ip)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-amber-600"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingIp(ip)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {ipsData && (
              <Pagination
                page={ipPage}
                totalPages={ipsData.meta.totalPages}
                onPageChange={setIpPage}
              />
            )}
          </>
        )}
      </div>

      <IpFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={(data) => createIpMutation.mutate(data)}
        isLoading={createIpMutation.isPending}
        title="Add IP Address"
        subnetCidr={subnet.cidr}
      />

      {editingIp && (
        <IpFormModal
          isOpen={!!editingIp}
          onClose={() => setEditingIp(null)}
          onSubmit={(data) =>
            updateIpMutation.mutate({ ipId: editingIp.id, data })
          }
          isLoading={updateIpMutation.isPending}
          title="Edit IP Address"
          subnetCidr={subnet.cidr}
          defaultValues={{
            address: editingIp.address,
            name: editingIp.name,
            description: editingIp.description ?? '',
            status: editingIp.status as 'active' | 'reserved' | 'deprecated',
          }}
          isEdit
        />
      )}

      <ConfirmDialog
        isOpen={!!deletingIp}
        onClose={() => setDeletingIp(null)}
        onConfirm={() => deletingIp && deleteIpMutation.mutate(deletingIp.id)}
        title="Delete IP Address"
        message={`Are you sure you want to delete ${deletingIp?.address}${deletingIp?.name ? ` (${deletingIp.name})` : ''}? This action cannot be undone.`}
        isLoading={deleteIpMutation.isPending}
      />
    </div>
  );
}

function IpFormModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  title,
  subnetCidr,
  defaultValues,
  isEdit = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: IpFormData) => void;
  isLoading: boolean;
  title: string;
  subnetCidr: string;
  defaultValues?: Partial<IpFormData>;
  isEdit?: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<IpFormData>({
    resolver: zodResolver(ipSchema),
    defaultValues: { status: 'active', ...defaultValues },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <div className="mb-4 rounded-lg bg-blue-50 px-3 py-2">
        <p className="text-xs text-blue-700">
          Subnet range: <span className="font-mono font-medium">{subnetCidr}</span>
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            IP Address <span className="text-red-500">*</span>
          </label>
          <input
            {...register('address')}
            placeholder="e.g., 192.168.1.10"
            className="input-field font-mono"
            disabled={isEdit}
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
          )}
          {isEdit && (
            <p className="mt-1 text-xs text-gray-400">IP address cannot be changed after creation</p>
          )}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('name')}
            placeholder="e.g., Web Server"
            className="input-field"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
          <textarea
            {...register('description')}
            rows={2}
            placeholder="What is this IP used for?"
            className="input-field resize-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Status</label>
          <select {...register('status')} className="input-field">
            <option value="active">Active</option>
            <option value="reserved">Reserved</option>
            <option value="deprecated">Deprecated</option>
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={handleClose} className="btn-secondary" disabled={isLoading}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
