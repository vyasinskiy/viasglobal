import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DistributorsService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; website?: string; brandName?: string; isPrivateLabel?: boolean }) {
    const distributor = await this.prisma.distributor.upsert({
      where: { name: data.name },
      update: { website: data.website },
      create: { name: data.name, website: data.website },
    });
    
    if (data.brandName) {
      await this.prisma.brand.upsert({
        where: { name: data.brandName },
        update: {},
        create: { name: data.brandName }
      });
    }

    return distributor;
  }
}
