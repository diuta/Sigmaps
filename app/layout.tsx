import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SIGMAPS",
  description: "Penilaian kawasan usaha kuliner di sekitar stasiun KRL Jakarta",
  icons: {
    icon: "/logos/sigmap-logo-icon_only.png",
    shortcut: "/logos/sigmap-logo-icon_only.png",
    apple: "/logos/sigmap-logo-icon_only.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body>{children}</body>
    </html>
  );
}
