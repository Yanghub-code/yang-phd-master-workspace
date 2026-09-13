import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PhD Master Workspace",
  description: "博士生自律、进度与科研管理工作台。",
  metadataBase: new URL("https://phd-master-workspace.right-dace-0278.chatgpt.site"),
  openGraph: {
    title: "PhD Master Workspace",
    description: "博士生自律、进度与科研管理工作台。",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "PhD Master Workspace 博士生自律、进度与科研管理",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PhD Master Workspace",
    description: "博士生自律、进度与科研管理工作台。",
    images: ["/og.png"],
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
