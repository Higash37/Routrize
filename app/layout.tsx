import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/hooks/use-auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://routrize.com"),
  title: {
    default: "ルートライズ（Routrize） - 参考書ルートを作って、実行を見える化する",
    template: "%s | ルートライズ（Routrize）",
  },
  description:
    "ルートライズは塾講師が参考書ルート（カリキュラム）を高速に作成し、PDF出力・生徒配布・進捗管理までできるWebツール。無料で今すぐ使えます。",
  keywords: [
    "ルートライズ",
    "Routrize",
    "参考書ルート",
    "カリキュラム作成",
    "塾",
    "塾講師",
    "参考書",
    "学習計画",
    "進捗管理",
    "教材管理",
  ],
  icons: {
    icon: "/icon.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "ルートライズ（Routrize）",
    title: "ルートライズ（Routrize） - 参考書ルートを作って、実行を見える化する",
    description:
      "塾講師が参考書ルート（カリキュラム）を高速に作成し、PDF出力・生徒配布・進捗管理までできるWebツール。",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: "ルートライズ（Routrize） - 参考書ルートを作って、実行を見える化する",
    description:
      "塾講師が参考書ルート（カリキュラム）を高速に作成し、PDF出力・生徒配布・進捗管理までできるWebツール。",
    images: ["/og-image.jpg"],
  },
  alternates: {
    canonical: "https://routrize.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "ルートライズ（Routrize）",
              url: "https://routrize.com",
              description:
                "塾講師が参考書ルート（カリキュラム）を高速に作成し、PDF出力・生徒配布・進捗管理までできるWebツール。",
              applicationCategory: "EducationalApplication",
              operatingSystem: "All",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "JPY",
              },
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
