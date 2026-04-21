import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Eye, Network } from 'lucide-react';
import toast from 'react-hot-toast';
import { subnetsService } from '../services/subnets.service';
import { Subnet } from '../types';
import Pagination from '../components/Pagination';
import SortableHeader from '../components/SortableHeader';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

function getSubnetCapacity(cidr: string): number {
  const prefix = parseInt(cidr.split('/')[1], 10);
  return Math.pow(2, 32 - prefix);
}

function getUtilColor(pct: number): string {
  if (pct >= 80) return 'red';
  if (pct >= 50) return 'amber';
  return 'emerald';
}

const subnetSchema = z.object({
  cidr: z
    .string()
    .regex(
      /^(\d{1,3}\.){3}\d{1,3}\/([0-9]|[1-2][0-9]|3[0-2])$/,
      'Must be valid CIDR (e.g., 192.168.1.0/24)',
    ),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

type SubnetFormData = z.infer<typeof subnetSchema>;

export default function SubnetsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSubnet, setEditingSubnet] = useState<Subnet | null>(null);
  const [deletingSubnet, setDeletingSubnet] = useState<Subnet | null>(null);

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

  const { data, isLoading, isError } = useQuery({
    queryKey: ['subnets', page, sortBy, sortOrder],
    queryFn: () => subnetsService.getAll(page, 20, sortBy, sortOrder),
  });

  const createMutation = useMutation({
    mutationFn: subnetsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subnets'] });
      setIsCreateOpen(false);
      toast.success('Subnet created successfully');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Failed to create subnet';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SubnetFormData }) =>
      subnetsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subnets'] });
      setEditingSubnet(null);
      toast.success('Subnet updated successfully');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Failed to update subnet';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: subnetsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subnets'] });
      setDeletingSubnet(null);
      toast.success('Subnet deleted successfully');
    },
    onError: () => toast.error('Failed to delete subnet'),
  });

  if (isLoading) return <LoadingSpinner size="lg" className="py-20" />;

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700">Failed to load subnets. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subnets</h1>
          <p className="mt-1 text-sm text-gray-500">
            {data ? (
              data.meta.total === 0
                ? 'No subnets'
                : `Showing ${(data.meta.page - 1) * data.meta.limit + 1} – ${Math.min(data.meta.page * data.meta.limit, data.meta.total)} of ${data.meta.total} subnets`
            ) : (
              'Loading...'
            )}
          </p>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="btn-primary">
          <Plus className="mr-2 h-4 w-4" />
          Add Subnet
        </button>
      </div>

      {data && data.data.length === 0 && !sortBy ? (
        <EmptyState
          icon={Network}
          title="No subnets yet"
          description="Create your first subnet or upload a CSV file to get started."
          action={{ label: 'Create Subnet', onClick: () => setIsCreateOpen(true) }}
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="w-12 px-4 py-3 text-center font-medium text-gray-500">#</th>
                  <SortableHeader
                    label="Name"
                    sortKey="name"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="CIDR"
                    sortKey="cidr"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Total IPs"
                    sortKey="totalIps"
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
                  <th className="px-6 py-3 text-right font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.data.map((subnet, idx) => {
                  const rowNum = (page - 1) * 20 + idx + 1;
                  const capacity = getSubnetCapacity(subnet.cidr);
                  const utilPct = Math.min((subnet.totalIps / capacity) * 100, 100);
                  const color = getUtilColor(utilPct);
                  const hasIps = subnet.totalIps > 0;

                  const borderClass =
                    color === 'red'
                      ? 'border-l-red-500'
                      : color === 'amber'
                        ? 'border-l-amber-400'
                        : 'border-l-emerald-400';

                  const barBg =
                    color === 'red'
                      ? 'bg-red-500'
                      : color === 'amber'
                        ? 'bg-amber-400'
                        : 'bg-emerald-500';

                  const badgeBg =
                    color === 'red'
                      ? 'bg-red-50 text-red-700'
                      : color === 'amber'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700';

                  return (
                    <tr
                      key={subnet.id}
                      className={`hover:bg-gray-50 border-l-4 ${borderClass} transition-colors`}
                    >
                      <td className="w-12 px-4 py-4 text-center text-gray-400">{rowNum}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${
                              hasIps ? 'bg-emerald-500 shadow-sm shadow-emerald-200' : 'bg-gray-300'
                            }`}
                            title={hasIps ? 'Has assigned IPs' : 'No IPs assigned'}
                          />
                          <span className="font-medium text-gray-900">{subnet.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                          {subnet.cidr}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-600 tabular-nums">
                            {subnet.totalIps.toLocaleString()}
                            <span className="text-gray-400"> / {capacity.toLocaleString()}</span>
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                              <div
                                className={`h-full rounded-full ${barBg} transition-all`}
                                style={{ width: `${utilPct}%` }}
                              />
                            </div>
                            <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${badgeBg}`}>
                              {Math.round(utilPct)}%
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(subnet.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/subnets/${subnet.id}`)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingSubnet(subnet)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-amber-600"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingSubnet(subnet)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
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

      <SubnetFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={(formData) => createMutation.mutate(formData)}
        isLoading={createMutation.isPending}
        title="Create Subnet"
      />

      {editingSubnet && (
        <SubnetFormModal
          isOpen={!!editingSubnet}
          onClose={() => setEditingSubnet(null)}
          onSubmit={(formData) =>
            updateMutation.mutate({ id: editingSubnet.id, data: formData })
          }
          isLoading={updateMutation.isPending}
          title="Edit Subnet"
          defaultValues={{
            cidr: editingSubnet.cidr,
            name: editingSubnet.name,
            description: editingSubnet.description ?? '',
          }}
        />
      )}

      <ConfirmDialog
        isOpen={!!deletingSubnet}
        onClose={() => setDeletingSubnet(null)}
        onConfirm={() => deletingSubnet && deleteMutation.mutate(deletingSubnet.id)}
        title="Delete Subnet"
        message={`Are you sure you want to delete "${deletingSubnet?.name}" (${deletingSubnet?.cidr})? This will also remove all associated IP addresses. This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

function SubnetFormModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  title,
  defaultValues,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SubnetFormData) => void;
  isLoading: boolean;
  title: string;
  defaultValues?: Partial<SubnetFormData>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SubnetFormData>({
    resolver: zodResolver(subnetSchema),
    defaultValues,
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            CIDR <span className="text-red-500">*</span>
          </label>
          <input
            {...register('cidr')}
            placeholder="e.g., 192.168.1.0/24"
            className="input-field"
          />
          {errors.cidr && <p className="mt-1 text-sm text-red-600">{errors.cidr.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('name')}
            placeholder="e.g., Office Network"
            className="input-field"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Optional description..."
            className="input-field resize-none"
          />
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
