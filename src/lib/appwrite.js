import { Client, Account, Databases, OAuthProvider, ID, Query } from "appwrite";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.NEXT_PUBLIC_APPWRITE_API_KEY);

const account = new Account(client);
const databases = new Databases(client);

export { client, account, databases, OAuthProvider, ID, Query };
