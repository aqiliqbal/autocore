import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type StockTransactionType =
  | "PURCHASE_IN"
  | "SALE_OUT"
  | "CUSTOMER_RETURN"
  | "SUPPLIER_RETURN"
  | "ADJUSTMENT_IN"
  | "ADJUSTMENT_OUT"
  | "TRANSFER_IN"
  | "TRANSFER_OUT";

const incomingTypes: StockTransactionType[] = [
  "PURCHASE_IN",
  "CUSTOMER_RETURN",
  "ADJUSTMENT_IN",
  "TRANSFER_IN",
];

const outgoingTypes: StockTransactionType[] = [
  "SALE_OUT",
  "SUPPLIER_RETURN",
  "ADJUSTMENT_OUT",
  "TRANSFER_OUT",
];

/* =========================================================
   GET
   ========================================================= */

export async function GET() {
  try {
    const transactions =
      await prisma.stockTransaction.findMany({
        orderBy: {
          createdAt: "desc",
        },

        include: {
          part: {
            select: {
              id: true,
              partNumber: true,
              name: true,
              imageUrl: true,
            },
          },

          location: {
            select: {
              id: true,
              code: true,
              name: true,
              zone: true,
            },
          },

          inventory: {
            select: {
              id: true,
              quantity: true,
              reservedQuantity: true,
            },
          },

          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },

          purchase: {
            select: {
              id: true,
              purchaseNumber: true,
            },
          },

          sale: {
            select: {
              id: true,
              invoiceNumber: true,
            },
          },
        },
      });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error(
      "Failed to fetch stock transactions:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch stock transactions.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST
   ========================================================= */

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      partId,
      inventoryId,
      locationId,
      userId,
      purchaseId,
      saleId,
      type,
      quantity,
      referenceNote,
    } = body;

    /* -----------------------------------------------------
       REQUIRED PART ID
       ----------------------------------------------------- */

    if (
      typeof partId !== "string" ||
      !partId.trim()
    ) {
      return NextResponse.json(
        {
          error: "Part ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const cleanPartId = partId.trim();

    /* -----------------------------------------------------
       REQUIRED LOCATION ID
       ----------------------------------------------------- */

    if (
      typeof locationId !== "string" ||
      !locationId.trim()
    ) {
      return NextResponse.json(
        {
          error: "Warehouse location is required.",
        },
        {
          status: 400,
        }
      );
    }

    const cleanLocationId =
      locationId.trim();

    /* -----------------------------------------------------
       TRANSACTION TYPE
       ----------------------------------------------------- */

    const validTypes: StockTransactionType[] = [
      "PURCHASE_IN",
      "SALE_OUT",
      "CUSTOMER_RETURN",
      "SUPPLIER_RETURN",
      "ADJUSTMENT_IN",
      "ADJUSTMENT_OUT",
      "TRANSFER_IN",
      "TRANSFER_OUT",
    ];

    if (
      typeof type !== "string" ||
      !validTypes.includes(
        type as StockTransactionType
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid stock transaction type.",
        },
        {
          status: 400,
        }
      );
    }

    const transactionType =
      type as StockTransactionType;

    /* -----------------------------------------------------
       QUANTITY
       ----------------------------------------------------- */

    const parsedQuantity = Number(quantity);

    if (
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Quantity must be a whole number greater than 0.",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       OPTIONAL VALUES
       ----------------------------------------------------- */

    const cleanUserId =
      typeof userId === "string" &&
      userId.trim()
        ? userId.trim()
        : null;

    const cleanPurchaseId =
      typeof purchaseId === "string" &&
      purchaseId.trim()
        ? purchaseId.trim()
        : null;

    const cleanSaleId =
      typeof saleId === "string" &&
      saleId.trim()
        ? saleId.trim()
        : null;

    const cleanReferenceNote =
      typeof referenceNote === "string" &&
      referenceNote.trim()
        ? referenceNote.trim()
        : null;

    /* -----------------------------------------------------
       RELATION CHECKS
       ----------------------------------------------------- */

    const part =
      await prisma.part.findUnique({
        where: {
          id: cleanPartId,
        },
      });

    if (!part) {
      return NextResponse.json(
        {
          error:
            "Selected part does not exist.",
        },
        {
          status: 404,
        }
      );
    }

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

    /* -----------------------------------------------------
       INVENTORY
       ----------------------------------------------------- */

    let inventory;

    if (inventoryId) {
      if (
        typeof inventoryId !== "string"
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid inventory ID.",
          },
          {
            status: 400,
          }
        );
      }

      inventory =
        await prisma.inventory.findUnique({
          where: {
            id: inventoryId,
          },
        });

      if (!inventory) {
        return NextResponse.json(
          {
            error:
              "Selected inventory record does not exist.",
          },
          {
            status: 404,
          }
        );
      }

      if (
        inventory.partId !== cleanPartId ||
        inventory.locationId !==
          cleanLocationId
      ) {
        return NextResponse.json(
          {
            error:
              "Inventory does not belong to the selected part and location.",
          },
          {
            status: 400,
          }
        );
      }
    } else {
      inventory =
        await prisma.inventory.findUnique({
          where: {
            partId_locationId: {
              partId: cleanPartId,
              locationId: cleanLocationId,
            },
          },
        });
    }

    /* -----------------------------------------------------
       CREATE INVENTORY IF IT DOES NOT EXIST
       ----------------------------------------------------- */

    if (!inventory) {
      if (
        outgoingTypes.includes(
          transactionType
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Inventory record does not exist for this part and location.",
          },
          {
            status: 400,
          }
        );
      }

      inventory =
        await prisma.inventory.create({
          data: {
            partId: cleanPartId,
            locationId: cleanLocationId,
            quantity: 0,
            reservedQuantity: 0,
          },
        });
    }

    /* -----------------------------------------------------
       CALCULATE NEW BALANCE
       ----------------------------------------------------- */

    const currentQuantity =
      inventory.quantity;

    let newBalance: number;

    if (
      incomingTypes.includes(
        transactionType
      )
    ) {
      newBalance =
        currentQuantity +
        parsedQuantity;
    } else {
      newBalance =
        currentQuantity -
        parsedQuantity;
    }

    /* -----------------------------------------------------
       PREVENT NEGATIVE STOCK
       ----------------------------------------------------- */

    if (newBalance < 0) {
      return NextResponse.json(
        {
          error: `Insufficient stock. Current stock is ${currentQuantity}, but ${parsedQuantity} units were requested.`,
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       RESERVED STOCK CHECK
       ----------------------------------------------------- */

    if (
      newBalance <
      inventory.reservedQuantity
    ) {
      return NextResponse.json(
        {
          error:
            "Transaction would reduce available stock below the reserved quantity.",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       USER CHECK
       ----------------------------------------------------- */

    if (cleanUserId) {
      const user =
        await prisma.userProfile.findUnique({
          where: {
            id: cleanUserId,
          },
        });

      if (!user) {
        return NextResponse.json(
          {
            error:
              "Selected user does not exist.",
          },
          {
            status: 404,
          }
        );
      }

      if (!user.isActive) {
        return NextResponse.json(
          {
            error:
              "Selected user is inactive.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /* -----------------------------------------------------
       PURCHASE CHECK
       ----------------------------------------------------- */

    if (cleanPurchaseId) {
      const purchase =
        await prisma.purchase.findUnique({
          where: {
            id: cleanPurchaseId,
          },
        });

      if (!purchase) {
        return NextResponse.json(
          {
            error:
              "Selected purchase does not exist.",
          },
          {
            status: 404,
          }
        );
      }
    }

    /* -----------------------------------------------------
       SALE CHECK
       ----------------------------------------------------- */

    if (cleanSaleId) {
      const sale =
        await prisma.sale.findUnique({
          where: {
            id: cleanSaleId,
          },
        });

      if (!sale) {
        return NextResponse.json(
          {
            error:
              "Selected sale does not exist.",
          },
          {
            status: 404,
          }
        );
      }
    }

    /* -----------------------------------------------------
       TRANSACTION
       ----------------------------------------------------- */

    const result =
      await prisma.$transaction(
        async (transaction) => {
          /* -----------------------------------------------
             UPDATE INVENTORY
             ----------------------------------------------- */

          const updatedInventory =
            await transaction.inventory.update({
              where: {
                id: inventory.id,
              },

              data: {
                quantity: newBalance,
              },
            });

          /* -----------------------------------------------
             CREATE STOCK TRANSACTION
             ----------------------------------------------- */

          const stockTransaction =
            await transaction.stockTransaction.create(
              {
                data: {
                  partId: cleanPartId,

                  inventoryId:
                    updatedInventory.id,

                  locationId:
                    cleanLocationId,

                  userId: cleanUserId,

                  purchaseId:
                    cleanPurchaseId,

                  saleId:
                    cleanSaleId,

                  type: transactionType,

                  quantity: parsedQuantity,

                  balanceAfter:
                    newBalance,

                  referenceNote:
                    cleanReferenceNote,
                },

                include: {
                  part: {
                    select: {
                      id: true,
                      partNumber: true,
                      name: true,
                      imageUrl: true,
                    },
                  },

                  location: {
                    select: {
                      id: true,
                      code: true,
                      name: true,
                      zone: true,
                    },
                  },

                  inventory: {
                    select: {
                      id: true,
                      quantity: true,
                      reservedQuantity: true,
                    },
                  },

                  user: {
                    select: {
                      id: true,
                      fullName: true,
                      email: true,
                    },
                  },

                  purchase: {
                    select: {
                      id: true,
                      purchaseNumber: true,
                    },
                  },

                  sale: {
                    select: {
                      id: true,
                      invoiceNumber: true,
                    },
                  },
                },
              }
            );

          return stockTransaction;
        }
      );

    /* -----------------------------------------------------
       RESPONSE
       ----------------------------------------------------- */

    return NextResponse.json(
      result,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Failed to create stock transaction:",
      error
    );

    /* -----------------------------------------------------
       PRISMA UNIQUE ERROR
       ----------------------------------------------------- */

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

    /* -----------------------------------------------------
       PRISMA NOT FOUND ERROR
       ----------------------------------------------------- */

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        {
          error:
            "The requested inventory record could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    /* -----------------------------------------------------
       GENERAL ERROR
       ----------------------------------------------------- */

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create stock transaction.",
      },
      {
        status: 500,
      }
    );
  }
}