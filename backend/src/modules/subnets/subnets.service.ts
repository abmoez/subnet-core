import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
  forwardRef,
} from '@nestjs/common';
import IPCIDR from 'ip-cidr';
import { SubnetsRepository } from './subnets.repository';
import { IpsRepository } from '../ips/ips.repository';
import { CreateSubnetDto } from './dto/create-subnet.dto';
import { UpdateSubnetDto } from './dto/update-subnet.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { Subnet } from './entities/subnet.entity';
import { getReservedIps } from '../../common/utils/networking';

@Injectable()
export class SubnetsService {
  private readonly logger = new Logger(SubnetsService.name);

  constructor(
    private readonly subnetsRepository: SubnetsRepository,
    @Inject(forwardRef(() => IpsRepository))
    private readonly ipsRepository: IpsRepository,
  ) {}

  async findAll(userId: string, pagination: PaginationDto): Promise<PaginatedResponseDto<Subnet>> {
    const { data, total } = await this.subnetsRepository.findAllByUser(
      userId,
      pagination.skip,
      pagination.limit,
      pagination.sortBy,
      pagination.sortOrder,
    );
    return new PaginatedResponseDto(data, total, pagination.page, pagination.limit);
  }

  async findOne(id: string, userId: string): Promise<Subnet> {
    const subnet = await this.subnetsRepository.findByIdAndUser(id, userId);
    if (!subnet) {
      throw new NotFoundException('Subnet not found');
    }
    return subnet;
  }

  async create(dto: CreateSubnetDto, userId: string): Promise<Subnet> {
    if (!IPCIDR.isValidCIDR(dto.cidr)) {
      throw new BadRequestException('Invalid CIDR notation');
    }

    const exists = await this.subnetsRepository.existsByCidrAndUser(dto.cidr, userId);
    if (exists) {
      throw new ConflictException('Subnet with this CIDR already exists');
    }

    const subnet = await this.subnetsRepository.create({
      cidr: dto.cidr,
      name: dto.name,
      description: dto.description,
      totalIps: 0,
      createdById: userId,
    });

    await this.reserveInfrastructureIps(subnet.id, dto.cidr, userId);

    return subnet;
  }

  async update(id: string, dto: UpdateSubnetDto, userId: string): Promise<Subnet> {
    const subnet = await this.findOne(id, userId);

    if (dto.cidr && dto.cidr !== subnet.cidr) {
      if (!IPCIDR.isValidCIDR(dto.cidr)) {
        throw new BadRequestException('Invalid CIDR notation');
      }
    }

    const updated = await this.subnetsRepository.update(id, { ...dto, updatedById: userId });
    if (!updated) {
      throw new NotFoundException('Subnet not found');
    }
    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    const subnet = await this.findOne(id, userId);
    await this.subnetsRepository.delete(subnet.id);
  }

  private async reserveInfrastructureIps(
    subnetId: string,
    cidr: string,
    userId: string,
  ): Promise<void> {
    const reserved = getReservedIps(cidr);

    for (const entry of reserved) {
      await this.ipsRepository.create({
        address: entry.address,
        name: entry.name,
        description: entry.description,
        status: 'reserved',
        subnetId,
        createdById: userId,
      });
    }

    if (reserved.length > 0) {
      await this.subnetsRepository.update(subnetId, { totalIps: reserved.length });
      this.logger.log(`Auto-reserved ${reserved.length} infrastructure IPs for subnet ${cidr}`);
    }
  }
}
