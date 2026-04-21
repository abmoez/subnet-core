import { IsString, IsOptional, IsNotEmpty, IsIP, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateIpDto {
  @ApiProperty({ example: '192.168.1.10', description: 'Valid IP address within the subnet range' })
  @IsString()
  @IsIP(4, { message: 'address must be a valid IPv4 address' })
  address: string;

  @ApiProperty({ example: 'Web Server' })
  @IsString()
  @IsNotEmpty({ message: 'name is required' })
  name: string;

  @ApiPropertyOptional({ example: 'Primary web server for the office' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'active', enum: ['active', 'reserved', 'deprecated'] })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'reserved', 'deprecated'])
  status?: string;
}
