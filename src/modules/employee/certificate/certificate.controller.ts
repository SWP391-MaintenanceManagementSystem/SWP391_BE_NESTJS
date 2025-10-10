import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CertificateService } from './certificate.service';
import { CreateCertificateDTO } from './dto/create-certificate.dto';
import { UpdateCertificateDTO } from './dto/update-certificate.dto';
import { ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Roles } from 'src/common/decorator/role.decorator';
import { AccountRole } from '@prisma/client';

@ApiTags('Certificates')
@Controller('certificates')
@ApiBearerAuth('jwt-auth')
@Roles(AccountRole.ADMIN)
export class CertificateController {
  constructor(private readonly certificateService: CertificateService) {}

  @Post('/')
  @Roles(AccountRole.ADMIN)
  @ApiBody({ type: CreateCertificateDTO })
  async createCertificate(@Body() createCertificateDto: CreateCertificateDTO) {
    await this.certificateService.createCertificate(createCertificateDto);
    return { message: 'Certificate created successfully' };
  }

  @Get('/employee/:employeeId')
  @Roles(AccountRole.ADMIN)
  async getCertificatesByEmployeeId(@Param('employeeId') employeeId: string) {
    await this.certificateService.getCertificateByEmployeeId(employeeId);
    return { message: `Certificates for employeeId ${employeeId} retrieved successfully` };
  }

  @Get('/:id')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  async getCertificateById(@Param('id') id: string) {
    await this.certificateService.getCertificateById(id);
    return { message: `Certificate with id ${id} retrieved successfully` };
  }

  @Patch('/:id')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  @ApiBody({ type: UpdateCertificateDTO })
  async updateCertificate(
    @Param('id') id: string,
    @Body() updateCertificateDto: UpdateCertificateDTO
  ) {
    await this.certificateService.updateCertificate(id, updateCertificateDto);
    return { message: `Certificate updated successfully` };
  }

  @Delete('/:id')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  async deleteCertificate(@Param('id') id: string) {
    await this.certificateService.deleteCertificate(id);
    return { message: `Certificate deleted successfully` };
  }
}
