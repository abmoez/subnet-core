import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class IpQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by subnet ID' })
  @IsOptional()
  @IsString()
  subnetId?: string;
}
