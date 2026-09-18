import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { reminders, sentLog } from "@/db/schema";
import { updateReminderSchema } from "@/lib/validations/reminder";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = getDb();

    const [reminder] = await db
      .select()
      .from(reminders)
      .where(eq(reminders.id, id))
      .limit(1);

    if (!reminder) {
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, reminder });
  } catch (error) {
    console.error("GET /api/reminders/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reminder" },
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
      .from(reminders)
      .where(eq(reminders.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const parsed = updateReminderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updateData: Partial<typeof reminders.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (parsed.data.phoneNumber !== undefined) {
      updateData.phoneNumber = parsed.data.phoneNumber;
    }

    if (parsed.data.scheduleType !== undefined) {
      updateData.scheduleType = parsed.data.scheduleType;
    }

    if (parsed.data.scheduledAt !== undefined) {
      updateData.scheduledAt = parsed.data.scheduledAt;
    }

    if (parsed.data.recurrencePattern !== undefined) {
      updateData.recurrencePattern =
        parsed.data.recurrencePattern === null
          ? null
          : typeof parsed.data.recurrencePattern === "string"
          ? parsed.data.recurrencePattern
          : JSON.stringify(parsed.data.recurrencePattern);
    }

    // If changing scheduleType to once, clear recurrencePattern if not explicitly set
    if (
      parsed.data.scheduleType === "once" &&
      parsed.data.recurrencePattern === undefined
    ) {
      updateData.recurrencePattern = null;
    }

    // If changing scheduleType to recurring, clear scheduledAt if not explicitly set
    if (
      parsed.data.scheduleType === "recurring" &&
      parsed.data.scheduledAt === undefined
    ) {
      updateData.scheduledAt = null;
    }

    if (parsed.data.isActive !== undefined) {
      updateData.isActive = parsed.data.isActive;
    }

    await db.update(reminders).set(updateData).where(eq(reminders.id, id));

    const [updated] = await db
      .select()
      .from(reminders)
      .where(eq(reminders.id, id))
      .limit(1);

    return NextResponse.json({ success: true, reminder: updated });
  } catch (error) {
    console.error("PATCH /api/reminders/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update reminder" },
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
      .from(reminders)
      .where(eq(reminders.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 }
      );
    }

    // Clean up sent logs and reminder
    await db.delete(sentLog).where(eq(sentLog.reminderId, id));
    await db.delete(reminders).where(eq(reminders.id, id));

    return NextResponse.json({
      success: true,
      message: "Reminder deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/reminders/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete reminder" },
      { status: 500 }
    );
  }
}
