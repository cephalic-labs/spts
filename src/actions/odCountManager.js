"use server";

import { databases } from "@/lib/server/appwrite";
import { DB_CONFIG } from "@/lib/dbConfig";
import { Query } from "node-appwrite";
import { secureLog } from "@/lib/secureLogger";

const { DATABASE_ID, COLLECTIONS } = DB_CONFIG;

// In-memory lock map for serializing updates per student
const locks = new Map();

async function acquireLock(key) {
    while (locks.has(key)) {
        await locks.get(key);
    }
    let release;
    const promise = new Promise(resolve => { release = resolve; });
    locks.set(key, promise);
    return () => {
        locks.delete(key);
        release();
    };
}

async function decrementStudentODCount(studentDocId) {
    const release = await acquireLock(studentDocId);
    try {
        const student = await databases.getDocument(DATABASE_ID, COLLECTIONS.STUDENTS, studentDocId);
        const currentCount = student.od_count ?? 7;
        const newCount = Math.max(0, currentCount - 1);
        
        await databases.updateDocument(DATABASE_ID, COLLECTIONS.STUDENTS, studentDocId, { od_count: newCount });
    } finally {
        release();
    }
}

export async function decrementODCountAtomic(studentId) {
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.STUDENTS,
            [Query.equal("appwrite_user_id", studentId), Query.limit(1)]
        );
        
        if (response.documents.length > 0) {
            await decrementStudentODCount(response.documents[0].$id);
        }
    } catch (error) {
        secureLog.warn("Failed to decrement OD count:", error);
    }
}

export async function decrementTeamODCountsAtomic(teamRollNumbers) {
    if (!teamRollNumbers?.length) return;
    
    await Promise.all(teamRollNumbers.map(async (rollNo) => {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.STUDENTS,
                [Query.equal("roll_no", rollNo), Query.limit(1)]
            );
            
            if (response.documents.length > 0) {
                await decrementStudentODCount(response.documents[0].$id);
            }
        } catch (error) {
            secureLog.warn("Failed to decrement team member OD count:", error);
        }
    }));
}
