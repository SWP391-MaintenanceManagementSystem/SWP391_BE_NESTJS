import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Tạo admin account

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
    ],
  });

  console.log({ electricCarBrands, vehicleModels });


  const createTechnician = await prisma.account.createMany({
    data: [
      {
        email: 'tech1@gmail.com',
        password: 'Password123!',
        role: 'TECHNICIAN',
        phone: '0912345678',
        status: 'VERIFIED',
      },
      {
        email: 'tech2@gmail.com',
        password: 'Password123!',
        role: 'TECHNICIAN',
        phone: '0912345678',
        status: 'VERIFIED',
      },
      {
        email: 'tech3@gmail.com',
        password: 'Password123!',
        role: 'TECHNICIAN',
        phone: '0912345678',
        status: 'VERIFIED',
      },
    ]
  })
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
