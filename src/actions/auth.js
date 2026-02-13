"use server";

import { databases, users } from "@/lib/server/appwrite";
import { DB_CONFIG } from "@/lib/dbConfig";
import { Query } from "node-appwrite";

export async function assignUserRole(userId, email) {
    if (!email || !userId) return { success: false, error: "Invalid user data" };

    try {
        const normalizedEmail = email.trim().toLowerCase();
        console.log(`Checking roles for: ${normalizedEmail}`);

        // 1. Check Students Table
        let studentDocs;
        try {
            studentDocs = await databases.listDocuments(
                DB_CONFIG.DATABASE_ID,
                DB_CONFIG.COLLECTIONS.STUDENTS,
                [Query.equal("email", normalizedEmail)]
            );
        } catch (e) {
            // Fallback: try original email if normalized fails
            studentDocs = await databases.listDocuments(
                DB_CONFIG.DATABASE_ID,
                DB_CONFIG.COLLECTIONS.STUDENTS,
                [Query.equal("email", email)]
            );
        }

        if (studentDocs.total > 0) {
            console.log("Found in students table. Assigning 'student' label.");

            // Also link Appwrite user ID to student record if not already linked
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

        // 2. Check Faculty Table
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

            // Also link Appwrite user ID to faculty record if not already linked
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

            // Normalize role from DB to match system expectations
            let roles = ["faculty"];
            let dbRoles = faculty.role;

            // Ensure dbRoles is an array
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
                };

                const mappedRoles = dbRoles
                    .map(r => {
                        const normalized = String(r).toLowerCase().trim();
                        return roleMap[normalized] || normalized;
                    })
                    .filter(r => r); // Remove empty strings

                if (mappedRoles.length > 0) {
                    roles = [...new Set(mappedRoles)]; // Unique roles
                }
            }

            console.log(`Found in faculty table. Assigning labels: ${roles.join(", ")}`);
            await users.updateLabels(userId, roles);
            return { success: true, role: roles[0], labels: roles };
        }

        console.log("User not found in any academic table.");
        return { success: false, error: "User not found in records" };

    } catch (error) {
        console.error("Error assigning role:", error);
        return { success: false, error: error.message };
    }
}
