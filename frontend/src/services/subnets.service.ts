import api from '../lib/axios';
import {
  Subnet,
  PaginatedResponse,
  ApiResponse,
  CreateSubnetPayload,
  UpdateSubnetPayload,
} from '../types';

export const subnetsService = {
  async getAll(
    page = 1,
    limit = 20,
    sortBy?: string,
    sortOrder?: 'ASC' | 'DESC',
  ): Promise<PaginatedResponse<Subnet>> {
    const { data } = await api.get<ApiResponse<PaginatedResponse<Subnet>>>('/subnets', {
      params: { page, limit, sortBy, sortOrder },
    });
    return data.data;
  },

  async getById(id: string): Promise<Subnet> {
    const { data } = await api.get<ApiResponse<Subnet>>(`/subnets/${id}`);
    return data.data;
  },

  async create(payload: CreateSubnetPayload): Promise<Subnet> {
    const { data } = await api.post<ApiResponse<Subnet>>('/subnets', payload);
    return data.data;
  },

  async update(id: string, payload: UpdateSubnetPayload): Promise<Subnet> {
    const { data } = await api.put<ApiResponse<Subnet>>(`/subnets/${id}`, payload);
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/subnets/${id}`);
  },
};
