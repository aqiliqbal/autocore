import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const body = await request.json();

    const {
      isActive,
    } = body;

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        {
          error: "Invalid active status.",
        },
        {
          status: 400,
        }
      );
    }

    const existingCategory =
      await prisma.category.findUnique({
        where: {
          id,
        },
      });

    if (!existingCategory) {
      return NextResponse.json(
        {
          error: "Category not found.",
        },
        {
          status: 404,
        }
      );
    }

    const category =
      await prisma.category.update({
        where: {
          id,
        },
        data: {
          isActive,
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

    return NextResponse.json(category);
  } catch (error) {
    console.error(
      "Failed to update category:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to update category.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const category =
      await prisma.category.findUnique({
        where: {
          id,
        },
        include: {
          _count: {
            select: {
              parts: true,
              children: true,
            },
          },
        },
      });

    if (!category) {
      return NextResponse.json(
        {
          error: "Category not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (category._count.parts > 0) {
      return NextResponse.json(
        {
          error:
            "This category cannot be deleted because parts are using it.",
        },
        {
          status: 409,
        }
      );
    }

    if (category._count.children > 0) {
      return NextResponse.json(
        {
          error:
            "This category cannot be deleted because it has subcategories.",
        },
        {
          status: 409,
        }
      );
    }

    await prisma.category.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message: "Category deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Failed to delete category:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete category.",
      },
      {
        status: 500,
      }
    );
  }
}