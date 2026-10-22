import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./dashboard.css";
import "./workspace-theme.css";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import QueryProviders from "@/providers/QueryProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { Toaster } from "sonner";

// Use the supplied fonts locally, without downloading fonts at build time.
const roboto = localFont({
  src: [
    { path: "../../public/fonts/Roboto-VariableFont_wdth,wght.ttf", weight: "100 900", style: "normal" },
    { path: "../../public/fonts/Roboto-Italic-VariableFont_wdth,wght.ttf", weight: "100 900", style: "italic" },
  ],
  variable: "--font-roboto",
  display: "swap",
});

const bebasNeue = localFont({
  src: "../../public/fonts/BebasNeue-Regular.ttf",
  weight: "400",
  variable: "--font-bebas",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Hand-in — A little progress, shared.", template: "%s · Hand-in" },
  description: "A thoughtful space to submit your projects, get feedback, and keep growing.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Browser extensions may add attributes to html before React hydrates it.
  // Suppress only this root element's mismatch; child components still report theirs.
  return <html lang="en" suppressHydrationWarning><body className={`${roboto.variable} ${bebasNeue.variable}`}>
    <ThemeProvider><QueryProviders><AuthProvider initialUser={null}><TooltipProvider delayDuration={250}>
      {children}
      <Toaster position="bottom-right" richColors closeButton />
    </TooltipProvider></AuthProvider></QueryProviders></ThemeProvider>
  </body></html>;
}
