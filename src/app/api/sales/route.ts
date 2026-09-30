import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const saleItemSchema = z.object({
  partId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
});

const createSaleSchema = z.object({
  customerId: z.string().uuid().optional().nullable(),
  locationId: z.string().uuid(),
  discount: z.number().min(0),
  tax: z.number().min(0),
  paymentStatus: z.enum(["PENDING", "PARTIAL", "PAID"]),
  items: z
    .array(saleItemSchema)
    .min(1, "At least one sale item is required."),
});

export async function GET() {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        customer: {
          select: {
            name: true,
          },
        },
        items: {
          include: {
            part: {
              select: {
                partNumber: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        saleDate: "desc",
      },
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error("Failed to fetch sales:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch sales",
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

    const validation = createSaleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid sale data.",
          details: validation.error.flatten(),
        },
        {
          status: 400,
        }
      );
    }

    const {
      customerId,
      locationId,
      discount,
      tax,
      paymentStatus,
      items,
    } = validation.data;

    // --------------------------------------------------
    // VERIFY WAREHOUSE
    // --------------------------------------------------

    const location =
      await prisma.warehouseLocation.findUnique({
        where: {
          id: locationId,
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

    // --------------------------------------------------
    // VERIFY CUSTOMER
    // --------------------------------------------------

    if (customerId) {
      const customer =
        await prisma.customer.findUnique({
          where: {
            id: customerId,
          },
        });

      if (!customer) {
        return NextResponse.json(
          {
            error:
              "Selected customer does not exist.",
          },
          {
            status: 404,
          }
        );
      }
    }

    // --------------------------------------------------
    // VERIFY PARTS
    // --------------------------------------------------

    const partIds = items.map(
      (item) => item.partId
    );

    const uniquePartIds = [
      ...new Set(partIds),
    ];

    const parts = await prisma.part.findMany({
      where: {
        id: {
          in: uniquePartIds,
        },
      },
    });

    if (
      parts.length !== uniquePartIds.length
    ) {
      return NextResponse.json(
        {
          error:
            "One or more selected parts do not exist.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // CALCULATE TOTALS
    // --------------------------------------------------

    const subtotal = items.reduce(
      (total, item) =>
        total +
        item.quantity * item.unitPrice,
      0
    );

    if (discount > subtotal) {
      return NextResponse.json(
        {
          error:
            "Discount cannot be greater than subtotal.",
        },
        {
          status: 400,
        }
      );
    }

    const total =
      subtotal - discount + tax;

    // --------------------------------------------------
    // GENERATE INVOICE NUMBER
    // --------------------------------------------------

    const now = new Date();

    const year = now.getFullYear();

    const timestamp = Date.now();

    const invoiceNumber =
      `INV-${year}-${timestamp}`;

    // --------------------------------------------------
    // DATABASE TRANSACTION
    // --------------------------------------------------

    const sale = await prisma.$transaction(
      async (transaction) => {
        /*
          Check every item's inventory before
          creating the sale or changing stock.
        */

        const inventoryRecords = [];

        for (const item of items) {
          const inventory =
            await transaction.inventory.findUnique({
              where: {
                partId_locationId: {
                  partId: item.partId,
                  locationId,
                },
              },
              include: {
                part: true,
              },
            });

          if (!inventory) {
            throw new Error(
              `No inventory record exists for ${item.partId} at ${location.code}.`
            );
          }

          const availableStock =
            inventory.quantity -
            inventory.reservedQuantity;

          if (
            item.quantity >
            availableStock
          ) {
            throw new Error(
              `Insufficient stock for ${inventory.part.name}. Available: ${availableStock}, requested: ${item.quantity}.`
            );
          }

          inventoryRecords.push({
            item,
            inventory,
          });
        }

        // --------------------------------------------------
        // CREATE SALE
        // --------------------------------------------------

        const newSale =
          await transaction.sale.create({
            data: {
              invoiceNumber,

              customerId:
                customerId || null,

              status: "COMPLETED",

              paymentStatus,

              subtotal:
                subtotal.toFixed(2),

              discount:
                discount.toFixed(2),

              tax:
                tax.toFixed(2),

              total:
                total.toFixed(2),

              items: {
                create: items.map(
                  (item) => {
                    const part =
                      parts.find(
                        (databasePart) =>
                          databasePart.id ===
                          item.partId
                      );

                    if (!part) {
                      throw new Error(
                        "Selected part could not be found."
                      );
                    }

                    return {
                      partId:
                        item.partId,

                      quantity:
                        item.quantity,

                      // Selling price at the
                      // time of sale.
                      unitPrice:
                        item.unitPrice.toFixed(
                          2
                        ),

                      // Preserve the cost price
                      // for historical profit.
                      unitCost:
                        part.costPrice,

                      lineTotal: (
                        item.quantity *
                        item.unitPrice
                      ).toFixed(2),
                    };
                  }
                ),
              },
            },

            include: {
              customer: true,

              items: {
                include: {
                  part: true,
                },
              },
            },
          });

        // --------------------------------------------------
        // REDUCE INVENTORY
        // --------------------------------------------------

        for (const record of inventoryRecords) {
          const newQuantity =
            record.inventory.quantity -
            record.item.quantity;

          const updatedInventory =
            await transaction.inventory.update({
              where: {
                id: record.inventory.id,
              },

              data: {
                quantity: {
                  decrement:
                    record.item.quantity,
                },
              },
            });

          // --------------------------------------------------
          // CREATE SALE_OUT TRANSACTION
          // --------------------------------------------------

          await transaction.stockTransaction.create({
            data: {
              partId:
                record.item.partId,

              inventoryId:
                updatedInventory.id,

              locationId,

              saleId:
                newSale.id,

              type: "SALE_OUT",

              quantity:
                record.item.quantity,

              balanceAfter:
                newQuantity,

              referenceNote:
                `Sold through ${invoiceNumber}`,
            },
          });
        }

        return newSale;
      }
    );

    return NextResponse.json(
      sale,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Failed to create sale:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to create sale.";

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 400,
      }
    );
  }
}