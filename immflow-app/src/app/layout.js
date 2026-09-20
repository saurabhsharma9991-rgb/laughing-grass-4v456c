import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { SiteContentProvider } from "@/components/SiteContentContext";
import { PlatformProvider } from "@/components/PlatformContext";
import { AlertProvider } from "@/components/AlertProvider";
import { I18nProvider } from "@/components/I18nProvider";
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
  title: "ImmFlow | Immigration Services Marketplace",
  description:
    "Find verified immigration attorneys, certified translators, interpreters, and psychological evaluation professionals.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${playfair.variable}`}>
      <body>
        <AlertProvider>
          <I18nProvider>
            <PlatformProvider>
              <SiteContentProvider>
                {children}
              </SiteContentProvider>
            </PlatformProvider>
          </I18nProvider>
        </AlertProvider>
      </body>
    </html>
  );
}
