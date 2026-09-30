import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const purchaseItemSchema = z.object({
  partId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitCost: z.number().positive(),
});

const createPurchaseSchema = z.object({
  supplierId: z.string().uuid(),

  discount: z.number().min(0),
  tax: z.number().min(0),

  items: z
    .array(purchaseItemSchema)
    .min(1, "At least one purchase item is required."),
});

const receivePurchaseSchema = z.object({
  purchaseId: z.string().uuid(),
  locationId: z.string().uuid(),
});

export async function GET() {
  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        supplier: {
          select: {
            name: true,
          },
        },

        items: {
          select: {
            quantity: true,
          },
        },
      },

      orderBy: {
        purchaseDate: "desc",
      },
    });

    return NextResponse.json(purchases);
  } catch (error) {
    console.error("Failed to fetch purchases:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch purchases",
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

    const validation =
      createPurchaseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid purchase data.",
          details: validation.error.flatten(),
        },
        {
          status: 400,
        }
      );
    }

    const {
      supplierId,
      discount,
      tax,
      items,
    } = validation.data;

    const supplier =
      await prisma.supplier.findUnique({
        where: {
          id: supplierId,
        },
      });

    if (!supplier) {
      return NextResponse.json(
        {
          error: "Selected supplier does not exist.",
        },
        {
          status: 404,
        }
      );
    }

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

    if (parts.length !== uniquePartIds.length) {
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

    const subtotal = items.reduce(
      (total, item) =>
        total + item.quantity * item.unitCost,
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

    const now = new Date();

    const year = now.getFullYear();

    const purchaseNumber =
      `PO-${year}-${Date.now()}`;

    const purchase =
      await prisma.$transaction(
        async (transaction) => {
          const newPurchase =
            await transaction.purchase.create({
              data: {
                purchaseNumber,
                supplierId,

                status: "DRAFT",

                subtotal: subtotal.toFixed(2),
                discount: discount.toFixed(2),
                tax: tax.toFixed(2),
                total: total.toFixed(2),

                items: {
                  create: items.map(
                    (item) => ({
                      partId: item.partId,
                      quantity: item.quantity,
                      unitCost:
                        item.unitCost.toFixed(2),
                      lineTotal: (
                        item.quantity *
                        item.unitCost
                      ).toFixed(2),
                    })
                  ),
                },
              },

              include: {
                supplier: true,

                items: {
                  include: {
                    part: true,
                  },
                },
              },
            });

          return newPurchase;
        }
      );

    return NextResponse.json(
      purchase,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Failed to create purchase:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to create purchase.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * RECEIVE PURCHASE
 *
 * This changes:
 *
 * Purchase
 *     ↓
 * Inventory
 *     ↓
 * StockTransaction
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const validation =
      receivePurchaseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid receive request.",
          details: validation.error.flatten(),
        },
        {
          status: 400,
        }
      );
    }

    const {
      purchaseId,
      locationId,
    } = validation.data;

    /*
     * Make sure the warehouse location exists.
     */
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

    /*
     * Perform the complete receiving operation
     * inside one database transaction.
     */
    const result =
      await prisma.$transaction(
        async (transaction) => {
          const purchase =
            await transaction.purchase.findUnique({
              where: {
                id: purchaseId,
              },

              include: {
                items: true,
              },
            });

          if (!purchase) {
            throw new Error(
              "Purchase order not found."
            );
          }

          /*
           * Prevent receiving the same purchase twice.
           */
          if (purchase.status === "RECEIVED") {
            throw new Error(
              "This purchase has already been received."
            );
          }

          if (purchase.status === "CANCELLED") {
            throw new Error(
              "Cancelled purchases cannot be received."
            );
          }

          if (purchase.items.length === 0) {
            throw new Error(
              "This purchase contains no items."
            );
          }

          /*
           * Process every purchased part.
           */
          for (const item of purchase.items) {
            /*
             * Find existing inventory record.
             */
            const existingInventory =
              await transaction.inventory.findUnique({
                where: {
                  partId_locationId: {
                    partId: item.partId,
                    locationId,
                  },
                },
              });

            let inventory;

            if (existingInventory) {
              /*
               * Increase existing stock.
               */
              inventory =
                await transaction.inventory.update({
                  where: {
                    id: existingInventory.id,
                  },

                  data: {
                    quantity: {
                      increment: item.quantity,
                    },
                  },
                });
            } else {
              /*
               * Create inventory record if this
               * part has never been stored at
               * this location before.
               */
              inventory =
                await transaction.inventory.create({
                  data: {
                    partId: item.partId,
                    locationId,
                    quantity: item.quantity,
                    reservedQuantity: 0,
                  },
                });
            }

            /*
             * Create permanent stock history.
             */
            await transaction.stockTransaction.create({
              data: {
                partId: item.partId,
                inventoryId: inventory.id,
                locationId,

                type: "PURCHASE_IN",

                quantity: item.quantity,

                balanceAfter:
                  inventory.quantity,

                purchaseId: purchase.id,

                referenceNote:
                  `Received ${purchase.purchaseNumber}`,
              },
            });
          }

          /*
           * Mark purchase as received.
           */
          const updatedPurchase =
            await transaction.purchase.update({
              where: {
                id: purchase.id,
              },

              data: {
                status: "RECEIVED",
                receivedAt: new Date(),
              },

              include: {
                supplier: true,
                items: {
                  include: {
                    part: true,
                  },
                },
              },
            });

          return updatedPurchase;
        }
      );

    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "Failed to receive purchase:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to receive purchase.";

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