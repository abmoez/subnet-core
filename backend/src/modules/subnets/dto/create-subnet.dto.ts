import { IsString, IsOptional, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubnetDto {
  @ApiProperty({ example: '192.168.1.0/24', description: 'CIDR notation' })
  @IsString()
  @Matches(/^(\d{1,3}\.){3}\d{1,3}\/([0-9]|[1-2][0-9]|3[0-2])$/, {
    message: 'cidr must be a valid CIDR notation (e.g., 192.168.1.0/24)',
  })
  cidr: string;

  @ApiProperty({ example: 'Office Network' })
  @IsString()
  @IsNotEmpty({ message: 'name is required' })
  name: string;

  @ApiPropertyOptional({ example: 'Main office subnet' })
  @IsOptional()
  @IsString()
  description?: string;
}
