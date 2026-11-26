import "./globals.css";
import "./about/about.css";
import "./inquire/inquire.css";
import "./work/work.css";
import "./work/[slug]/project.css";
import "./not-found.css";
import "@/components/Model/Model.css";
import "@/components/Footer/Footer.css";
import "@/components/FluidImage/FluidImage.css";
import { Google_Sans_Flex } from "next/font/google";
import LenisProvider from "@/providers/LenisProvider";
import TransitionProvider from "@/providers/TransitionProvider";
import Background from "@/components/Background/Background";
import Nav from "@/components/Nav/Nav";
import Preloader from "@/components/Preloader/Preloader";

const sans = Google_Sans_Flex({
  subsets: ["latin"],
  axes: ["opsz"],
  adjustFontFallback: false,
  variable: "--font-sans",
  preload: false,
});

export const metadata = {
  title: "Mahee Gadhiya | MG Studio",
  description: "Independent visual identity, creative direction, and digital concept work by Mahee Gadhiya.",
  authors: [{ name: "Mahee Gadhiya" }],
};

export const viewport = {
  themeColor: "#101821",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={sans.variable}>
      <body>
        <LenisProvider>
          <TransitionProvider>
            <Background />
            <Nav />
            <Preloader />
            <div className="page">
              <main>{children}</main>
            </div>
          </TransitionProvider>
        </LenisProvider>
      </body>
    </html>
  );
}
