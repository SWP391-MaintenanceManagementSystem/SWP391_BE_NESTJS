import { Expose, Transform } from 'class-transformer';
import { CertificateDTO } from '../../certificate/dto/certificate.dto';
import { EmployeeDTO } from '../../dto/employee.dto';

export class StaffDTO extends EmployeeDTO { }