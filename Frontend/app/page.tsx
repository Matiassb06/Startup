import Header from "@/components/landing/sections/Header";
import Hero from "@/components/landing/sections/Hero";
import Features from "@/components/landing/sections/Features";
import HowItWorks from "@/components/landing/sections/HowItWorks";
import Pricing from "@/components/landing/sections/Pricing";
import Contact from "@/components/landing/sections/Contact";
import CTA from "@/components/landing/sections/CTA";
import Footer from "@/components/landing/sections/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Contact />
      <CTA />
      <Footer />
    </div>
  );
}
