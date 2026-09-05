import { ReactNode } from "react";

interface RootLayoutProps {
  children: ReactNode;
}

// This is the root layout that wraps the entire application
// The actual internationalized layout is in [locale]/layout.tsx
export default function RootLayout({ children }: RootLayoutProps) {
  return children;
}
