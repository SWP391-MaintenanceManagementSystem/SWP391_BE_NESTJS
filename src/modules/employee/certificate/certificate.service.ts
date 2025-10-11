import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateCertificateDTO } from './dto/create-certificate.dto';
import { UpdateCertificateDTO } from './dto/update-certificate.dto';
import { CertificateDTO } from './dto/certificate.dto';
import { EmployeeCertificate } from '@prisma/client';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class CertificateService {
  constructor(private prisma: PrismaService) {}

  async createCertificate(
  employeeId: string,
  createCertificateDto: CreateCertificateDTO
): Promise<EmployeeCertificate> {
  const certificate = await this.prisma.employeeCertificate.create({
    data: {
      employeeId,
      name: createCertificateDto.name,
      issuedAt: new Date(createCertificateDto.issuedAt),
      expiresAt: new Date(createCertificateDto.expiresAt),
    },
  });

  return plainToInstance(CertificateDTO, certificate);
}

  async getCertificateByEmployeeId(employeeId: string): Promise<CertificateDTO[] | null> {
    const certificates = await this.prisma.employeeCertificate.findMany({
      where: { employeeId },
      orderBy: { issuedAt: 'desc' },
    });
    if (!certificates || certificates.length === 0) {
      throw new NotFoundException(`No certificates found for employeeId ${employeeId}`);
    }
    return certificates.map((cert: EmployeeCertificate) => plainToInstance(CertificateDTO, cert));
  }

  async getCertificateById(id: string): Promise<CertificateDTO | null> {
    const certificate = await this.prisma.employeeCertificate.findUnique({
      where: { id },
    });
    if (!certificate) {
      throw new NotFoundException(`Certificate with id ${id} not found`);
    }
    return plainToInstance(CertificateDTO, certificate);
  }

  async updateCertificate(
    id: string,
    updateCertificateDto: UpdateCertificateDTO
  ): Promise<CertificateDTO> {
    const existingCertificate = await this.prisma.employeeCertificate.findUnique({
      where: { id },
    });
    if (!existingCertificate) {
      throw new NotFoundException(`Certificate with id ${id} not found`);
    }
    const updatedCertificate = await this.prisma.employeeCertificate.update({
      where: { id },
      data: updateCertificateDto,
    });
    if (updateCertificateDto.issuedAt && updateCertificateDto.expiresAt) {
      if (updateCertificateDto.issuedAt >= updateCertificateDto.expiresAt) {
        throw new Error('issuedAt must be before expiresAt');
      }
      if (new Date(updateCertificateDto.expiresAt) <= new Date()) {
        throw new Error('expiresAt must be a future date');
      } else {
        updateCertificateDto.expiresAt = new Date(updateCertificateDto.expiresAt);
        updateCertificateDto.issuedAt = new Date(updateCertificateDto.issuedAt);
      }
    }
    return plainToInstance(CertificateDTO, updatedCertificate);
  }

  async deleteCertificate(id: string): Promise<void> {
    const existingCertificate = await this.prisma.employeeCertificate.findUnique({
      where: { id },
    });
    if (!existingCertificate) {
      throw new NotFoundException(`Certificate with id ${id} not found`);
    }
    await this.prisma.employeeCertificate.delete({
      where: { id },
    });
  }
}
