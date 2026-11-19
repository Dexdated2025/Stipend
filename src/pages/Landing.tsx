import { SiteNav } from "@/components/landing/SiteNav";
import { Hero } from "@/components/landing/Hero";
import { ProblemVisual } from "@/components/landing/ProblemVisual";
import { ProductShowcase } from "@/components/landing/ProductShowcase";
import { ScrollStory } from "@/components/landing/ScrollStory";
import { BuiltOnMarquee } from "@/components/landing/Marquee";
import { Developers } from "@/components/landing/Developers";
import { DesignPartnerSection } from "@/components/landing/DesignPartnerForm";
import { SiteFooter } from "@/components/landing/SiteFooter";

export default function Landing() {
  return (
    <div className="min-h-screen overflow-x-clip">
      <SiteNav />
      <main>
        <Hero />
        <BuiltOnMarquee />
        <ProblemVisual />
        <ProductShowcase />
        <ScrollStory />
        <Developers />
        <DesignPartnerSection />
      </main>
      <SiteFooter />
    </div>
  );
}
