import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { SiteContentProvider } from "@/components/SiteContentContext";
import { PlatformProvider } from "@/components/PlatformContext";
import { AlertProvider } from "@/components/AlertProvider";
import "./globals.css";

/**
 * Playfair Display — editorial luxury serif for all headings.
 * Plus Jakarta Sans — clean, geometric, highly readable body font.
 */
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-display-loaded",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body-loaded",
  display: "swap",
});

export const metadata = {
  title: "ImmFlow | Immigration Attorney Marketplace",
  description: "Connect with verified immigration attorneys for hearing coverage, case outsourcing, and referrals.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${playfair.variable}`}>
      <body>
        <AlertProvider>
          <PlatformProvider>
            <SiteContentProvider>
              {children}
            </SiteContentProvider>
          </PlatformProvider>
        </AlertProvider>
      </body>
    </html>
  );
}
