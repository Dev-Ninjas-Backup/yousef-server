import { Injectable } from '@nestjs/common';
import { CreateGarageManagementDto } from './dto/create-garage-management.dto';
import { UpdateGarageManagementDto } from './dto/update-garage-management.dto';

@Injectable()
export class GarageManagementService {
  create(createGarageManagementDto: CreateGarageManagementDto) {
    return 'This action adds a new garageManagement';
  }

  findAll() {
    return `This action returns all garageManagement`;
  }

  findOne(id: number) {
    return `This action returns a #${id} garageManagement`;
  }

  update(id: number, updateGarageManagementDto: UpdateGarageManagementDto) {
    return `This action updates a #${id} garageManagement`;
  }

  remove(id: number) {
    return `This action removes a #${id} garageManagement`;
  }
}
