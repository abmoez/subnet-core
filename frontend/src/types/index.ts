export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string };
}

export interface Subnet {
  id: string;
  cidr: string;
  name: string;
  description: string | null;
  totalIps: number;
  createdById: string;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Ip {
  id: string;
  address: string;
  name: string;
  description: string | null;
  status: string;
  subnetId: string;
  createdById: string;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface UploadResult {
  subnets: { total: number; created: number; failed: number };
  ips: { total: number; created: number; failed: number };
  errors: Array<{ row: string; error: string }>;
}

export interface IpStatusCounts {
  active: number;
  reserved: number;
  deprecated: number;
  total: number;
}

export interface CreateSubnetPayload {
  cidr: string;
  name: string;
  description?: string;
}

export interface UpdateSubnetPayload {
  cidr?: string;
  name?: string;
  description?: string;
}

export interface CreateIpPayload {
  address: string;
  name: string;
  description?: string;
  status?: string;
}

export interface UpdateIpPayload {
  name?: string;
  description?: string;
  status?: string;
}
