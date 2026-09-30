import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        engines: {
          include: {
            engine: true,
          },
        },
        parts: true,
      },
    });

    return NextResponse.json(vehicles);
  } catch (error) {
    console.error("Failed to fetch vehicles:", error);

    return NextResponse.json(
      { error: "Failed to fetch vehicles" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      make,
      model,
      variant,
      yearFrom,
      yearTo,
      bodyType,
      fuelType,
      transmission,
      registrationNumber,
      vin,
      imageUrl,
      notes,
    } = body;

    if (!make || !model) {
      return NextResponse.json(
        {
          error: "Make and model are required.",
        },
        { status: 400 }
      );
    }

    if (registrationNumber) {
      const existingRegistration =
        await prisma.vehicle.findUnique({
          where: {
            registrationNumber,
          },
        });

      if (existingRegistration) {
        return NextResponse.json(
          {
            error:
              "A vehicle with this registration number already exists.",
          },
          { status: 409 }
        );
      }
    }

    if (vin) {
      const existingVin = await prisma.vehicle.findUnique({
        where: {
          vin,
        },
      });

      if (existingVin) {
        return NextResponse.json(
          {
            error: "A vehicle with this VIN already exists.",
          },
          { status: 409 }
        );
      }
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        make,
        model,
        variant: variant || null,
        yearFrom:
          yearFrom !== undefined && yearFrom !== ""
            ? Number(yearFrom)
            : null,
        yearTo:
          yearTo !== undefined && yearTo !== ""
            ? Number(yearTo)
            : null,
        bodyType: bodyType || null,
        fuelType: fuelType || null,
        transmission: transmission || null,
        registrationNumber:
          registrationNumber || null,
        vin: vin || null,
        imageUrl: imageUrl || null,
        notes: notes || null,
      },
      include: {
        engines: {
          include: {
            engine: true,
          },
        },
        parts: true,
      },
    });

    return NextResponse.json(vehicle, {
      status: 201,
    });
  } catch (error) {
    console.error("Failed to create vehicle:", error);

    return NextResponse.json(
      {
        error: "Failed to create vehicle.",
      },
      { status: 500 }
    );
  }
}