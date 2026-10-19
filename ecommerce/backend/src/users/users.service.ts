import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany();
    return users.map(({ passwordHash: _, ...user }) => user);
  }

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    const { passwordHash: _, ...result } = user;
    return result;
  }

  async update(id: number, data: any) {
    const user = await this.prisma.user.update({
      where: { id },
      data,
    });
    const { passwordHash: _, ...result } = user;
    return result;
  }

  async remove(id: number) {
    await this.prisma.user.delete({ where: { id } });
  }
}