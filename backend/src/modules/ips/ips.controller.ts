import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { IpsService } from './ips.service';
import { CreateIpDto } from './dto/create-ip.dto';
import { UpdateIpDto } from './dto/update-ip.dto';
import { IpQueryDto } from './dto/ip-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('ips')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class IpsController {
  constructor(private readonly ipsService: IpsService) {}

  @Get('ips')
  @ApiOperation({ summary: 'List all IPs (paginated, optionally filtered by subnet)' })
  async findAll(@Query() query: IpQueryDto) {
    return this.ipsService.findAll(query);
  }

  @Get('ips/stats')
  @ApiOperation({ summary: 'Get IP status counts (active, reserved, deprecated)' })
  async getStats(@Query('subnetId') subnetId?: string) {
    return this.ipsService.getStatusCounts(subnetId);
  }

  @Get('ips/:id')
  @ApiOperation({ summary: 'Get an IP by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ipsService.findOne(id);
  }

  @Post('subnets/:subnetId/ips')
  @ApiOperation({ summary: 'Create an IP address within a subnet' })
  async create(
    @Param('subnetId', ParseUUIDPipe) subnetId: string,
    @Body() dto: CreateIpDto,
    @CurrentUser() user: User,
  ) {
    return this.ipsService.create(subnetId, dto, user.id);
  }

  @Put('subnets/:subnetId/ips/:id')
  @ApiOperation({ summary: 'Update an IP address within a subnet' })
  async update(
    @Param('subnetId', ParseUUIDPipe) subnetId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIpDto,
    @CurrentUser() user: User,
  ) {
    return this.ipsService.update(id, subnetId, dto, user.id);
  }

  @Delete('subnets/:subnetId/ips/:id')
  @ApiOperation({ summary: 'Delete an IP address from a subnet' })
  async remove(
    @Param('subnetId', ParseUUIDPipe) subnetId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    await this.ipsService.remove(id, subnetId, user.id);
    return { message: 'IP address deleted successfully' };
  }
}
