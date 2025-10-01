import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { CreateMembershipDTO } from './dto/create-membership.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorator/role.decorator';
import { AccountRole } from '@prisma/client';
import { UpdateMembershipDTO } from './dto/update-membership.dto';

@Controller('api/memberships')
@UseGuards(JwtAuthGuard)
@ApiTags('Memberships')
@ApiBearerAuth('jwt-auth')
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}


  @Get('/')
  async getAllMemberships() {
    const data = await this.membershipService.getAllMemberships();
    return {
      message: 'Memberships retrieved successfully',
      data,
    };
  }

  @Get('/:id')
  @ApiParam({ name: 'id', required: true, description: 'Membership ID' })
  async getMembershipById(@Param('id') id: string) {
    const data = await this.membershipService.getMembershipById(id);
    return {
      message: 'Membership retrieved successfully',
      data,
    };
  }

  @Roles(AccountRole.ADMIN)
  @Post('/')
  async createMembership(@Body() createMembershipDto: CreateMembershipDTO) {
    const data = await this.membershipService.createMembership(createMembershipDto);
    return {
      message: 'Membership created successfully',
      data,
    };
  }

  @Roles(AccountRole.ADMIN)
  @Patch('/:id')
  @ApiParam({ name: 'id', required: true, description: 'Membership ID' })
  async updateMembership(@Body() body: UpdateMembershipDTO, @Param('id') id: string) {
    const data = await this.membershipService.updateMembership(id, body);
    return {
      message: 'Membership updated successfully',
      data,
    };
  }

  @Roles(AccountRole.ADMIN)
  @Delete('/:id')
  @ApiParam({ name: 'id', required: true, description: 'Membership ID' })
  async deleteMembership(@Param('id') id: string) {
    await this.membershipService.deleteMembership(id);
    return {
      message: 'Membership deleted successfully',
    };
  }

}
