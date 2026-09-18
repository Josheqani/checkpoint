import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { getDb } from "@/db";
import { goals, reminders } from "@/db/schema";
import { createReminderSchema } from "@/lib/validations/reminder";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: goalId } = await params;
    const db = getDb();

    // Verify goal exists
    const [goal] = await db
      .select({ id: goals.id })
      .from(goals)
      .where(eq(goals.id, goalId))
      .limit(1);

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const rows = await db
      .select()
      .from(reminders)
      .where(eq(reminders.goalId, goalId))
      .orderBy(desc(reminders.createdAt));

    return NextResponse.json({ success: true, reminders: rows });
  } catch (error) {
    console.error("GET /api/goals/[id]/reminders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reminders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: goalId } = await params;
    const db = getDb();

    // Verify goal exists
    const [goal] = await db
      .select({ id: goals.id })
      .from(goals)
      .where(eq(goals.id, goalId))
      .limit(1);

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const parsed = createReminderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const patternString =
      parsed.data.scheduleType === "recurring" && parsed.data.recurrencePattern
        ? typeof parsed.data.recurrencePattern === "string"
          ? parsed.data.recurrencePattern
          : JSON.stringify(parsed.data.recurrencePattern)
        : null;

    const newReminder = {
      id: crypto.randomUUID(),
      goalId,
      phoneNumber: parsed.data.phoneNumber,
      scheduleType: parsed.data.scheduleType,
      scheduledAt:
        parsed.data.scheduleType === "once" ? parsed.data.scheduledAt : null,
      recurrencePattern: patternString,
      isActive: parsed.data.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(reminders).values(newReminder);

    return NextResponse.json(
      { success: true, reminder: newReminder },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/goals/[id]/reminders error:", error);
    return NextResponse.json(
      { error: "Failed to create reminder" },
      { status: 500 }
    );
  }
}
