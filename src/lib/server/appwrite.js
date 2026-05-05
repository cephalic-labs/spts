import { Client, Databases, Users } from "node-appwrite";

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
const apiKey = process.env.APPWRITE_API_KEY;

if (apiKey) {
    client.setKey(apiKey);
} else {
    console.warn("⚠️ WARNING: No APPWRITE_API_KEY found. Server actions requiring admin privileges will fail.");
}

const databases = new Databases(client);
const users = new Users(client);

export { client, databases, users };
