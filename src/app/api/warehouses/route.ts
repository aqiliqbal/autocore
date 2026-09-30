import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const warehouses = await prisma.warehouseLocation.findMany({
      include: {
        _count: {
          select: {
            inventory: true,
            stockTransactions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(warehouses);
  } catch (error) {
    console.error("Failed to fetch warehouses:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch warehouses.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      code,
      name,
      zone,
      description,
    } = body;

    if (
      typeof code !== "string" ||
      !code.trim()
    ) {
      return NextResponse.json(
        {
          error: "Warehouse code is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      return NextResponse.json(
        {
          error: "Warehouse name is required.",
        },
        {
          status: 400,
        }
      );
    }

    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();

    const cleanZone =
      typeof zone === "string" &&
      zone.trim()
        ? zone.trim()
        : null;

    const cleanDescription =
      typeof description === "string" &&
      description.trim()
        ? description.trim()
        : null;

    const existing =
      await prisma.warehouseLocation.findUnique({
        where: {
          code: cleanCode,
        },
      });

    if (existing) {
      return NextResponse.json(
        {
          error:
            "A warehouse with this code already exists.",
        },
        {
          status: 409,
        }
      );
    }

    const warehouse =
      await prisma.warehouseLocation.create({
        data: {
          code: cleanCode,
          name: cleanName,
          zone: cleanZone,
          description: cleanDescription,
          isActive: true,
        },
        include: {
          _count: {
            select: {
              inventory: true,
              stockTransactions: true,
            },
          },
        },
      });

    return NextResponse.json(
      warehouse,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Failed to create warehouse:",
      error
    );

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error:
            "A warehouse with this code already exists.",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create warehouse.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const {
      id,
      code,
      name,
      zone,
      description,
      isActive,
    } = body;

    if (
      typeof id !== "string" ||
      !id.trim()
    ) {
      return NextResponse.json(
        {
          error: "Warehouse ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const existing =
      await prisma.warehouseLocation.findUnique({
        where: {
          id,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          error: "Warehouse not found.",
        },
        {
          status: 404,
        }
      );
    }

    const data: {
      code?: string;
      name?: string;
      zone?: string | null;
      description?: string | null;
      isActive?: boolean;
    } = {};

    if (typeof code === "string") {
      const cleanCode =
        code.trim().toUpperCase();

      if (!cleanCode) {
        return NextResponse.json(
          {
            error:
              "Warehouse code cannot be empty.",
          },
          {
            status: 400,
          }
        );
      }

      data.code = cleanCode;
    }

    if (typeof name === "string") {
      const cleanName = name.trim();

      if (!cleanName) {
        return NextResponse.json(
          {
            error:
              "Warehouse name cannot be empty.",
          },
          {
            status: 400,
          }
        );
      }

      data.name = cleanName;
    }

    if (typeof zone === "string") {
      data.zone =
        zone.trim() || null;
    }

    if (zone === null) {
      data.zone = null;
    }

    if (typeof description === "string") {
      data.description =
        description.trim() || null;
    }

    if (description === null) {
      data.description = null;
    }

    if (typeof isActive === "boolean") {
      data.isActive = isActive;
    }

    const warehouse =
      await prisma.warehouseLocation.update({
        where: {
          id,
        },
        data,
        include: {
          _count: {
            select: {
              inventory: true,
              stockTransactions: true,
            },
          },
        },
      });

    return NextResponse.json(
      warehouse
    );
  } catch (error) {
    console.error(
      "Failed to update warehouse:",
      error
    );

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error:
            "A warehouse with this code already exists.",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update warehouse.",
      },
      {
        status: 500,
      }
    );
  }
}