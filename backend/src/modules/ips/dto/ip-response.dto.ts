import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class IpResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description: string | null;

  @ApiProperty()
  status: string;

  @ApiProperty()
  subnetId: string;

  @ApiProperty()
  createdById: string;

  @ApiPropertyOptional()
  updatedById: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
