"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { account } from "./appwrite";
import { syncUserToDatabase, getUserByAppwriteId } from "./services/userService";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      // Get Appwrite auth user
      const currentUser = await account.get();
      setUser(currentUser);

      // Sync to database and get full user data
      const syncedUser = await syncUserToDatabase(currentUser);
      setDbUser(syncedUser);

      // Merge database fields into user object for easy access
      if (syncedUser) {
        setUser((prev) => ({
          ...prev,
          profile_url: syncedUser.profile_url,
          role: syncedUser.role,
          dbId: syncedUser.$id,
        }));
      }
    } catch (error) {
      setUser(null);
      setDbUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function refreshUser() {
    try {
      const currentUser = await account.get();
      const userData = await getUserByAppwriteId(currentUser.$id);

      if (userData) {
        setDbUser(userData);
        setUser((prev) => ({
          ...prev,
          profile_url: userData.profile_url,
          role: userData.role,
          dbId: userData.$id,
        }));
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  }

  async function logout() {
    try {
      await account.deleteSession("current");
      setUser(null);
      setDbUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  const value = {
    user,
    dbUser,
    loading,
    checkUser,
    refreshUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
