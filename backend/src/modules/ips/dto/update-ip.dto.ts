import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateIpDto } from './create-ip.dto';

export class UpdateIpDto extends PartialType(OmitType(CreateIpDto, ['address'])) {}
