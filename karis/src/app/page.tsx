import AboutSection from "@/components/LandingPage/AboutSection";
import ContactSection from "@/components/LandingPage/ContactSection";
import FeaturesSection from "@/components/LandingPage/FeaturesSection";
import Footer from "@/components/LandingPage/Footer";
import HeroSection from "@/components/LandingPage/HeroSection";
import Navbar from "@/components/LandingPage/Navbar";

export default function Home() {
  return (
    <>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <HeroSection />
          <FeaturesSection />
          <AboutSection />
          <ContactSection />
        </main>
        <Footer />
      </div>
    </>
  );
}
