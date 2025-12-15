"use client";

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    // ✅ Fallback seguro para el render inicial del servidor
    return {
      user: null,
      loading: true,
      login: async () => false,
      logout: () => {},
      token: null,
    };
  }

  return context;
}
