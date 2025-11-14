import { Injectable } from '@nestjs/common';
import { CreateAdminMessageDto } from './dto/create-admin-message.dto';
import { UpdateAdminMessageDto } from './dto/update-admin-message.dto';

@Injectable()
export class AdminMessageService {
  create(createAdminMessageDto: CreateAdminMessageDto) {
    return 'This action adds a new adminMessage';
  }

  findAll() {
    return `This action returns all adminMessage`;
  }

  findOne(id: number) {
    return `This action returns a #${id} adminMessage`;
  }

  update(id: number, updateAdminMessageDto: UpdateAdminMessageDto) {
    return `This action updates a #${id} adminMessage`;
  }

  remove(id: number) {
    return `This action removes a #${id} adminMessage`;
  }
}
