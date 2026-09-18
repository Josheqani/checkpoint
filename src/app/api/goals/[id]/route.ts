import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { goals, reminders } from "@/db/schema";
import { updateGoalSchema } from "@/lib/validations/goal";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = getDb();

    const [goal] = await db
      .select({
        id: goals.id,
        title: goals.title,
        description: goals.description,
        targetDate: goals.targetDate,
        createdAt: goals.createdAt,
        updatedAt: goals.updatedAt,
        activeRemindersCount: sql<number>`coalesce(count(case when ${reminders.isActive} = 1 then 1 end), 0)`.mapWith(Number),
        totalRemindersCount: sql<number>`coalesce(count(${reminders.id}), 0)`.mapWith(Number),
      })
      .from(goals)
      .leftJoin(reminders, eq(reminders.goalId, goals.id))
      .where(eq(goals.id, id))
      .groupBy(goals.id)
      .limit(1);

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, goal });
  } catch (error) {
    console.error("GET /api/goals/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch goal" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = getDb();

    const [existing] = await db
      .select()
      .from(goals)
      .where(eq(goals.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const parsed = updateGoalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updateData: Partial<typeof goals.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (parsed.data.title !== undefined) {
      updateData.title = parsed.data.title;
    }
    if (parsed.data.description !== undefined) {
      updateData.description = parsed.data.description ?? null;
    }
    if (parsed.data.targetDate !== undefined) {
      updateData.targetDate = parsed.data.targetDate ?? null;
    }

    await db.update(goals).set(updateData).where(eq(goals.id, id));

    const [updated] = await db
      .select({
        id: goals.id,
        title: goals.title,
        description: goals.description,
        targetDate: goals.targetDate,
        createdAt: goals.createdAt,
        updatedAt: goals.updatedAt,
        activeRemindersCount: sql<number>`coalesce(count(case when ${reminders.isActive} = 1 then 1 end), 0)`.mapWith(Number),
        totalRemindersCount: sql<number>`coalesce(count(${reminders.id}), 0)`.mapWith(Number),
      })
      .from(goals)
      .leftJoin(reminders, eq(reminders.goalId, goals.id))
      .where(eq(goals.id, id))
      .groupBy(goals.id)
      .limit(1);

    return NextResponse.json({ success: true, goal: updated });
  } catch (error) {
    console.error("PATCH /api/goals/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update goal" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = getDb();

    const [existing] = await db
      .select()
      .from(goals)
      .where(eq(goals.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    // Clean up reminders and delete goal (cascade)
    await db.delete(reminders).where(eq(reminders.goalId, id));
    await db.delete(goals).where(eq(goals.id, id));

    return NextResponse.json({
      success: true,
      message: "Goal deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/goals/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete goal" },
      { status: 500 }
    );
  }
}
