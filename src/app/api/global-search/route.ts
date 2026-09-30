import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const query =
      searchParams.get("q")
        ?.trim()
        .toLowerCase();

    if (!query) {
      return NextResponse.json([]);
    }

    /*
     * Limit results so the dropdown
     * remains fast.
     */
    const limit = 5;

    /*
     * ============================================================
     * PARTS
     * ============================================================
     */

    const parts =
      await prisma.part.findMany({
        where: {
          OR: [
            {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              partNumber: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              oemNumber: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
        },

        take: limit,

        orderBy: {
          name: "asc",
        },
      });

    /*
     * ============================================================
     * VEHICLES
     * ============================================================
     */

    const vehicles =
      await prisma.vehicle.findMany({
        where: {
          OR: [
            {
              make: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              model: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              variant: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
        },

        take: limit,

        orderBy: {
          make: "asc",
        },
      });

    /*
     * ============================================================
     * ENGINES
     * ============================================================
     */

    const engines =
      await prisma.engine.findMany({
        where: {
          OR: [
            {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              engineCode: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
        },

        take: limit,

        orderBy: {
          name: "asc",
        },
      });

    /*
     * ============================================================
     * CUSTOMERS
     * ============================================================
     */

    const customers =
      await prisma.customer.findMany({
        where: {
          OR: [
            {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              customerCode: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
        },

        take: limit,

        orderBy: {
          name: "asc",
        },
      });

    /*
     * ============================================================
     * SUPPLIERS
     * ============================================================
     */

    const suppliers =
      await prisma.supplier.findMany({
        where: {
          OR: [
            {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
        },

        take: limit,

        orderBy: {
          name: "asc",
        },
      });

    /*
     * ============================================================
     * FORMAT RESULTS
     * ============================================================
     */

    const results = [
      ...parts.map(
        (part) => ({
          id: part.id,

          type: "Part" as const,

          title: part.name,

          subtitle:
            part.partNumber ??
            "Part",

          href: `/inventory?search=${encodeURIComponent(
            part.partNumber ??
              part.name
          )}`,
        })
      ),

      ...vehicles.map(
        (vehicle) => ({
          id: vehicle.id,

          type: "Vehicle" as const,

          title: `${vehicle.make} ${vehicle.model}`,

          subtitle:
            vehicle.variant ??
            "Vehicle",

          href: `/vehicles?search=${encodeURIComponent(
            `${vehicle.make} ${vehicle.model}`
          )}`,
        })
      ),

      ...engines.map(
        (engine) => ({
          id: engine.id,

          type: "Engine" as const,

          title: engine.name,

          subtitle:
            engine.engineCode ??
            "Engine",

          href: `/engines?search=${encodeURIComponent(
            engine.engineCode ??
              engine.name
          )}`,
        })
      ),

      ...customers.map(
        (customer) => ({
          id: customer.id,

          type: "Customer" as const,

          title: customer.name,

          subtitle:
            customer.email ??
            customer.customerCode ??
            "Customer",

          href: `/customers?search=${encodeURIComponent(
            customer.name
          )}`,
        })
      ),

      ...suppliers.map(
        (supplier) => ({
          id: supplier.id,

          type: "Supplier" as const,

          title: supplier.name,

          subtitle:
            supplier.email ??
            "Supplier",

          href: `/suppliers?search=${encodeURIComponent(
            supplier.name
          )}`,
        })
      ),
    ];

    /*
     * Maximum dropdown results.
     */
    return NextResponse.json(
      results.slice(0, 15)
    );
  } catch (error) {
    console.error(
      "Global search error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to perform search.",
      },
      {
        status: 500,
      }
    );
  }
}