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
        let facultyDocs;
        try {
            facultyDocs = await databases.listDocuments(
                DB_CONFIG.DATABASE_ID,
                DB_CONFIG.COLLECTIONS.FACULTIES,
                [Query.equal("email", normalizedEmail)]
            );
        } catch (e) {
            facultyDocs = await databases.listDocuments(
                DB_CONFIG.DATABASE_ID,
                DB_CONFIG.COLLECTIONS.FACULTIES,
                [Query.equal("email", email)]
            );
        }

        if (facultyDocs.total > 0) {
            const faculty = facultyDocs.documents[0];

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
            } else {
                // If dbRoles is empty but user is in faculty table, maybe default to mentor or just faculty?
                // Logic above defaults to ["faculty"], let's keep that or strictly use what's in DB.
                // Request says "apply all the roles of that user".
                // If DB has no roles, then labels should probably be empty or generic "faculty".
                // We'll stick to the roles derived above.
            }

            console.log(`Found in faculty table. Assigning labels: ${roles.join(", ")}`);
            await users.updateLabels(userId, roles);
            return { success: true, role: roles[0], labels: roles };
        }

        // 2. Check Students Table SECOND
        let studentDocs;
        try {
            studentDocs = await databases.listDocuments(
                DB_CONFIG.DATABASE_ID,
                DB_CONFIG.COLLECTIONS.STUDENTS,
                [Query.equal("email", normalizedEmail)]
            );
        } catch (e) {
            studentDocs = await databases.listDocuments(
                DB_CONFIG.DATABASE_ID,
                DB_CONFIG.COLLECTIONS.STUDENTS,
                [Query.equal("email", email)]
            );
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
        // Request says "keep the label empty".
        // Currently if we return success: false, the AuthContext just logs a warning.
        // If we want to strictly "keep empty", effectively we are doing nothing, which is correct.
        return { success: false, error: "User not found in records" };

    } catch (error) {
        console.error("Error assigning role:", error);
        return { success: false, error: error.message };
    }
}
