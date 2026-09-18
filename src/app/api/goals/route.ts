import { NextRequest, NextResponse } from "next/server";
import { eq, desc, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { goals, reminders } from "@/db/schema";
import { goalInputSchema } from "@/lib/validations/goal";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const rows = await db
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
      .groupBy(goals.id)
      .orderBy(desc(goals.createdAt));

    return NextResponse.json({ success: true, goals: rows });
  } catch (error) {
    console.error("GET /api/goals error:", error);
    return NextResponse.json(
      { error: "Failed to fetch goals" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const parsed = goalInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const db = getDb();
    const newGoal = {
      id: crypto.randomUUID(),
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      targetDate: parsed.data.targetDate ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(goals).values(newGoal);

    return NextResponse.json(
      {
        success: true,
        goal: {
          ...newGoal,
          activeRemindersCount: 0,
          totalRemindersCount: 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/goals error:", error);
    return NextResponse.json(
      { error: "Failed to create goal" },
      { status: 500 }
    );
  }
}
