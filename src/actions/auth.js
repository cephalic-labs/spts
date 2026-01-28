"use server";

import { databases, users } from "@/lib/server/appwrite";
import { DB_CONFIG } from "@/lib/dbConfig";
import { Query } from "node-appwrite";

export async function assignUserRole(userId, email) {
    if (!email || !userId) return { success: false, error: "Invalid user data" };

    try {
        console.log(`Checking roles for: ${email}`);

        // 1. Check Students Table
        const studentDocs = await databases.listDocuments(
            DB_CONFIG.DATABASE_ID,
            DB_CONFIG.COLLECTIONS.STUDENTS,
            [Query.equal("email", email)]
        );

        if (studentDocs.total > 0) {
            console.log("Found in students table. Assigning 'student' label.");
            await users.updateLabels(userId, ["student"]);
            return { success: true, role: "student", labels: ["student"] };
        }

        // 2. Check Faculty Table
        const facultyDocs = await databases.listDocuments(
            DB_CONFIG.DATABASE_ID,
            DB_CONFIG.COLLECTIONS.FACULTIES,
            [Query.equal("email", email)]
        );

        if (facultyDocs.total > 0) {
            const faculty = facultyDocs.documents[0];
            // Assuming 'role' or 'designation' field exists. Default to 'faculty' if not.
            // Based on user prompt: "assign that user a label as defined in the db"
            // I'll look for a 'role' field.
            let roles = ["faculty"];
            if (faculty.role) {
                roles.push(faculty.role);
            }
            // Also mapping common academic roles to system roles if needed
            // e.g. 'HOD' -> 'hod', 'Advisor' -> 'advisor'
            if (faculty.role) {
                const normalizedRole = faculty.role.toLowerCase();
                // Reset roles to just this specific functional role + faculty? 
                // Or just the specific role? 
                // The dashboard routing checks for 'admin', 'advisor', 'coordinator', 'hod', 'student'.
                // So we should assign those.
                roles = [normalizedRole];
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
