#!/usr/bin/env node

/**
 * Backfill Script: OD Quota and Category Migration
 * 
 * This script helps migrate existing student records from the flat od_count model
 * to the new per-category OD quota model.
 * 
 * Usage:
 *   node scripts/backfill-od-quota.js --seed-policy
 *   node scripts/backfill-od-quota.js --backfill-students
 *   node scripts/backfill-od-quota.js --all
 * 
 * Steps:
 * 1. Seed OD Quota Policy (if not exists)
 * 2. Backfill Student Category Fields from od_count
 * 3. Verify Results
 */

import { databases } from "../src/lib/server/appwrite.js";
import { DB_CONFIG, OD_CATEGORY_FIELDS } from "../src/lib/dbConfig.js";
import { ID, Query } from "appwrite";

const { DATABASE_ID, COLLECTIONS } = DB_CONFIG;

// Default quota policy (7 ODs across categories)
const DEFAULT_QUOTA_POLICY = {
  iit_nit: 1,
  university: 1,
  nirf: 1,
  industry: 2,
  others: 1,
};

/**
 * Seed the OD Quota Policy collection
 */
async function seedODQuotaPolicy() {
  try {
    console.log("🔄 Checking OD Quota Policy...");

    // Check if a policy already exists
    const existing = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.OD_QUOTA,
      [Query.limit(1)],
    );

    if (existing.documents.length > 0) {
      console.log(
        "✅ OD Quota Policy already exists. Skipping seed.",
      );
      return existing.documents[0];
    }

    // Create default policy
    console.log("📝 Creating default OD Quota Policy...");
    const policy = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.OD_QUOTA,
      ID.unique(),
      DEFAULT_QUOTA_POLICY,
    );

    console.log("✅ OD Quota Policy created:", {
      id: policy.$id,
      ...DEFAULT_QUOTA_POLICY,
    });
    return policy;
  } catch (error) {
    console.error("❌ Error seeding OD Quota Policy:", error.message);
    throw error;
  }
}

/**
 * Backfill student records with category fields
 */
async function backfillStudentCategories() {
  try {
    console.log("🔄 Fetching OD Quota Policy...");

    // Get current policy
    const policyDocs = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.OD_QUOTA,
      [Query.limit(1)],
    );

    if (policyDocs.documents.length === 0) {
      console.error("❌ No OD Quota Policy found. Run --seed-policy first.");
      process.exit(1);
    }

    const policy = policyDocs.documents[0];
    console.log("📋 Using policy:", policy);

    // Fetch all students
    console.log("🔄 Fetching student records...");
    let allStudents = [];
    let offset = 0;
    const batchSize = 100;

    while (true) {
      const batch = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.STUDENTS,
        [Query.limit(batchSize), Query.offset(offset)],
      );

      if (batch.documents.length === 0) break;

      allStudents = allStudents.concat(batch.documents);
      offset += batchSize;
    }

    console.log(`📊 Found ${allStudents.length} student records.`);

    if (allStudents.length === 0) {
      console.log("✅ No students to backfill.");
      return;
    }

    // Filter students that need backfill (missing category fields)
    const studentsNeedingBackfill = allStudents.filter((student) => {
      const hasAnyCategory = OD_CATEGORY_FIELDS.some(
        (field) =>
          student[field] !== undefined && student[field] !== null,
      );
      return !hasAnyCategory;
    });

    console.log(
      `🔍 ${studentsNeedingBackfill.length} student(s) need backfill.`,
    );

    if (studentsNeedingBackfill.length === 0) {
      console.log("✅ All students already have category fields.");
      return;
    }

    // Backfill each student
    let successCount = 0;
    let errorCount = 0;

    for (const student of studentsNeedingBackfill) {
      try {
        const odCount =
          student.od_count !== undefined && student.od_count !== null
            ? parseInt(student.od_count, 10)
            : 7;
        const normalizedCount = Number.isNaN(odCount) ? 7 : odCount;

        // Distribute OD based on policy
        const updateData = {};
        OD_CATEGORY_FIELDS.forEach((field) => {
          const policyValue = policy[field] || 0;
          updateData[field] = policyValue;
        });

        // Update student record
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.STUDENTS,
          student.$id,
          updateData,
        );

        console.log(
          `  ✓ ${student.roll_no || student.email}: od_count=${normalizedCount} → categories=${JSON.stringify(updateData)}`,
        );
        successCount += 1;
      } catch (error) {
        console.error(
          `  ✗ Failed to backfill ${student.roll_no || student.email}:`,
          error.message,
        );
        errorCount += 1;
      }
    }

    console.log(
      `\n📈 Backfill complete: ${successCount} succeeded, ${errorCount} failed.`,
    );
  } catch (error) {
    console.error("❌ Error backfilling students:", error.message);
    throw error;
  }
}

/**
 * Verify backfill results
 */
async function verifyBackfill() {
  try {
    console.log("\n🔍 Verifying backfill...");

    const students = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.STUDENTS,
      [Query.limit(10)],
    );

    console.log("\n📊 Sample of student records:");
    for (const student of students.documents) {
      const categoryValues = {};
      OD_CATEGORY_FIELDS.forEach((field) => {
        categoryValues[field] = student[field] || 0;
      });

      console.log(
        `  ${student.roll_no || student.email}:`,
        categoryValues,
      );
    }

    console.log("\n✅ Verification complete.");
  } catch (error) {
    console.error("❌ Error verifying backfill:", error.message);
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const hasAll = args.includes("--all");
  const hasSeedPolicy = args.includes("--seed-policy") || hasAll;
  const hasBackfill = args.includes("--backfill-students") || hasAll;
  const hasVerify = args.includes("--verify") || hasAll;

  try {
    console.log(
      "🚀 Starting OD Quota Backfill...\n",
    );

    if (hasSeedPolicy) {
      await seedODQuotaPolicy();
      console.log("");
    }

    if (hasBackfill) {
      await backfillStudentCategories();
      console.log("");
    }

    if (hasVerify) {
      await verifyBackfill();
    }

    if (!hasSeedPolicy && !hasBackfill && !hasVerify) {
      console.log("No operation specified. Usage:");
      console.log("  --seed-policy          Seed OD quota policy");
      console.log("  --backfill-students    Backfill student category fields");
      console.log("  --verify               Verify backfill results");
      console.log("  --all                  Run all operations");
      process.exit(1);
    }

    console.log("✨ Done!");
  } catch (error) {
    console.error("\n❌ Script failed:", error.message);
    process.exit(1);
  }
}

main();
