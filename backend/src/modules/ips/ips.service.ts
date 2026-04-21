import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import IPCIDR from 'ip-cidr';
import { IpsRepository } from './ips.repository';
import { SubnetsRepository } from '../subnets/subnets.repository';
import { CreateIpDto } from './dto/create-ip.dto';
import { UpdateIpDto } from './dto/update-ip.dto';
import { IpQueryDto } from './dto/ip-query.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { Ip } from './entities/ip.entity';

@Injectable()
export class IpsService {
  constructor(
    private readonly ipsRepository: IpsRepository,
    private readonly subnetsRepository: SubnetsRepository,
  ) {}

  async findAll(query: IpQueryDto): Promise<PaginatedResponseDto<Ip>> {
    const { subnetId, skip, limit, page, sortBy, sortOrder } = query;

    const result = subnetId
      ? await this.ipsRepository.findBySubnet(subnetId, skip, limit, sortBy, sortOrder)
      : await this.ipsRepository.findAll(skip, limit, sortBy, sortOrder);

    return new PaginatedResponseDto(result.data, result.total, page, limit);
  }

  async findOne(id: string): Promise<Ip> {
    const ip = await this.ipsRepository.findById(id);
    if (!ip) {
      throw new NotFoundException('IP not found');
    }
    return ip;
  }

  async create(subnetId: string, dto: CreateIpDto, userId: string): Promise<Ip> {
    const subnet = await this.subnetsRepository.findByIdAndUser(subnetId, userId);
    if (!subnet) {
      throw new NotFoundException('Subnet not found');
    }

    this.validateIpInCidr(dto.address, subnet.cidr);

    const existing = await this.ipsRepository.findByAddressAndSubnet(dto.address, subnetId);
    if (existing) {
      throw new ConflictException(`IP address ${dto.address} already exists in this subnet`);
    }

    const ip = await this.ipsRepository.create({
      address: dto.address,
      name: dto.name,
      description: dto.description,
      status: dto.status || 'active',
      subnetId,
      createdById: userId,
    });

    await this.updateSubnetIpCount(subnetId);

    return ip;
  }

  async update(id: string, subnetId: string, dto: UpdateIpDto, userId: string): Promise<Ip> {
    const subnet = await this.subnetsRepository.findByIdAndUser(subnetId, userId);
    if (!subnet) {
      throw new NotFoundException('Subnet not found');
    }

    const ip = await this.ipsRepository.findByIdAndSubnet(id, subnetId);
    if (!ip) {
      throw new NotFoundException('IP not found in this subnet');
    }

    const updated = await this.ipsRepository.update(id, { ...dto, updatedById: userId });
    if (!updated) {
      throw new NotFoundException('IP not found');
    }
    return updated;
  }

  async remove(id: string, subnetId: string, userId: string): Promise<void> {
    const subnet = await this.subnetsRepository.findByIdAndUser(subnetId, userId);
    if (!subnet) {
      throw new NotFoundException('Subnet not found');
    }

    const ip = await this.ipsRepository.findByIdAndSubnet(id, subnetId);
    if (!ip) {
      throw new NotFoundException('IP not found in this subnet');
    }

    await this.ipsRepository.delete(id);
    await this.updateSubnetIpCount(subnetId);
  }

  async getStatusCounts(subnetId?: string): Promise<{
    active: number;
    reserved: number;
    deprecated: number;
    total: number;
  }> {
    return this.ipsRepository.getStatusCounts(subnetId);
  }

  private validateIpInCidr(address: string, cidr: string): void {
    const cidrObj = new IPCIDR(cidr);
    if (!cidrObj.contains(address)) {
      throw new BadRequestException(`IP address ${address} is not within the subnet range ${cidr}`);
    }
  }

  private async updateSubnetIpCount(subnetId: string): Promise<void> {
    const count = await this.ipsRepository.countBySubnetId(subnetId);
    await this.subnetsRepository.update(subnetId, { totalIps: count });
  }
}
