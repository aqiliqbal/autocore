import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const parts = await prisma.part.findMany({
      include: {
        category: true,

        inventory: {
          include: {
            location: true,
          },
        },

        vehicleCompatibility: {
          include: {
            vehicle: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(parts);
  } catch (error) {
    console.error("Failed to fetch parts:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch parts",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    /*
    =====================================================
    READ JSON REQUEST
    =====================================================

    The image is uploaded separately through:

    /api/upload/part-image

    That API returns an image URL.

    The Add Part page then sends that URL here
    together with the rest of the part information.
    */

    const body = await request.json();

    const {
      partNumber,
      oemNumber,
      barcode,
      name,
      description,
      manufacturer,
      categoryId,
      costPrice,
      sellingPrice,
      minimumStock,
      reorderQuantity,
      unit,
      weightKg,
      locationId,
      initialStock,
      imageUrl,
    } = body;

    /* =====================================================
       REQUIRED FIELDS
    ===================================================== */

    if (
      typeof partNumber !== "string" ||
      !partNumber.trim()
    ) {
      return NextResponse.json(
        {
          error: "Part number is required.",
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
          error: "Part name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      typeof categoryId !== "string" ||
      !categoryId.trim()
    ) {
      return NextResponse.json(
        {
          error: "Category is required.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       PRICE VALIDATION
    ===================================================== */

    if (
      costPrice === undefined ||
      costPrice === null ||
      costPrice === ""
    ) {
      return NextResponse.json(
        {
          error: "Cost price is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      sellingPrice === undefined ||
      sellingPrice === null ||
      sellingPrice === ""
    ) {
      return NextResponse.json(
        {
          error: "Selling price is required.",
        },
        {
          status: 400,
        }
      );
    }

    const parsedCostPrice = Number(costPrice);
    const parsedSellingPrice = Number(sellingPrice);

    if (
      !Number.isFinite(parsedCostPrice) ||
      parsedCostPrice < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Cost price must be a valid number greater than or equal to 0.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(parsedSellingPrice) ||
      parsedSellingPrice < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Selling price must be a valid number greater than or equal to 0.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       STOCK VALUES
    ===================================================== */

    const parsedMinimumStock = Number(
      minimumStock ?? 5
    );

    const parsedReorderQuantity = Number(
      reorderQuantity ?? 10
    );

    const parsedInitialStock = Number(
      initialStock ?? 0
    );

    if (
      !Number.isInteger(parsedMinimumStock) ||
      parsedMinimumStock < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Minimum stock must be a whole number greater than or equal to 0.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(parsedReorderQuantity) ||
      parsedReorderQuantity < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Reorder quantity must be a whole number greater than or equal to 0.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(parsedInitialStock) ||
      parsedInitialStock < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Initial stock must be a whole number greater than or equal to 0.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       WEIGHT VALIDATION
    ===================================================== */

    let parsedWeightKg: number | null = null;

    if (
      weightKg !== undefined &&
      weightKg !== null &&
      weightKg !== ""
    ) {
      parsedWeightKg = Number(weightKg);

      if (
        !Number.isFinite(parsedWeightKg) ||
        parsedWeightKg < 0
      ) {
        return NextResponse.json(
          {
            error:
              "Weight must be a valid number greater than or equal to 0.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /* =====================================================
       IMAGE URL
    =====================================================

    The image has already been uploaded by:

    /api/upload/part-image

    We only need to save the returned URL.
    */

    let cleanImageUrl: string | null = null;

    if (
      imageUrl !== undefined &&
      imageUrl !== null &&
      imageUrl !== ""
    ) {
      if (typeof imageUrl !== "string") {
        return NextResponse.json(
          {
            error: "Image URL must be a valid string.",
          },
          {
            status: 400,
          }
        );
      }

      cleanImageUrl = imageUrl.trim() || null;
    }

    /* =====================================================
       NORMALIZE VALUES
    ===================================================== */

    const cleanPartNumber =
      partNumber.trim();

    const cleanName =
      name.trim();

    const cleanCategoryId =
      categoryId.trim();

    const cleanOemNumber =
      typeof oemNumber === "string" &&
      oemNumber.trim()
        ? oemNumber.trim()
        : null;

    const cleanBarcode =
      typeof barcode === "string" &&
      barcode.trim()
        ? barcode.trim()
        : null;

    const cleanDescription =
      typeof description === "string" &&
      description.trim()
        ? description.trim()
        : null;

    const cleanManufacturer =
      typeof manufacturer === "string" &&
      manufacturer.trim()
        ? manufacturer.trim()
        : null;

    const cleanUnit =
      typeof unit === "string" &&
      unit.trim()
        ? unit.trim()
        : "piece";

    const cleanLocationId =
      typeof locationId === "string" &&
      locationId.trim()
        ? locationId.trim()
        : null;

    /* =====================================================
       CATEGORY CHECK
    ===================================================== */

    const category =
      await prisma.category.findUnique({
        where: {
          id: cleanCategoryId,
        },
      });

    if (!category) {
      return NextResponse.json(
        {
          error:
            "Selected category does not exist.",
        },
        {
          status: 404,
        }
      );
    }

    /* =====================================================
       DUPLICATE PART NUMBER
    ===================================================== */

    const existingPartNumber =
      await prisma.part.findUnique({
        where: {
          partNumber: cleanPartNumber,
        },
      });

    if (existingPartNumber) {
      return NextResponse.json(
        {
          error:
            "A part with this part number already exists.",
        },
        {
          status: 409,
        }
      );
    }

    /* =====================================================
       DUPLICATE BARCODE
    ===================================================== */

    if (cleanBarcode) {
      const existingBarcode =
        await prisma.part.findUnique({
          where: {
            barcode: cleanBarcode,
          },
        });

      if (existingBarcode) {
        return NextResponse.json(
          {
            error:
              "A part with this barcode already exists.",
          },
          {
            status: 409,
          }
        );
      }
    }

    /* =====================================================
       LOCATION CHECK
    ===================================================== */

    if (
      parsedInitialStock > 0 &&
      !cleanLocationId
    ) {
      return NextResponse.json(
        {
          error:
            "Warehouse location is required when initial stock is greater than zero.",
        },
        {
          status: 400,
        }
      );
    }

    if (cleanLocationId) {
      const location =
        await prisma.warehouseLocation.findUnique({
          where: {
            id: cleanLocationId,
          },
        });

      if (!location) {
        return NextResponse.json(
          {
            error:
              "Selected warehouse location does not exist.",
          },
          {
            status: 404,
          }
        );
      }

      if (!location.isActive) {
        return NextResponse.json(
          {
            error:
              "Selected warehouse location is inactive.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /* =====================================================
       CREATE PART + INVENTORY
    ===================================================== */

    const result =
      await prisma.$transaction(
        async (transaction) => {
          /*
          -------------------------------------------------
          CREATE PART
          -------------------------------------------------
          */

          const part =
            await transaction.part.create({
              data: {
                partNumber:
                  cleanPartNumber,

                oemNumber:
                  cleanOemNumber,

                barcode:
                  cleanBarcode,

                name:
                  cleanName,

                description:
                  cleanDescription,

                manufacturer:
                  cleanManufacturer,

                categoryId:
                  cleanCategoryId,

                costPrice:
                  parsedCostPrice.toFixed(2),

                sellingPrice:
                  parsedSellingPrice.toFixed(2),

                minimumStock:
                  parsedMinimumStock,

                reorderQuantity:
                  parsedReorderQuantity,

                unit:
                  cleanUnit,

                weightKg:
                  parsedWeightKg,

                /*
                -----------------------------------------
                SAVE IMAGE URL
                -----------------------------------------
                */

                imageUrl:
                  cleanImageUrl,
              },
            });

          /*
          -------------------------------------------------
          CREATE INVENTORY RECORD
          -------------------------------------------------
          */

          if (cleanLocationId) {
            await transaction.inventory.create({
              data: {
                partId:
                  part.id,

                locationId:
                  cleanLocationId,

                quantity:
                  parsedInitialStock,

                reservedQuantity:
                  0,
              },
            });
          }

          /*
          -------------------------------------------------
          RETURN COMPLETE PART
          -------------------------------------------------
          */

          return transaction.part.findUnique({
            where: {
              id: part.id,
            },

            include: {
              category: true,

              inventory: {
                include: {
                  location: true,
                },
              },

              vehicleCompatibility: {
                include: {
                  vehicle: true,
                },
              },
            },
          });
        }
      );

    /* =====================================================
       SUCCESS
    ===================================================== */

    return NextResponse.json(
      result,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Failed to create part:",
      error
    );

    /* =====================================================
       PRISMA UNIQUE ERROR
    ===================================================== */

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error:
            "A record with the same unique value already exists.",
        },
        {
          status: 409,
        }
      );
    }

    /* =====================================================
       GENERAL ERROR
    ===================================================== */

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create part.",
      },
      {
        status: 500,
      }
    );
  }
}