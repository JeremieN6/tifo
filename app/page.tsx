import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import ExemplesSection from '@/components/ExemplesSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import BenefitsSection from '@/components/BenefitsSection';
import FeaturesSection from '@/components/FeaturesSection';
import PricingSection from '@/components/PricingSection';
import FAQSection from '@/components/FAQSection';
import CTASection from '@/components/CTASection';
import FooterSection from '@/components/FooterSection';

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-[#020f07] pitch-lines scanlines">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0" />
      <Navbar />
      <main>
        <HeroSection />
        <ExemplesSection />
        <HowItWorksSection />
        <BenefitsSection />
        <FeaturesSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <FooterSection />
    </div>
  );
}
