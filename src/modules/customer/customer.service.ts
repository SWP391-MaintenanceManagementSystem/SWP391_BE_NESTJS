import { Injectable } from '@nestjs/common';
import { CreateCustomerDTO } from './dto/create-customer.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomerService {

    constructor(private readonly prismaService: PrismaService) { }

    async createCustomer(newCustomer: CreateCustomerDTO) {
        const customer = await this.prismaService.customer.create({
            data: newCustomer
        })
        return customer;
    }

    
}
