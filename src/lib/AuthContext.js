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
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      setConnectionError(null);
      // Get Appwrite auth user
      let currentUser = await account.get();

      // If user has no labels, try to assign them based on DB records
      if (!currentUser.labels || currentUser.labels.length === 0) {
        console.log("User has no labels, checking DB for role assignment...", currentUser.email);
        try {
          const result = await assignUserRole(currentUser.$id, currentUser.email);
          console.log("Role assignment result:", result);

          if (result.success && result.labels) {
            // Directly set the labels on currentUser from the server response
            // instead of relying on account.get() which may return stale data
            currentUser = { ...currentUser, labels: result.labels };
            console.log("Labels set from server response:", result.labels);
          } else {
            console.warn("Role assignment returned error or no match:", result.error);
          }
        } catch (roleErr) {
          console.error("Role assignment failed (non-fatal):", roleErr);
          // Continue - user just won't have a role yet
        }
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
            role: syncedUser.role,
            dbId: syncedUser.$id,
          }));
        }
      } catch (syncErr) {
        console.error("User sync failed (non-fatal):", syncErr);
        // Continue without DB sync - basic auth still works
      }
    } catch (error) {
      // Check if it's a connection/network error vs authentication error
      if (error.code === 'network_error' || 
          error.message?.includes('fetch') || 
          error.message?.includes('Network') ||
          error.type === 'network_request_failed') {
        setConnectionError('Unable to connect to authentication service. Please check your network connection.');
      } else if (error.code >= 500) {
        setConnectionError('Authentication service is currently unavailable. Please try again later.');
      } else {
        // Not logged in (401, 403, etc.)
        setUser(null);
        setDbUser(null);
      }
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
          role: userData.role,
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
    connectionError,
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
