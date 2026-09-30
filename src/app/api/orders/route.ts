import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/*
|--------------------------------------------------------------------------
| Supabase authenticated server client
|--------------------------------------------------------------------------
*/

async function getAuthenticatedUser() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(
              ({ name, value, options }) => {
                cookieStore.set(
                  name,
                  value,
                  options
                );
              }
            );
          } catch {
            /*
             * The request may be read-only.
             * In that case, ignore cookie errors.
             */
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/*
|--------------------------------------------------------------------------
| GET /api/orders
|--------------------------------------------------------------------------
| Loads all orders belonging to the currently logged-in customer.
|--------------------------------------------------------------------------
*/

export async function GET() {
  try {
    /*
     * Get authenticated Supabase user.
     */
    const user =
      await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "You must be logged in.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * Get authenticated user's email.
     */
    const email = user.email
      ?.trim()
      .toLowerCase();

    if (!email) {
      return NextResponse.json(
        {
          error:
            "Your account does not have an email address.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Find AutoCore customer.
     */
    const customer =
      await prisma.customer.findFirst({
        where: {
          email,
        },
      });

    /*
     * Customer exists in Supabase
     * but has never placed an order.
     */
    if (!customer) {
      return NextResponse.json(
        [],
        {
          status: 200,
        }
      );
    }

    /*
     * Load customer's sales/orders.
     */
    const sales =
      await prisma.sale.findMany({
        where: {
          customerId:
            customer.id,
        },

        orderBy: {
          createdAt: "desc",
        },

        include: {
          items: true,
        },
      });

    /*
     * Convert database sales into
     * the format expected by the
     * customer Orders page.
     */
    const orders = sales.map(
      (sale) => ({
        id: sale.id,

        orderNumber:
          sale.invoiceNumber,

        date:
          sale.createdAt,

        status:
          sale.status,

        paymentStatus:
          sale.paymentStatus,

        total:
          Number(sale.total),

        items:
          sale.items.reduce(
            (
              total,
              item
            ) =>
              total +
              item.quantity,
            0
          ),
      })
    );

    return NextResponse.json(
      orders,
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Load orders error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load orders.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST /api/orders
|--------------------------------------------------------------------------
| Creates a new customer order.
|--------------------------------------------------------------------------
*/

export async function POST(
  request: Request
) {
  try {
    /*
     * ================================================================
     * 1. AUTHENTICATION
     * ================================================================
     */

    const user =
      await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "You must be logged in to place an order.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * ================================================================
     * 2. READ REQUEST BODY
     * ================================================================
     */

    let body: any;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid request body.",
        },
        {
          status: 400,
        }
      );
    }

    const items = Array.isArray(
      body?.items
    )
      ? body.items
      : [];

    /*
     * Cart cannot be empty.
     */
    if (items.length === 0) {
      return NextResponse.json(
        {
          error:
            "Your cart is empty.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ================================================================
     * 3. CUSTOMER INFORMATION
     * ================================================================
     */

    const email = user.email
      ?.trim()
      .toLowerCase();

    if (!email) {
      return NextResponse.json(
        {
          error:
            "Your account does not have an email address.",
        },
        {
          status: 400,
        }
      );
    }

    const fullName =
      user.user_metadata
        ?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "AutoCore Customer";

    /*
     * ================================================================
     * 4. NORMALIZE CART
     * ================================================================
     *
     * If the same part appears twice in the cart,
     * combine the quantities.
     */

    const quantityMap =
      new Map<string, number>();

    for (const item of items) {
      const partId =
        String(
          item?.partId ?? ""
        ).trim();

      if (!partId) {
        return NextResponse.json(
          {
            error:
              "One of the cart items is missing a product ID.",
          },
          {
            status: 400,
          }
        );
      }

      const quantity =
        Number(
          item?.quantity
        );

      /*
       * Quantity must be a positive
       * whole number.
       */
      if (
        !Number.isInteger(
          quantity
        ) ||
        quantity <= 0
      ) {
        return NextResponse.json(
          {
            error:
              "Cart contains an invalid quantity.",
          },
          {
            status: 400,
          }
        );
      }

      const previous =
        quantityMap.get(
          partId
        ) ?? 0;

      quantityMap.set(
        partId,
        previous + quantity
      );
    }

    /*
     * Unique product IDs.
     */
    const partIds =
      Array.from(
        quantityMap.keys()
      );

    /*
     * ================================================================
     * 5. LOAD PRODUCTS
     * ================================================================
     *
     * Never trust product price supplied
     * by the browser.
     */

    const parts =
      await prisma.part.findMany({
        where: {
          id: {
            in: partIds,
          },

          status: "ACTIVE",
        },
      });

    /*
     * Make sure every requested product
     * exists and is active.
     */
    if (
      parts.length !==
      partIds.length
    ) {
      const foundIds =
        new Set(
          parts.map(
            (part) => part.id
          )
        );

      const missingPart =
        partIds.find(
          (id) =>
            !foundIds.has(id)
        );

      return NextResponse.json(
        {
          error:
            `Product ${missingPart ?? ""} is no longer available.`,
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ================================================================
     * 6. CREATE / FIND CUSTOMER
     * ================================================================
     */

    let customer =
      await prisma.customer.findFirst(
        {
          where: {
            email,
          },
        }
      );

    /*
     * Create AutoCore customer
     * automatically for first order.
     */
    if (!customer) {
      const customerCode =
        `CUS-${Date.now()}`;

      customer =
        await prisma.customer.create(
          {
            data: {
              customerCode,

              name: fullName,

              email,

              isActive: true,
            },
          }
        );
    }

    /*
     * ================================================================
     * 7. FIND ACTIVE WAREHOUSE
     * ================================================================
     *
     * Important:
     * We validate stock and reserve stock
     * from the SAME warehouse.
     */

    const location =
      await prisma.warehouseLocation.findFirst(
        {
          where: {
            isActive: true,
          },

          orderBy: {
            createdAt: "asc",
          },
        }
      );

    if (!location) {
      return NextResponse.json(
        {
          error:
            "No active warehouse location is available. Please contact AutoCore.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ================================================================
     * 8. TRANSACTION
     * ================================================================
     *
     * Order creation and stock reservation
     * happen together.
     */

    const result =
      await prisma.$transaction(
        async (tx) => {

          /*
           * ----------------------------------------------------------
           * Validate all requested products and stock first.
           * ----------------------------------------------------------
           */

          const orderItems: {
            partId: string;
            quantity: number;
            unitPrice: number;
            unitCost: number;
            lineTotal: number;
          }[] = [];

          for (const part of parts) {
            const quantity =
              quantityMap.get(
                part.id
              ) ?? 0;

            /*
             * Get inventory only from
             * the warehouse we will reserve from.
             */
            const inventories =
              await tx.inventory.findMany(
                {
                  where: {
                    partId:
                      part.id,

                    locationId:
                      location.id,
                  },

                  orderBy: {
                    quantity:
                      "desc",
                  },
                }
              );

            /*
             * Calculate total available
             * stock in this warehouse.
             */
            const availableStock =
              inventories.reduce(
                (
                  total,
                  inventory
                ) => {
                  const available =
                    Math.max(
                      0,
                      inventory.quantity -
                        inventory.reservedQuantity
                    );

                  return (
                    total +
                    available
                  );
                },
                0
              );

            /*
             * Requested quantity cannot
             * exceed available stock.
             */
            if (
              quantity >
              availableStock
            ) {
              throw new Error(
                `Only ${availableStock} unit(s) of ${part.name} are available.`
              );
            }

            /*
             * IMPORTANT:
             * Price comes from the database.
             *
             * We do NOT trust:
             *
             * item.price
             * item.unitPrice
             * item.total
             *
             * from the browser.
             */
            const unitPrice =
              Number(
                part.sellingPrice
              );

            const unitCost =
              Number(
                part.costPrice
              );

            /*
             * Validate price.
             */
            if (
              !Number.isFinite(
                unitPrice
              ) ||
              unitPrice < 0
            ) {
              throw new Error(
                `Invalid selling price for ${part.name}.`
              );
            }

            /*
             * Calculate line total
             * on the server.
             */
            const lineTotal =
              unitPrice *
              quantity;

            orderItems.push({
              partId:
                part.id,

              quantity,

              unitPrice,

              unitCost,

              lineTotal,
            });
          }

          /*
           * ----------------------------------------------------------
           * Calculate totals
           * ----------------------------------------------------------
           */

          const subtotal =
            orderItems.reduce(
              (
                total,
                item
              ) =>
                total +
                item.lineTotal,
              0
            );

          const discount = 0;

          const tax = 0;

          const total =
            subtotal -
            discount +
            tax;

          /*
           * ----------------------------------------------------------
           * Generate order number
           * ----------------------------------------------------------
           */

          const invoiceNumber =
            `ORD-${Date.now()}-${Math.floor(
              Math.random() * 1000
            )}`;

          /*
           * ----------------------------------------------------------
           * Create Sale / Order
           * ----------------------------------------------------------
           */

          const createdSale =
            await tx.sale.create(
              {
                data: {
                  invoiceNumber,

                  customerId:
                    customer.id,

                  status:
                    "CONFIRMED",

                  paymentStatus:
                    "PENDING",

                  subtotal,

                  discount,

                  tax,

                  total,

                  paidAmount:
                    0,

                  notes:
                    "Customer order placed through AutoCore Store.",

                  items: {
                    create:
                      orderItems.map(
                        (item) => ({
                          partId:
                            item.partId,

                          quantity:
                            item.quantity,

                          unitPrice:
                            item.unitPrice,

                          unitCost:
                            item.unitCost,

                          lineTotal:
                            item.lineTotal,
                        })
                      ),
                  },
                },

                include: {
                  items: true,

                  customer: true,
                },
              }
            );

          /*
           * ----------------------------------------------------------
           * Reserve inventory
           * ----------------------------------------------------------
           */

          for (const item of orderItems) {

            let remaining =
              item.quantity;

            /*
             * Get inventory records
             * for this exact warehouse.
             */
            const inventories =
              await tx.inventory.findMany(
                {
                  where: {
                    partId:
                      item.partId,

                    locationId:
                      location.id,
                  },

                  orderBy: {
                    quantity:
                      "desc",
                  },
                }
              );

            /*
             * Reserve stock across
             * inventory records.
             */
            for (const inventory of inventories) {

              if (
                remaining <= 0
              ) {
                break;
              }

              /*
               * Current available
               * quantity.
               */
              const available =
                Math.max(
                  0,
                  inventory.quantity -
                    inventory.reservedQuantity
                );

              if (
                available <= 0
              ) {
                continue;
              }

              /*
               * Reserve only what
               * is actually required.
               */
              const reserveAmount =
                Math.min(
                  available,
                  remaining
                );

              /*
               * Update reservation.
               */
              await tx.inventory.update(
                {
                  where: {
                    id:
                      inventory.id,
                  },

                  data: {
                    reservedQuantity:
                      {
                        increment:
                          reserveAmount,
                      },
                  },
                }
              );

              /*
               * Remaining quantity.
               */
              remaining -=
                reserveAmount;
            }

            /*
             * Safety check.
             */
            if (
              remaining > 0
            ) {
              throw new Error(
                `There is not enough stock available for ${item.partId}.`
              );
            }
          }

          /*
           * Return everything needed
           * by the response.
           */
          return {
            sale:
              createdSale,

            total,

            subtotal,

            locationId:
              location.id,
          };
        }
      );

    /*
     * ================================================================
     * 9. SUCCESS RESPONSE
     * ================================================================
     */

    return NextResponse.json(
      {
        success: true,

        order: {
          id:
            result.sale.id,

          invoiceNumber:
            result.sale.invoiceNumber,

          total:
            Number(
              result.sale.total
            ),

          subtotal:
            Number(
              result.sale.subtotal
            ),

          status:
            result.sale.status,

          paymentStatus:
            result.sale.paymentStatus,

          items:
            result.sale.items.length,
        },
      },
      {
        status: 201,
      }
    );

  } catch (error) {
    console.error(
      "Place order error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to place order.",
      },
      {
        status: 500,
      }
    );
  }
}