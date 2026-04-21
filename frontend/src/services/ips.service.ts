import api from '../lib/axios';
import { Ip, PaginatedResponse, ApiResponse, IpStatusCounts, CreateIpPayload, UpdateIpPayload } from '../types';

export const ipsService = {
  async getAll(
    page = 1,
    limit = 20,
    subnetId?: string,
    sortBy?: string,
    sortOrder?: 'ASC' | 'DESC',
  ): Promise<PaginatedResponse<Ip>> {
    const { data } = await api.get<ApiResponse<PaginatedResponse<Ip>>>('/ips', {
      params: { page, limit, subnetId, sortBy, sortOrder },
    });
    return data.data;
  },

  async getStatusCounts(subnetId?: string): Promise<IpStatusCounts> {
    const { data } = await api.get<ApiResponse<IpStatusCounts>>('/ips/stats', {
      params: subnetId ? { subnetId } : undefined,
    });
    return data.data;
  },

  async create(subnetId: string, payload: CreateIpPayload): Promise<Ip> {
    const { data } = await api.post<ApiResponse<Ip>>(`/subnets/${subnetId}/ips`, payload);
    return data.data;
  },

  async update(subnetId: string, ipId: string, payload: UpdateIpPayload): Promise<Ip> {
    const { data } = await api.put<ApiResponse<Ip>>(`/subnets/${subnetId}/ips/${ipId}`, payload);
    return data.data;
  },

  async delete(subnetId: string, ipId: string): Promise<void> {
    await api.delete(`/subnets/${subnetId}/ips/${ipId}`);
  },
};
