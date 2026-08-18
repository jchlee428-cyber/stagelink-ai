import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import HeroSection from './components/HeroSection';
import StatsSection from './components/StatsSection';
import HowItWorksSection from './components/HowItWorksSection';
import AiMatchingSection from './components/AiMatchingSection';
import FeaturedPerformersSection from './components/FeaturedPerformersSection';
import TestimonialsSection from './components/TestimonialsSection';
import AudienceSection from './components/AudienceSection';
import FaqSection from './components/FaqSection';
import CtaSection from './components/CtaSection';

export default function Home() {
  return (
    <div className="min-h-screen bg-background-50">
      <Navbar />
      <main>
        <HeroSection />
        <StatsSection />
        <HowItWorksSection />
        <AiMatchingSection />
        <FeaturedPerformersSection />
        <TestimonialsSection />
        <AudienceSection />
        <FaqSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}