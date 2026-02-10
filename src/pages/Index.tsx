import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroBanner from "@/components/home/HeroBanner";
import StatsSection from "@/components/home/StatsSection";
import CategorySection from "@/components/home/CategorySection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import ScrollingBanner from "@/components/ScrollingBanner";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <ScrollingBanner />
      <main>
        <div data-aos="fade-up">
          <HeroBanner />
        </div>
        <div data-aos="fade-up" data-aos-delay="100">
          <StatsSection />
        </div>
        <div data-aos="fade-up" data-aos-delay="200">
          <CategorySection />
        </div>
        <div data-aos="fade-up" data-aos-delay="300">
          <FeaturedProducts />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
