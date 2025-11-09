import { Injectable, NotFoundException } from '@nestjs/common';
import { MembershipDTO } from './dto/membership.dto';
import { CreateMembershipDTO } from './dto/create-membership.dto';
import { PrismaService } from '../prisma/prisma.service';
import { plainToInstance } from 'class-transformer';
import { UpdateMembershipDTO } from './dto/update-membership.dto';
import { MembershipStatus } from '@prisma/client';

@Injectable()
export class MembershipService {
  constructor(private readonly prismaService: PrismaService) {}

  async createMembership(data: CreateMembershipDTO): Promise<MembershipDTO> {
    const membership = await this.prismaService.membership.create({
      data,
    });
    return plainToInstance(MembershipDTO, membership);
  }

  async getAllMemberships(): Promise<MembershipDTO[]> {
    const memberships = await this.prismaService.membership.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return memberships.map(membership => plainToInstance(MembershipDTO, membership));
  }

  async getActiveMemberships(): Promise<MembershipDTO[]> {
    const memberships = await this.prismaService.membership.findMany({
      where: { status: MembershipStatus.ACTIVE },
      orderBy: { createdAt: 'desc' },
    });
    return memberships.map(membership => plainToInstance(MembershipDTO, membership));
  }

  async updateMembership(id: string, data: UpdateMembershipDTO): Promise<MembershipDTO> {
    const membershipExisted = await this.getMembershipById(id);
    if (!membershipExisted) {
      throw new NotFoundException('Membership not found');
    }
    const membership = await this.prismaService.membership.update({
      where: { id },
      data,
    });
    return plainToInstance(MembershipDTO, membership);
  }

  async getMembershipById(id: string): Promise<MembershipDTO | null> {
    const membership = await this.prismaService.membership.findUnique({
      where: { id },
    });
    return plainToInstance(MembershipDTO, membership);
  }

  async deleteMembership(id: string): Promise<void> {
    const membershipExisted = await this.getMembershipById(id);
    if (!membershipExisted) {
      throw new Error('No active subscriptions found for this membership.');
    }
    if (membershipExisted.status === MembershipStatus.INACTIVE) {
      throw new Error('Cannot delete membership with INACTIVE subscriptions.');
    }
    await this.prismaService.membership.update({
      where: { id },
      data: { status: MembershipStatus.INACTIVE },
    });
  }
}
