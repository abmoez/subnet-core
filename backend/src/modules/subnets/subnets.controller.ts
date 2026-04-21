import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { SubnetsService } from './subnets.service';
import { CreateSubnetDto } from './dto/create-subnet.dto';
import { UpdateSubnetDto } from './dto/update-subnet.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('subnets')
@Controller('subnets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SubnetsController {
  constructor(private readonly subnetsService: SubnetsService) {}

  @Get()
  @ApiOperation({ summary: 'List all subnets (paginated)' })
  async findAll(@CurrentUser() user: User, @Query() pagination: PaginationDto) {
    return this.subnetsService.findAll(user.id, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a subnet by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.subnetsService.findOne(id, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new subnet' })
  async create(@Body() dto: CreateSubnetDto, @CurrentUser() user: User) {
    return this.subnetsService.create(dto, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a subnet' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubnetDto,
    @CurrentUser() user: User,
  ) {
    return this.subnetsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a subnet' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    await this.subnetsService.remove(id, user.id);
    return { message: 'Subnet deleted successfully' };
  }
}
