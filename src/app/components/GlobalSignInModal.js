"use client";

import { useSignInModal } from "@/lib/SignInModalContext";
import SignInModal from "./SignInModal";

export default function GlobalSignInModal() {
  const { isSignInOpen, closeSignIn } = useSignInModal();
  
  return <SignInModal isOpen={isSignInOpen} onClose={closeSignIn} />;
}
