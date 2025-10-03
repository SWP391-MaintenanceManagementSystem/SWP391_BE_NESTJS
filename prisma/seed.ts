import { AccountStatus, PrismaClient } from '@prisma/client';
import { hashPassword } from 'src/utils';

const prisma = new PrismaClient();

async function main() {
  // Tạo admin account
  // await prisma.account.upsert({
  //   where: { email: 'admin@gmail.com' },
  //   update: {},
  //   create: {
  //     email: 'admin@gmail.com',
  //     password: await hashPassword('Password123!'),
  //     role: 'ADMIN',
  //     status: AccountStatus.VERIFIED,
  //     phone: '1234567890',
  //   },
  // });

  const electricCarBrands = await prisma.brand.createMany({
    data: [
      {
        id: 1,
        name: 'Tesla',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        name: 'Vinfast',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        name: 'BMW',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  });

  const vehicleModels = await prisma.vehicleModel.createMany({
    data: [
      {
        id: 1,
        brandId: 1,
        name: 'Model S',
        productionYear: 2022,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        brandId: 1,
        name: 'Model 3',
        productionYear: 2021,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        brandId: 2,
        name: 'VF e34',
        productionYear: 2021,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 4,
        brandId: 2,
        name: 'VF 8',
        productionYear: 2022,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 5,
        brandId: 3,
        name: 'iX',
        productionYear: 2023,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  });

  console.log({ electricCarBrands, vehicleModels });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async e => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
