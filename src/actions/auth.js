"use server";

import { databases, users } from "@/lib/server/appwrite";
import { DB_CONFIG } from "@/lib/dbConfig";
import { Query } from "node-appwrite";
import { secureLog } from "@/lib/secureLogger";

export async function assignUserRole(userId, email) {
    if (!email || !userId) return { success: false, error: "Invalid user data" };

    try {
        const normalizedEmail = email.trim().toLowerCase();
        secureLog.emailLog('Checking roles for', normalizedEmail);

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
                secureLog.info("Normalized email not found in faculty, checking original");
                facultyDocs = await databases.listDocuments(
                    DB_CONFIG.DATABASE_ID,
                    DB_CONFIG.COLLECTIONS.FACULTIES,
                    [Query.equal("email", email)]
                );
            }
        } catch (e) {
            secureLog.error("Error querying faculty table:", e);
        }

        if (facultyDocs.total === 0) {
            // Fallback: Manual scan with pagination
            try {
                let offset = 0;
                const limit = 1000;
                let found = null;

                while (!found) {
                    const batch = await databases.listDocuments(
                        DB_CONFIG.DATABASE_ID,
                        DB_CONFIG.COLLECTIONS.FACULTIES,
                        [Query.limit(limit), Query.offset(offset)]
                    );
                    
                    found = batch.documents.find(f =>
                        String(f.email).trim().toLowerCase() === normalizedEmail
                    );
                    
                    if (found || batch.documents.length < limit) break;
                    offset += limit;
                }

                if (found) {
                    secureLog.info("Found in faculty table via manual scan");
                    facultyDocs = { total: 1, documents: [found] };
                }
            } catch (scanErr) {
                secureLog.warn("Manual faculty scan failed:", scanErr);
            }
        }

        if (facultyDocs.total > 0) {
            const faculty = facultyDocs.documents[0];
            secureLog.info("Processing faculty record");

            // Link Appwrite user ID if missing
            if (!faculty.appwrite_user_id) {
                try {
                    await databases.updateDocument(
                        DB_CONFIG.DATABASE_ID,
                        DB_CONFIG.COLLECTIONS.FACULTIES,
                        faculty.$id,
                        { appwrite_user_id: userId }
                    );
                    secureLog.info("Linked Appwrite user ID to faculty record");
                } catch (linkErr) {
                    secureLog.warn("Could not link appwrite_user_id to faculty:", linkErr.message);
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
                    "faculty": "mentor",
                    "student": "student",
                    "sudo": "sudo",
                    "super admin": "sudo"
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

            secureLog.authEvent('Role assignment', { roles: roles.join(", "), success: true });
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
                secureLog.info("Normalized email not found in students, checking original");
                studentDocs = await databases.listDocuments(
                    DB_CONFIG.DATABASE_ID,
                    DB_CONFIG.COLLECTIONS.STUDENTS,
                    [Query.equal("email", email)]
                );
            }
        } catch (e) {
            secureLog.error("Error querying student table:", e);
        }

        if (studentDocs.total === 0) {
            // Fallback: Manual scan with pagination
            try {
                let offset = 0;
                const limit = 1000;
                let found = null;

                while (!found) {
                    const batch = await databases.listDocuments(
                        DB_CONFIG.DATABASE_ID,
                        DB_CONFIG.COLLECTIONS.STUDENTS,
                        [Query.limit(limit), Query.offset(offset)]
                    );
                    
                    found = batch.documents.find(s =>
                        String(s.email).trim().toLowerCase() === normalizedEmail
                    );
                    
                    if (found || batch.documents.length < limit) break;
                    offset += limit;
                }

                if (found) {
                    secureLog.info("Found in student table via manual scan");
                    studentDocs = { total: 1, documents: [found] };
                }
            } catch (scanErr) {
                secureLog.warn("Manual student scan failed:", scanErr);
            }
        }

        if (studentDocs.total > 0) {
            secureLog.authEvent('Role assignment', { role: 'student', success: true });

            const studentDoc = studentDocs.documents[0];
            if (!studentDoc.appwrite_user_id) {
                try {
                    await databases.updateDocument(
                        DB_CONFIG.DATABASE_ID,
                        DB_CONFIG.COLLECTIONS.STUDENTS,
                        studentDoc.$id,
                        { appwrite_user_id: userId }
                    );
                    secureLog.info("Linked Appwrite user ID to student record");
                } catch (linkErr) {
                    secureLog.warn("Could not link appwrite_user_id to student:", linkErr.message);
                }
            }

            await users.updateLabels(userId, ["student"]);
            return { success: true, role: "student", labels: ["student"] };
        }

        // 3. Not found in either
        secureLog.authEvent('User not found', { success: false });
        return { success: false, error: "User not found in records" };

    } catch (error) {
        secureLog.error("Error assigning role:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Accurately calculate the total counts for admin and sudo roles
 * directly from the Appwrite Auth users collection via explicitly checking labels
 */
export async function getAdminSudoCounts() {
    try {
        let admins = 0;
        let sudos = 0;

        let hasMore = true;
        let cursor = null;

        while (hasMore) {
            const queries = [Query.limit(100)];
            if (cursor) {
                queries.push(Query.cursorAfter(cursor));
            }

            const response = await users.list(queries);

            for (const u of response.users) {
                if (Array.isArray(u.labels)) {
                    if (u.labels.includes("admin")) admins++;
                    if (u.labels.includes("sudo")) sudos++;
                }
            }

            if (response.users.length < 100) {
                hasMore = false;
            } else {
                cursor = response.users[response.users.length - 1].$id;
            }
        }

        return { admins, sudos };
    } catch (error) {
        secureLog.error("Error computing label counts:", error);
        return { admins: 0, sudos: 0 };
    }
}

/**
 * Get all admins/sudos directly mapped from Auth labels, 
 * then fetched from the FACULTIES database for UI mapping.
 */
export async function getAdminFacultyFromLabels() {
    try {
        let adminUsers = [];
        let hasMore = true;
        let cursor = null;

        while (hasMore) {
            const queries = [Query.limit(100)];
            if (cursor) queries.push(Query.cursorAfter(cursor));

            const response = await users.list(queries);

            for (const u of response.users) {
                if (Array.isArray(u.labels) && (u.labels.includes("admin") || u.labels.includes("sudo"))) {
                    adminUsers.push(u);
                }
            }

            if (response.users.length < 100) {
                hasMore = false;
            } else {
                cursor = response.users[response.users.length - 1].$id;
            }
        }

        // Now lookup in database
        const dbAdmins = [];
        for (const u of adminUsers) {
            try {
                // Try to find them by appwrite_user_id or email
                const res = await databases.listDocuments(DB_CONFIG.DATABASE_ID, DB_CONFIG.COLLECTIONS.FACULTIES, [
                    Query.equal("email", u.email),
                    Query.limit(1)
                ]);

                if (res.documents.length > 0) {
                    dbAdmins.push({
                        ...res.documents[0],
                        // Enforce their specific label
                        role: u.labels
                    });
                } else {
                    dbAdmins.push({
                        $id: u.$id,
                        name: u.name || "Unknown",
                        email: u.email,
                        department: "ADMIN",
                        designation: "System Administrator",
                        role: u.labels,
                        _isAuthOnly: true
                    });
                }
            } catch (e) {
                console.warn("Failed fetching metadata for user:", u.email);
            }
        }

        return dbAdmins;
    } catch (error) {
        console.error("Error fetching getAdminFacultyFromLabels:", error);
        return [];
    }
}

/**
 * Utility function to manually synchronize a user's Auth Labels
 * Useful when a user is promoted to an Admin/Sudo via the dashboard.
 */
export async function syncUserLabels(email, newLabels) {
    try {
        if (!email || !Array.isArray(newLabels)) return { success: false, error: "Invalid data provided to syncUserLabels" };

        // Find the user by exact email match
        const authUsers = await users.list([
            Query.equal("email", email.trim().toLowerCase())
        ]);

        if (authUsers.users.length > 0) {
            const targetUserId = authUsers.users[0].$id;
            console.log(`Manually syncing labels for ${email}:`, newLabels);
            await users.updateLabels(targetUserId, newLabels);
            return { success: true, userId: targetUserId, labels: newLabels };
        }

        return { success: false, error: "User not currently registered in Appwrite Auth System." };
    } catch (error) {
        console.error("Failed to sync labels:", error);
        return { success: false, error: error.message };
    }
}

