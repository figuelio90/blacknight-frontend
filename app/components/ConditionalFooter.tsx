"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

/**
 * Renders the global Footer for all public routes.
 * Returns null on /admin/* to keep the admin panel clean.
 */
export default function ConditionalFooter() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) return null;

  return <Footer />;
}
