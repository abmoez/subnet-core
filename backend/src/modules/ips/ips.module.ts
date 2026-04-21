import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ip } from './entities/ip.entity';
import { IpsRepository } from './ips.repository';
import { IpsService } from './ips.service';
import { IpsController } from './ips.controller';
import { SubnetsModule } from '../subnets/subnets.module';

@Module({
  imports: [TypeOrmModule.forFeature([Ip]), forwardRef(() => SubnetsModule)],
  controllers: [IpsController],
  providers: [IpsService, IpsRepository],
  exports: [IpsService, IpsRepository],
})
export class IpsModule {}
