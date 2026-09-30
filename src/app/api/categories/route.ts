import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            parts: true,
            children: true,
          },
        },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Failed to fetch categories:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch categories.",
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
      name,
      description,
    } = body;

    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      return NextResponse.json(
        {
          error: "Category name is required.",
        },
        {
          status: 400,
        }
      );
    }

    const cleanName = name.trim();

    const existingCategory =
      await prisma.category.findUnique({
        where: {
          name: cleanName,
        },
      });

    if (existingCategory) {
      return NextResponse.json(
        {
          error:
            "A category with this name already exists.",
        },
        {
          status: 409,
        }
      );
    }

    const cleanDescription =
      typeof description === "string" &&
      description.trim()
        ? description.trim()
        : null;

    const category =
      await prisma.category.create({
        data: {
          name: cleanName,
          description: cleanDescription,
        },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              parts: true,
              children: true,
            },
          },
        },
      });

    return NextResponse.json(
      category,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Failed to create category:",
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
            "A category with this name already exists.",
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
            : "Failed to create category.",
      },
      {
        status: 500,
      }
    );
  }
}