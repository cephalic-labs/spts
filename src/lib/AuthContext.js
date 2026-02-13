"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { account } from "./appwrite";
import { assignUserRole } from "@/actions/auth";
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
      let currentUser = await account.get();

      // Always verify roles against DB to ensure they are up to date
      // This ensures that if a role is added in DB, it reflects in Appwrite labels immediately
      try {
        const result = await assignUserRole(currentUser.$id, currentUser.email);
        if (result.success) {
          // Check if labels actually changed to avoid unnecessary re-fetch
          const currentLabels = currentUser.labels || [];
          const newLabels = result.labels || [];

          const sortedCurrent = [...currentLabels].sort().join(',');
          const sortedNew = [...newLabels].sort().join(',');

          if (sortedCurrent !== sortedNew) {
            console.log("Roles updated, refreshing user...");
            currentUser = await account.get();
          }
        }
      } catch (roleErr) {
        console.error("Role assignment failed (non-fatal):", roleErr);
      }

      setUser(currentUser);

      // Sync to database and get full user data
      try {
        const syncedUser = await syncUserToDatabase(currentUser);
        setDbUser(syncedUser);

        // Merge database fields into user object for easy access
        if (syncedUser) {
          setUser((prev) => ({
            ...prev,
            profile_url: syncedUser.profile_url,
            role: Array.isArray(syncedUser.role) ? (syncedUser.role[0] || "student") : syncedUser.role,
            roles: Array.isArray(syncedUser.role) ? syncedUser.role : [syncedUser.role],
            dbId: syncedUser.$id,
          }));
        }
      } catch (syncErr) {
        console.error("User sync failed (non-fatal):", syncErr);
        // Continue without DB sync - basic auth still works
      }
    } catch (error) {
      // Not logged in
      setUser(null);
      setDbUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function refreshUser() {
    try {
      const currentUser = await account.get();
      let userData = null;
      try {
        userData = await getUserByAppwriteId(currentUser.$id);
      } catch (e) {
        console.error("Error fetching user data during refresh:", e);
      }

      if (userData) {
        setDbUser(userData);
        setUser((prev) => ({
          ...prev,
          name: currentUser.name,
          profile_url: userData.profile_url,
          role: Array.isArray(userData.role) ? (userData.role[0] || "student") : userData.role,
          roles: Array.isArray(userData.role) ? userData.role : [userData.role],
          dbId: userData.$id,
        }));
      } else {
        // Even without DB user, update from Appwrite
        setUser((prev) => ({
          ...prev,
          name: currentUser.name,
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
