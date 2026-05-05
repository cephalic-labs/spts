import { NextResponse } from "next/server";
import { Client, Databases, Query } from "node-appwrite";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const search = searchParams.get("search") || "";

    const queries = [
      Query.orderAsc("college_name"),
      Query.limit(limit),
      Query.offset(offset),
    ];

    if (search.trim()) {
      queries.push(Query.contains("college_name", search.trim()));
    }

    const response = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
      "nirf_list",
      queries,
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching NIRF colleges:", error);
    return NextResponse.json(
      { error: "Failed to fetch NIRF colleges" },
      { status: 500 },
    );
  }
}
