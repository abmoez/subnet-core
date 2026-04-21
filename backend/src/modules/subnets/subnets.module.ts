import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subnet } from './entities/subnet.entity';
import { SubnetsRepository } from './subnets.repository';
import { SubnetsService } from './subnets.service';
import { SubnetsController } from './subnets.controller';
import { IpsModule } from '../ips/ips.module';

@Module({
  imports: [TypeOrmModule.forFeature([Subnet]), forwardRef(() => IpsModule)],
  controllers: [SubnetsController],
  providers: [SubnetsService, SubnetsRepository],
  exports: [SubnetsService, SubnetsRepository],
})
export class SubnetsModule {}
