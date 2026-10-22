import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "LaundryPro | Laundry made simple", description: "Laundry order, pickup, payment and notification management." };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }