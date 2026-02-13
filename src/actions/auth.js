"use server";

import { databases, users } from "@/lib/server/appwrite";
import { DB_CONFIG } from "@/lib/dbConfig";
import { Query } from "node-appwrite";

export async function assignUserRole(userId, email) {
    if (!email || !userId) return { success: false, error: "Invalid user data" };

    try {
        const normalizedEmail = email.trim().toLowerCase();
        console.log(`Checking roles for: ${normalizedEmail}`);

        // 1. Check Faculty Table FIRST
        let facultyDocs = { total: 0, documents: [] };
        try {
            // Check both normalized and original email
            // Using separate queries to ensure we catch strict equality if DB is sensitive
            facultyDocs = await databases.listDocuments(
                DB_CONFIG.DATABASE_ID,
                DB_CONFIG.COLLECTIONS.FACULTIES,
                [Query.equal("email", normalizedEmail)]
            );

            if (facultyDocs.total === 0 && email !== normalizedEmail) {
                console.log("Normalized email not found in faculty, checking original:", email);
                facultyDocs = await databases.listDocuments(
                    DB_CONFIG.DATABASE_ID,
                    DB_CONFIG.COLLECTIONS.FACULTIES,
                    [Query.equal("email", email)]
                );
            }
        } catch (e) {
            console.error("Error querying faculty table:", e);
        }

        if (facultyDocs.total === 0) {
            // Fallback: Manual scan in case of casing issues that queries missed
            // Fetch a batch of faculties to check manually
            try {
                const allFaculty = await databases.listDocuments(
                    DB_CONFIG.DATABASE_ID,
                    DB_CONFIG.COLLECTIONS.FACULTIES,
                    [Query.limit(1000)] // Limit to 1000 for safety, loop if needed but usually sufficient
                );
                const found = allFaculty.documents.find(f =>
                    String(f.email).trim().toLowerCase() === normalizedEmail
                );
                if (found) {
                    console.log("Found in faculty table via manual scan:", found.email);
                    facultyDocs = { total: 1, documents: [found] };
                }
            } catch (scanErr) {
                console.warn("Manual faculty scan failed:", scanErr);
            }
        }

        if (facultyDocs.total > 0) {
            const faculty = facultyDocs.documents[0];
            console.log("Processing faculty record:", faculty.email);

            // Link Appwrite user ID if missing
            if (!faculty.appwrite_user_id) {
                try {
                    await databases.updateDocument(
                        DB_CONFIG.DATABASE_ID,
                        DB_CONFIG.COLLECTIONS.FACULTIES,
                        faculty.$id,
                        { appwrite_user_id: userId }
                    );
                    console.log("Linked Appwrite user ID to faculty record.");
                } catch (linkErr) {
                    console.warn("Could not link appwrite_user_id to faculty:", linkErr.message);
                }
            }

            // Normalize role from DB
            let roles = ["faculty"]; // Default role if mapping fails? No, better to stick to DB roles if possible.
            let dbRoles = faculty.role;

            if (!Array.isArray(dbRoles)) {
                dbRoles = dbRoles ? [dbRoles] : [];
            }

            if (dbRoles.length > 0) {
                const roleMap = {
                    "hod": "hod",
                    "head of department": "hod",
                    "coordinator": "coordinator",
                    "advisor": "advisor",
                    "class advisor": "advisor",
                    "mentor": "mentor",
                    "admin": "admin",
                    "principal": "principal",
                    "faculty": "faculty",
                    "student": "student" // just in case
                };

                const mappedRoles = dbRoles
                    .map(r => {
                        const normalized = String(r).toLowerCase().trim();
                        return roleMap[normalized] || normalized;
                    })
                    .filter(r => r);

                if (mappedRoles.length > 0) {
                    roles = [...new Set(mappedRoles)];
                }
            }

            console.log(`Found in faculty table. Assigning labels: ${roles.join(", ")}`);
            await users.updateLabels(userId, roles);
            return { success: true, role: roles[0], labels: roles };
        }

        // 2. Check Students Table SECOND
        let studentDocs = { total: 0, documents: [] };
        try {
            studentDocs = await databases.listDocuments(
                DB_CONFIG.DATABASE_ID,
                DB_CONFIG.COLLECTIONS.STUDENTS,
                [Query.equal("email", normalizedEmail)]
            );

            if (studentDocs.total === 0 && email !== normalizedEmail) {
                console.log("Normalized email not found in students, checking original:", email);
                studentDocs = await databases.listDocuments(
                    DB_CONFIG.DATABASE_ID,
                    DB_CONFIG.COLLECTIONS.STUDENTS,
                    [Query.equal("email", email)]
                );
            }
        } catch (e) {
            console.error("Error querying student table:", e);
        }

        if (studentDocs.total === 0) {
            // Fallback: Manual scan for students
            try {
                const allStudents = await databases.listDocuments(
                    DB_CONFIG.DATABASE_ID,
                    DB_CONFIG.COLLECTIONS.STUDENTS,
                    [Query.limit(1000)]
                );
                const found = allStudents.documents.find(s =>
                    String(s.email).trim().toLowerCase() === normalizedEmail
                );
                if (found) {
                    console.log("Found in student table via manual scan:", found.email);
                    studentDocs = { total: 1, documents: [found] };
                }
            } catch (scanErr) {
                console.warn("Manual student scan failed:", scanErr);
            }
        }

        if (studentDocs.total > 0) {
            console.log("Found in students table. Assigning 'student' label.");

            const studentDoc = studentDocs.documents[0];
            if (!studentDoc.appwrite_user_id) {
                try {
                    await databases.updateDocument(
                        DB_CONFIG.DATABASE_ID,
                        DB_CONFIG.COLLECTIONS.STUDENTS,
                        studentDoc.$id,
                        { appwrite_user_id: userId }
                    );
                    console.log("Linked Appwrite user ID to student record.");
                } catch (linkErr) {
                    console.warn("Could not link appwrite_user_id to student:", linkErr.message);
                }
            }

            await users.updateLabels(userId, ["student"]);
            return { success: true, role: "student", labels: ["student"] };
        }

        // 3. Not found in either
        console.log("User not found in any academic table. Leaving labels empty.");
        console.log(`Checked emails: ${normalizedEmail} and ${email}`);
        return { success: false, error: "User not found in records" };

    } catch (error) {
        console.error("Error assigning role:", error);
        return { success: false, error: error.message };
    }
}
