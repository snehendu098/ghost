import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { NavigationProvider } from "@/components/providers/navigation-provider";
import CoreLayout from "@/components/layouts/CoreLayout";

const poppins = Poppins({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["100", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Ghost Finance",
  description: "baal lend debo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning lang="en">
      <body className={`${poppins.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NavigationProvider>
            <CoreLayout>{children}</CoreLayout>
          </NavigationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
