import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubnetResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  cidr: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  totalIps: number;

  @ApiProperty()
  createdById: string;

  @ApiPropertyOptional()
  updatedById: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
