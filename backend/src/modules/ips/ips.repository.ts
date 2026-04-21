import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsOrder } from 'typeorm';
import { Ip } from './entities/ip.entity';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';

const SORTABLE_COLUMNS = new Set(['address', 'name', 'status', 'createdAt', 'updatedAt']);

@Injectable()
export class IpsRepository {
  constructor(
    @InjectRepository(Ip)
    private readonly repository: Repository<Ip>,
  ) {}

  async findBySubnet(
    subnetId: string,
    skip: number,
    take: number,
    sortBy?: string,
    sortOrder: 'ASC' | 'DESC' = 'ASC',
  ): Promise<PaginatedResult<Ip>> {
    const order: FindOptionsOrder<Ip> =
      sortBy && SORTABLE_COLUMNS.has(sortBy) ? { [sortBy]: sortOrder } : { address: 'ASC' };

    const [data, total] = await this.repository.findAndCount({
      where: { subnetId },
      order,
      skip,
      take,
    });
    return { data, total };
  }

  async findAll(
    skip: number,
    take: number,
    sortBy?: string,
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ): Promise<PaginatedResult<Ip>> {
    const order: FindOptionsOrder<Ip> =
      sortBy && SORTABLE_COLUMNS.has(sortBy) ? { [sortBy]: sortOrder } : { createdAt: 'DESC' };

    const [data, total] = await this.repository.findAndCount({
      order,
      skip,
      take,
    });
    return { data, total };
  }

  async findById(id: string): Promise<Ip | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByIdAndSubnet(id: string, subnetId: string): Promise<Ip | null> {
    return this.repository.findOne({ where: { id, subnetId } });
  }

  async findByAddressAndSubnet(address: string, subnetId: string): Promise<Ip | null> {
    return this.repository.findOne({ where: { address, subnetId } });
  }

  async create(ipData: Partial<Ip>): Promise<Ip> {
    const ip = this.repository.create(ipData);
    return this.repository.save(ip);
  }

  async update(id: string, data: Partial<Ip>): Promise<Ip | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async deleteBySubnetId(subnetId: string): Promise<void> {
    await this.repository.delete({ subnetId });
  }

  async countBySubnetId(subnetId: string): Promise<number> {
    return this.repository.count({ where: { subnetId } });
  }

  async getStatusCounts(subnetId?: string): Promise<{
    active: number;
    reserved: number;
    deprecated: number;
    total: number;
  }> {
    const qb = this.repository
      .createQueryBuilder('ip')
      .select('ip.status', 'status')
      .addSelect('COUNT(*)::int', 'count');

    if (subnetId) {
      qb.where('ip.subnetId = :subnetId', { subnetId });
    }

    const result = await qb
      .groupBy('ip.status')
      .getRawMany<{ status: string; count: number }>();

    const counts = { active: 0, reserved: 0, deprecated: 0, total: 0 };
    for (const row of result) {
      const n = Number(row.count);
      counts.total += n;
      if (row.status === 'active') counts.active = n;
      else if (row.status === 'reserved') counts.reserved = n;
      else counts.deprecated += n;
    }
    return counts;
  }
}
