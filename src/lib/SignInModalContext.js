"use client";

import { createContext, useContext, useState } from "react";

const SignInModalContext = createContext();

export function SignInModalProvider({ children }) {
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  const openSignIn = () => setIsSignInOpen(true);
  const closeSignIn = () => setIsSignInOpen(false);

  return (
    <SignInModalContext.Provider value={{ isSignInOpen, openSignIn, closeSignIn }}>
      {children}
    </SignInModalContext.Provider>
  );
}

export function useSignInModal() {
  const context = useContext(SignInModalContext);
  if (!context) {
    throw new Error("useSignInModal must be used within a SignInModalProvider");
  }
  return context;
}
