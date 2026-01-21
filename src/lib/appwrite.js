import { Client, Account, Databases, OAuthProvider } from "appwrite";

// Use fallback values for static export builds
// Actual values should be provided via NEXT_PUBLIC_* environment variables
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "placeholder-project-id");

const account = new Account(client);
const databases = new Databases(client);

export { client, account, databases, OAuthProvider };
