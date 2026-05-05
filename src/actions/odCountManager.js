"use server";

import { databases } from "@/lib/server/appwrite";
import { DB_CONFIG } from "@/lib/dbConfig";
import { Query } from "node-appwrite";
import { secureLog } from "@/lib/secureLogger";

const { DATABASE_ID, COLLECTIONS } = DB_CONFIG;

async function decrementStudentODCount(studentDocId) {
    const MAX_RETRIES = 3;
    
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const student = await databases.getDocument(DATABASE_ID, COLLECTIONS.STUDENTS, studentDocId);
            const currentCount = student.od_count ?? 7;
            const newCount = Math.max(0, currentCount - 1);
            
            await databases.updateDocument(DATABASE_ID, COLLECTIONS.STUDENTS, studentDocId, { od_count: newCount });
            return;
        } catch (error) {
            if (attempt === MAX_RETRIES - 1) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
        }
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
    
    const results = await Promise.allSettled(teamRollNumbers.map(async (rollNo) => {
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
            throw error;
        }
    }));
    
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
        secureLog.warn(`${failures.length}/${teamRollNumbers.length} team OD count updates failed`);
    }
}
