import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yang · PhD Master Workspace",
  description: "博士生自律、进度与科研管理工作台。",
  openGraph: {
    title: "Yang · PhD Master Workspace",
    description: "博士生自律、进度与科研管理工作台。",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Yang · PhD Master Workspace",
    description: "博士生自律、进度与科研管理工作台。",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
