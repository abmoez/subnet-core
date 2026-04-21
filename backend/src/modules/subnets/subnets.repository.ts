import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsOrder } from 'typeorm';
import { Subnet } from './entities/subnet.entity';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';

const SORTABLE_COLUMNS = new Set(['name', 'cidr', 'totalIps', 'createdAt', 'updatedAt']);

@Injectable()
export class SubnetsRepository {
  constructor(
    @InjectRepository(Subnet)
    private readonly repository: Repository<Subnet>,
  ) {}

  async findAllByUser(
    userId: string,
    skip: number,
    take: number,
    sortBy?: string,
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ): Promise<PaginatedResult<Subnet>> {
    const order: FindOptionsOrder<Subnet> =
      sortBy && SORTABLE_COLUMNS.has(sortBy) ? { [sortBy]: sortOrder } : { createdAt: 'DESC' };

    const [data, total] = await this.repository.findAndCount({
      where: { createdById: userId },
      order,
      skip,
      take,
    });
    return { data, total };
  }

  async findByIdAndUser(id: string, userId: string): Promise<Subnet | null> {
    return this.repository.findOne({
      where: { id, createdById: userId },
    });
  }

  async findById(id: string): Promise<Subnet | null> {
    return this.repository.findOne({ where: { id } });
  }

  async create(subnetData: Partial<Subnet>): Promise<Subnet> {
    const subnet = this.repository.create(subnetData);
    return this.repository.save(subnet);
  }

  async update(id: string, data: Partial<Subnet>): Promise<Subnet | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async existsByCidrAndUser(cidr: string, userId: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { cidr, createdById: userId },
    });
    return count > 0;
  }
}
