import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { ClearAnswersResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function DELETE() {
  try {
    const result = await pool.query(`DELETE FROM vy_answers`);
    const response: ClearAnswersResponse = { deletedCount: result.rowCount ?? 0 };
    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error("Error clearing answers:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear answers" },
      { status: 500 }
    );
  }
}