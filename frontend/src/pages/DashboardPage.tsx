import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Network,
  Globe,
  Upload,
  Plus,
  ArrowRight,
  Activity,
  Shield,
  Clock,
  Layers,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { subnetsService } from '../services/subnets.service';
import { ipsService } from '../services/ips.service';
import type { Subnet, IpStatusCounts } from '../types';

function getSubnetCapacity(cidr: string): number {
  const prefix = parseInt(cidr.split('/')[1], 10);
  return Math.pow(2, 32 - prefix);
}

function UtilizationRing({
  used,
  total,
  size = 80,
  strokeWidth = 7,
}: {
  used: number;
  total: number;
  size?: number;
  strokeWidth?: number;
}) {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  let strokeColor = '#22c55e';
  if (pct >= 80) strokeColor = '#ef4444';
  else if (pct >= 50) strokeColor = '#f59e0b';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-gray-700">
          {Math.round(pct)}%
        </span>
      </div>
    </div>
  );
}

function MiniBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  let color = 'bg-emerald-500';
  if (pct >= 80) color = 'bg-red-500';
  else if (pct >= 50) color = 'bg-amber-500';

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500">{Math.round(pct)}%</span>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
  delay: number;
}

function StatCard({ label, value, icon: Icon, gradient, iconBg, delay }: StatCardProps) {
  return (
    <div
      className="animate-fade-in-up relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{ background: gradient }}
      />
      <div className="relative flex items-center gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const { data: subnetsData, isLoading: subnetsLoading } = useQuery({
    queryKey: ['subnets', 1, 100],
    queryFn: () => subnetsService.getAll(1, 100),
  });

  const { data: ipStats, isLoading: statsLoading } = useQuery<IpStatusCounts>({
    queryKey: ['ips', 'stats'],
    queryFn: () => ipsService.getStatusCounts(),
  });

  const isLoading = subnetsLoading || statsLoading;

  const subnets: Subnet[] = subnetsData?.data ?? [];
  const totalSubnets = subnetsData?.meta.total ?? 0;
  const totalIps = ipStats?.total ?? 0;

  const activeIps = ipStats?.active ?? 0;
  const reservedIps = ipStats?.reserved ?? 0;
  const deprecatedIps = ipStats?.deprecated ?? 0;

  if (isLoading) {
    return <LoadingSpinner size="lg" className="py-20" />;
  }

  const statusTotal = activeIps + reservedIps + deprecatedIps;

  const quickActions = [
    {
      label: 'Create Subnet',
      desc: 'Define a new network range',
      icon: Plus,
      to: '/subnets',
      color: 'from-primary-500 to-primary-600',
    },
    {
      label: 'Upload Bulk Data',
      desc: 'Bulk import subnets & IPs',
      icon: Upload,
      to: '/upload',
      color: 'from-violet-500 to-purple-600',
    },
    {
      label: 'Browse IPs',
      desc: 'View all IP assignments',
      icon: Globe,
      to: '/ips',
      color: 'from-emerald-500 to-teal-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Network Overview
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Real-time status of your network infrastructure
        </p>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Subnets"
          value={totalSubnets}
          icon={Network}
          gradient="linear-gradient(135deg, #3b82f6, #1d4ed8)"
          iconBg="bg-gradient-to-br from-blue-500 to-blue-700"
          delay={0}
        />
        <StatCard
          label="Total IPs"
          value={totalIps}
          icon={Layers}
          gradient="linear-gradient(135deg, #8b5cf6, #6d28d9)"
          iconBg="bg-gradient-to-br from-violet-500 to-violet-700"
          delay={50}
        />
        <StatCard
          label="Active IPs"
          value={activeIps}
          icon={Activity}
          gradient="linear-gradient(135deg, #22c55e, #16a34a)"
          iconBg="bg-gradient-to-br from-emerald-500 to-emerald-700"
          delay={100}
        />
        <StatCard
          label="Reserved IPs"
          value={reservedIps}
          icon={Shield}
          gradient="linear-gradient(135deg, #f59e0b, #d97706)"
          iconBg="bg-gradient-to-br from-amber-500 to-amber-700"
          delay={150}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Subnet Utilization */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Subnet Utilization
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Allocated IPs vs max capacity
                </p>
              </div>
              <button
                onClick={() => navigate('/subnets')}
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                View all
              </button>
            </div>

            {subnets.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                No subnets configured yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {subnets.slice(0, 6).map((subnet) => {
                  const capacity = getSubnetCapacity(subnet.cidr);
                  return (
                    <button
                      key={subnet.id}
                      onClick={() => navigate(`/subnets/${subnet.id}`)}
                      className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4 text-left transition-all hover:border-primary-200 hover:bg-primary-50/30 hover:shadow-sm"
                    >
                      <UtilizationRing used={subnet.totalIps} total={capacity} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-800">
                          {subnet.name}
                        </p>
                        <span className="mt-1 inline-flex rounded-md bg-gray-200/70 px-1.5 py-0.5 text-[11px] font-mono font-medium text-gray-600">
                          {subnet.cidr}
                        </span>
                        <p className="mt-1 text-xs text-gray-400">
                          {subnet.totalIps.toLocaleString()} /{' '}
                          {capacity.toLocaleString()} IPs
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* IP Status Distribution */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">IP Status</h2>
          <p className="text-xs text-gray-400 mt-0.5 mb-6">
            Distribution by assignment status
          </p>

          {statusTotal === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              No IPs tracked yet.
            </p>
          ) : (
            <>
              {/* Stacked horizontal bar */}
              <div className="mb-6 h-4 overflow-hidden rounded-full bg-gray-100">
                {activeIps > 0 && (
                  <div
                    className="inline-block h-full bg-emerald-500 transition-all duration-500"
                    style={{
                      width: `${(activeIps / statusTotal) * 100}%`,
                    }}
                  />
                )}
                {reservedIps > 0 && (
                  <div
                    className="inline-block h-full bg-amber-400 transition-all duration-500"
                    style={{
                      width: `${(reservedIps / statusTotal) * 100}%`,
                    }}
                  />
                )}
                {deprecatedIps > 0 && (
                  <div
                    className="inline-block h-full bg-gray-400 transition-all duration-500"
                    style={{
                      width: `${(deprecatedIps / statusTotal) * 100}%`,
                    }}
                  />
                )}
              </div>

              {/* Legend */}
              <div className="space-y-3">
                {[
                  {
                    label: 'Active',
                    count: activeIps,
                    dot: 'bg-emerald-500',
                  },
                  {
                    label: 'Reserved',
                    count: reservedIps,
                    dot: 'bg-amber-400',
                  },
                  {
                    label: 'Other',
                    count: deprecatedIps,
                    dot: 'bg-gray-400',
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${item.dot}`}
                      />
                      <span className="text-sm text-gray-600">
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-800">
                        {item.count.toLocaleString()}
                      </span>
                      <span className="w-10 text-right text-xs text-gray-400">
                        {statusTotal > 0
                          ? Math.round((item.count / statusTotal) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.to)}
              className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300"
            >
              <div
                className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-[0.04]"
                style={{
                  background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                }}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${action.color} shadow-sm`}
                  >
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {action.label}
                    </p>
                    <p className="text-xs text-gray-400">{action.desc}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-gray-500" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Subnets Table */}
      {subnets.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Subnets
              </h2>
            </div>
            <button
              onClick={() => navigate('/subnets')}
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View all
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 font-medium text-gray-500">Name</th>
                  <th className="pb-3 font-medium text-gray-500">CIDR</th>
                  <th className="pb-3 font-medium text-gray-500">IPs</th>
                  <th className="pb-3 font-medium text-gray-500">
                    Utilization
                  </th>
                  <th className="pb-3 font-medium text-gray-500">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {subnets.slice(0, 5).map((subnet) => {
                  const capacity = getSubnetCapacity(subnet.cidr);
                  return (
                    <tr
                      key={subnet.id}
                      className="cursor-pointer transition-colors hover:bg-gray-50/70"
                      onClick={() => navigate(`/subnets/${subnet.id}`)}
                    >
                      <td className="py-3.5 font-medium text-gray-900">
                        {subnet.name}
                      </td>
                      <td className="py-3.5">
                        <span className="inline-flex rounded-md bg-primary-50 px-2 py-0.5 font-mono text-xs font-medium text-primary-700">
                          {subnet.cidr}
                        </span>
                      </td>
                      <td className="py-3.5 text-gray-600">
                        {subnet.totalIps.toLocaleString()}
                      </td>
                      <td className="py-3.5">
                        <MiniBar value={subnet.totalIps} max={capacity} />
                      </td>
                      <td className="py-3.5 text-gray-400">
                        {new Date(subnet.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
