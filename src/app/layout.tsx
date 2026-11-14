import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "AI KIDS — творческая лаборатория педагога",
  description: "Создавайте дидактические игры, сказки, иллюстрации и материалы для дошкольного образования.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
