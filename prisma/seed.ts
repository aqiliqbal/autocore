import "dotenv/config";

import {
  PrismaClient,
  FuelType,
  TransmissionType,
  PartStatus,
} from "../src/generated/prisma/client";

import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in .env");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("Starting AutoCore database seed...");

  // --------------------------------------------------
  // CATEGORIES
  // --------------------------------------------------

  const engineCategory = await prisma.category.upsert({
    where: { name: "Engine Components" },
    update: {},
    create: {
      name: "Engine Components",
      description: "Parts used in vehicle engines and engine systems.",
    },
  });

  const brakingCategory = await prisma.category.upsert({
    where: { name: "Braking System" },
    update: {},
    create: {
      name: "Braking System",
      description: "Brake discs, pads, calipers and related components.",
    },
  });

  const coolingCategory = await prisma.category.upsert({
    where: { name: "Cooling System" },
    update: {},
    create: {
      name: "Cooling System",
      description: "Radiators, cooling components and related parts.",
    },
  });

  const electricalCategory = await prisma.category.upsert({
    where: { name: "Electrical" },
    update: {},
    create: {
      name: "Electrical",
      description: "Ignition, sensors and electrical components.",
    },
  });

  const transmissionCategory = await prisma.category.upsert({
    where: { name: "Transmission & Clutch" },
    update: {},
    create: {
      name: "Transmission & Clutch",
      description: "Clutch and transmission-related components.",
    },
  });

  const suspensionCategory = await prisma.category.upsert({
    where: { name: "Suspension" },
    update: {},
    create: {
      name: "Suspension",
      description: "Suspension components and related parts.",
    },
  });

  // --------------------------------------------------
  // VEHICLES
  // --------------------------------------------------

  const bmwM3 = await prisma.vehicle.create({
    data: {
      make: "BMW",
      model: "M3",
      variant: "G80 Competition",
      yearFrom: 2021,
      yearTo: 2026,
      bodyType: "Sedan",
      fuelType: FuelType.PETROL,
      transmission: TransmissionType.AUTOMATIC,
      notes: "High-performance BMW M vehicle.",
    },
  });

  const toyotaCorolla = await prisma.vehicle.create({
    data: {
      make: "Toyota",
      model: "Corolla",
      variant: "Altis 1.6",
      yearFrom: 2019,
      yearTo: 2026,
      bodyType: "Sedan",
      fuelType: FuelType.PETROL,
      transmission: TransmissionType.CVT,
    },
  });

  const hondaCivic = await prisma.vehicle.create({
    data: {
      make: "Honda",
      model: "Civic",
      variant: "1.8 i-VTEC",
      yearFrom: 2016,
      yearTo: 2021,
      bodyType: "Sedan",
      fuelType: FuelType.PETROL,
      transmission: TransmissionType.CVT,
    },
  });

  const mustang = await prisma.vehicle.create({
    data: {
      make: "Ford",
      model: "Mustang",
      variant: "GT",
      yearFrom: 2020,
      yearTo: 2026,
      bodyType: "Coupe",
      fuelType: FuelType.PETROL,
      transmission: TransmissionType.MANUAL,
    },
  });

  const golf = await prisma.vehicle.create({
    data: {
      make: "Volkswagen",
      model: "Golf",
      variant: "GTI",
      yearFrom: 2020,
      yearTo: 2026,
      bodyType: "Hatchback",
      fuelType: FuelType.PETROL,
      transmission: TransmissionType.DCT,
    },
  });

  const mercedesC = await prisma.vehicle.create({
    data: {
      make: "Mercedes-Benz",
      model: "C-Class",
      variant: "C300",
      yearFrom: 2022,
      yearTo: 2026,
      bodyType: "Sedan",
      fuelType: FuelType.PETROL,
      transmission: TransmissionType.AUTOMATIC,
    },
  });

  // --------------------------------------------------
  // ENGINES
  // --------------------------------------------------

  const s58 = await prisma.engine.create({
    data: {
      engineCode: "S58",
      manufacturer: "BMW",
      name: "BMW S58 Twin-Turbo",
      engineFamily: "S58",
      displacement: 3.0,
      cylinders: 6,
      fuelType: FuelType.PETROL,
      aspiration: "Twin Turbo",
      horsepower: 503,
      torqueNm: 650,
    },
  });

  const twoZR = await prisma.engine.create({
    data: {
      engineCode: "2ZR-FE",
      manufacturer: "Toyota",
      name: "Toyota 2ZR-FE",
      engineFamily: "ZR",
      displacement: 1.8,
      cylinders: 4,
      fuelType: FuelType.PETROL,
      aspiration: "Naturally Aspirated",
      horsepower: 138,
      torqueNm: 173,
    },
  });

  const k20 = await prisma.engine.create({
    data: {
      engineCode: "K20C2",
      manufacturer: "Honda",
      name: "Honda K20C2",
      engineFamily: "K-Series",
      displacement: 2.0,
      cylinders: 4,
      fuelType: FuelType.PETROL,
      aspiration: "Naturally Aspirated",
      horsepower: 158,
      torqueNm: 187,
    },
  });

  const coyote = await prisma.engine.create({
    data: {
      engineCode: "5.0-Coyote",
      manufacturer: "Ford",
      name: "Ford 5.0 Coyote V8",
      engineFamily: "Coyote",
      displacement: 5.0,
      cylinders: 8,
      fuelType: FuelType.PETROL,
      aspiration: "Naturally Aspirated",
      horsepower: 480,
      torqueNm: 567,
    },
  });

  const ea888 = await prisma.engine.create({
    data: {
      engineCode: "EA888-G4",
      manufacturer: "Volkswagen",
      name: "VW EA888 Gen 4",
      engineFamily: "EA888",
      displacement: 2.0,
      cylinders: 4,
      fuelType: FuelType.PETROL,
      aspiration: "Turbo",
      horsepower: 241,
      torqueNm: 370,
    },
  });

  const m254 = await prisma.engine.create({
    data: {
      engineCode: "M254",
      manufacturer: "Mercedes-Benz",
      name: "Mercedes M254",
      engineFamily: "M254",
      displacement: 2.0,
      cylinders: 4,
      fuelType: FuelType.PETROL,
      aspiration: "Turbo",
      horsepower: 255,
      torqueNm: 400,
    },
  });

  // --------------------------------------------------
  // VEHICLE ↔ ENGINE COMPATIBILITY
  // --------------------------------------------------

  await prisma.vehicleEngine.createMany({
    data: [
      {
        vehicleId: bmwM3.id,
        engineId: s58.id,
      },
      {
        vehicleId: toyotaCorolla.id,
        engineId: twoZR.id,
      },
      {
        vehicleId: hondaCivic.id,
        engineId: k20.id,
      },
      {
        vehicleId: mustang.id,
        engineId: coyote.id,
      },
      {
        vehicleId: golf.id,
        engineId: ea888.id,
      },
      {
        vehicleId: mercedesC.id,
        engineId: m254.id,
      },
    ],
  });

  // --------------------------------------------------
  // PARTS
  // --------------------------------------------------

  const turbo = await prisma.part.create({
    data: {
      partNumber: "TC-BMW-S58-01",
      oemNumber: "11657853890",
      name: "S58 Twin Turbocharger Assembly",
      description: "High-performance twin turbocharger assembly.",
      manufacturer: "BMW",
      categoryId: engineCategory.id,
      costPrice: 2850,
      sellingPrice: 3499,
      minimumStock: 2,
      reorderQuantity: 4,
      status: PartStatus.ACTIVE,
    },
  });

  const ignitionCoil = await prisma.part.create({
    data: {
      partNumber: "IC-HON-K20-04",
      name: "K20 Ignition Coil",
      description: "OEM-style ignition coil for Honda K20 engines.",
      manufacturer: "Honda",
      categoryId: electricalCategory.id,
      costPrice: 48,
      sellingPrice: 69,
      minimumStock: 10,
      reorderQuantity: 25,
      status: PartStatus.ACTIVE,
    },
  });

  const clutch = await prisma.part.create({
    data: {
      partNumber: "CLK-VW-GTI-02",
      name: "Performance Clutch Kit",
      description: "Performance clutch kit for VW GTI applications.",
      manufacturer: "Sachs",
      categoryId: transmissionCategory.id,
      costPrice: 620,
      sellingPrice: 799,
      minimumStock: 4,
      reorderQuantity: 10,
      status: PartStatus.ACTIVE,
    },
  });

  const brakeDisc = await prisma.part.create({
    data: {
      partNumber: "BD-TOY-001",
      name: "Front Brake Disc",
      description: "Ventilated front brake disc.",
      manufacturer: "Toyota",
      categoryId: brakingCategory.id,
      costPrice: 85,
      sellingPrice: 119,
      minimumStock: 12,
      reorderQuantity: 30,
      status: PartStatus.ACTIVE,
    },
  });

  const radiator = await prisma.part.create({
    data: {
      partNumber: "RAD-FOR-008",
      name: "Performance Radiator Assembly",
      description: "Aluminium performance radiator assembly.",
      manufacturer: "Ford",
      categoryId: coolingCategory.id,
      costPrice: 410,
      sellingPrice: 549,
      minimumStock: 5,
      reorderQuantity: 12,
      status: PartStatus.ACTIVE,
    },
  });

  const airFilter = await prisma.part.create({
    data: {
      partNumber: "AF-TOY-204",
      name: "Engine Air Filter",
      description: "High-flow engine air filter.",
      manufacturer: "Toyota",
      categoryId: engineCategory.id,
      costPrice: 22,
      sellingPrice: 35,
      minimumStock: 20,
      reorderQuantity: 50,
      status: PartStatus.ACTIVE,
    },
  });

  const suspensionStrut = await prisma.part.create({
    data: {
      partNumber: "ST-BMW-F30-07",
      name: "Front Suspension Strut",
      description: "Front suspension strut assembly.",
      manufacturer: "Bilstein",
      categoryId: suspensionCategory.id,
      costPrice: 280,
      sellingPrice: 365,
      minimumStock: 6,
      reorderQuantity: 15,
      status: PartStatus.ACTIVE,
    },
  });

  // --------------------------------------------------
  // ENGINE ↔ PART COMPATIBILITY
  // --------------------------------------------------

  await prisma.enginePart.createMany({
    data: [
      {
        engineId: s58.id,
        partId: turbo.id,
        isPrimary: true,
      },
      {
        engineId: k20.id,
        partId: ignitionCoil.id,
        isPrimary: true,
      },
      {
        engineId: ea888.id,
        partId: clutch.id,
        isPrimary: true,
      },
      {
        engineId: twoZR.id,
        partId: brakeDisc.id,
      },
      {
        engineId: coyote.id,
        partId: radiator.id,
        isPrimary: true,
      },
      {
        engineId: twoZR.id,
        partId: airFilter.id,
        isPrimary: true,
      },
    ],
  });

  // --------------------------------------------------
  // VEHICLE ↔ PART COMPATIBILITY
  // --------------------------------------------------

  await prisma.vehiclePart.createMany({
    data: [
      {
        vehicleId: bmwM3.id,
        partId: turbo.id,
      },
      {
        vehicleId: hondaCivic.id,
        partId: ignitionCoil.id,
      },
      {
        vehicleId: golf.id,
        partId: clutch.id,
      },
      {
        vehicleId: toyotaCorolla.id,
        partId: brakeDisc.id,
      },
      {
        vehicleId: mustang.id,
        partId: radiator.id,
      },
      {
        vehicleId: toyotaCorolla.id,
        partId: airFilter.id,
      },
      {
        vehicleId: bmwM3.id,
        partId: suspensionStrut.id,
      },
    ],
  });

  // --------------------------------------------------
  // SUPPLIERS
  // --------------------------------------------------

  const autoTech = await prisma.supplier.create({
    data: {
      supplierCode: "SUP-001",
      name: "AutoTech Parts",
      contactName: "Usman Khan",
      email: "sales@autotech.example",
      phone: "+92 300 1111111",
      city: "Islamabad",
    },
  });

  const japanMotors = await prisma.supplier.create({
    data: {
      supplierCode: "SUP-002",
      name: "Japan Motors",
      contactName: "Hassan Ali",
      email: "info@japanmotors.example",
      phone: "+92 301 2222222",
      city: "Rawalpindi",
    },
  });

  const euroDrive = await prisma.supplier.create({
    data: {
      supplierCode: "SUP-003",
      name: "Euro Drive",
      contactName: "Ahmed Raza",
      email: "sales@eurodrive.example",
      phone: "+92 302 3333333",
      city: "Lahore",
    },
  });

  const brakePro = await prisma.supplier.create({
    data: {
      supplierCode: "SUP-004",
      name: "BrakePro",
      contactName: "Bilal Ahmed",
      email: "orders@brakepro.example",
      phone: "+92 303 4444444",
      city: "Karachi",
    },
  });

  const coolTech = await prisma.supplier.create({
    data: {
      supplierCode: "SUP-005",
      name: "CoolTech",
      contactName: "Hamza Malik",
      email: "sales@cooltech.example",
      phone: "+92 304 5555555",
      city: "Peshawar",
    },
  });

  // --------------------------------------------------
  // CUSTOMERS
  // --------------------------------------------------

  await prisma.customer.createMany({
    data: [
      {
        customerCode: "CUS-001",
        name: "Ali Motors",
        phone: "+92 300 5551001",
        city: "Islamabad",
      },
      {
        customerCode: "CUS-002",
        name: "Hassan Auto",
        phone: "+92 301 5551002",
        city: "Rawalpindi",
      },
      {
        customerCode: "CUS-003",
        name: "Raza Garage",
        phone: "+92 302 5551003",
        city: "Lahore",
      },
      {
        customerCode: "CUS-004",
        name: "City Motors",
        phone: "+92 303 5551004",
        city: "Peshawar",
      },
      {
        customerCode: "CUS-005",
        name: "Fast Auto",
        phone: "+92 304 5551005",
        city: "Karachi",
      },
    ],
  });

  // --------------------------------------------------
  // WAREHOUSE LOCATIONS
  // --------------------------------------------------

  const warehouseA = await prisma.warehouseLocation.create({
    data: {
      code: "WH-A01",
      name: "Main Parts Warehouse",
      zone: "A",
      description: "Primary automotive parts storage area.",
    },
  });

  const warehouseB = await prisma.warehouseLocation.create({
    data: {
      code: "WH-B01",
      name: "Engine Storage",
      zone: "B",
      description: "Storage area for engines and large components.",
    },
  });

  const warehouseC = await prisma.warehouseLocation.create({
    data: {
      code: "WH-C01",
      name: "Fast Moving Parts",
      zone: "C",
      description: "High-turnover parts and consumables.",
    },
  });

  // --------------------------------------------------
  // INVENTORY
  // --------------------------------------------------

  await prisma.inventory.createMany({
    data: [
      {
        partId: turbo.id,
        locationId: warehouseB.id,
        quantity: 3,
        reservedQuantity: 0,
      },
      {
        partId: ignitionCoil.id,
        locationId: warehouseC.id,
        quantity: 34,
        reservedQuantity: 2,
      },
      {
        partId: clutch.id,
        locationId: warehouseA.id,
        quantity: 8,
        reservedQuantity: 1,
      },
      {
        partId: brakeDisc.id,
        locationId: warehouseC.id,
        quantity: 7,
        reservedQuantity: 0,
      },
      {
        partId: radiator.id,
        locationId: warehouseA.id,
        quantity: 11,
        reservedQuantity: 1,
      },
      {
        partId: airFilter.id,
        locationId: warehouseC.id,
        quantity: 62,
        reservedQuantity: 4,
      },
      {
        partId: suspensionStrut.id,
        locationId: warehouseA.id,
        quantity: 5,
        reservedQuantity: 0,
      },
    ],
  });

  console.log("AutoCore database seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });