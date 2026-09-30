import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const engines = await prisma.engine.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(engines);
  } catch (error) {
    console.error("Failed to fetch engines:", error);

    return NextResponse.json(
      { error: "Failed to fetch engines" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      engineCode,
      manufacturer,
      name,
      engineFamily,
      displacement,
      cylinders,
      fuelType,
      aspiration,
      horsepower,
      torqueNm,
      imageUrl,
      notes,
    } = body;

    if (!engineCode?.trim()) {
      return NextResponse.json(
        { error: "Engine code is required." },
        { status: 400 }
      );
    }

    if (!manufacturer?.trim()) {
      return NextResponse.json(
        { error: "Manufacturer is required." },
        { status: 400 }
      );
    }

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Engine name is required." },
        { status: 400 }
      );
    }

    const existingEngine = await prisma.engine.findUnique({
      where: {
        engineCode: engineCode.trim(),
      },
    });

    if (existingEngine) {
      return NextResponse.json(
        {
          error:
            "An engine with this engine code already exists.",
        },
        { status: 409 }
      );
    }

    const engine = await prisma.engine.create({
      data: {
        engineCode: engineCode.trim(),
        manufacturer: manufacturer.trim(),
        name: name.trim(),
        engineFamily: engineFamily?.trim() || null,

        displacement:
          displacement !== undefined && displacement !== ""
            ? Number(displacement)
            : null,

        cylinders:
          cylinders !== undefined && cylinders !== ""
            ? Number(cylinders)
            : null,

        fuelType: fuelType || null,

        aspiration: aspiration?.trim() || null,

        horsepower:
          horsepower !== undefined && horsepower !== ""
            ? Number(horsepower)
            : null,

        torqueNm:
          torqueNm !== undefined && torqueNm !== ""
            ? Number(torqueNm)
            : null,

        imageUrl: imageUrl?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json(engine, {
      status: 201,
    });
  } catch (error) {
    console.error("Failed to create engine:", error);

    return NextResponse.json(
      {
        error: "Failed to create engine.",
      },
      { status: 500 }
    );
  }
}