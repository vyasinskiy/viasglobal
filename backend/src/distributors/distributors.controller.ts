import { Controller, Post, Body } from '@nestjs/common';
import { DistributorsService } from './distributors.service';

@Controller('distributors')
export class DistributorsController {
  constructor(private readonly distributorsService: DistributorsService) {}

  @Post()
  async create(@Body() body: any) {
    return this.distributorsService.create(body);
  }
}
