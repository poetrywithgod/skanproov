import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { CtaBand } from "@/components/sections/cta-band";
import { Ecosystem } from "@/components/sections/ecosystem";
import { Hero } from "@/components/sections/hero";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Intelligence } from "@/components/sections/intelligence";
import { Problem } from "@/components/sections/problem";
import { Verdicts } from "@/components/sections/verdicts";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <Ecosystem />
        <Verdicts />
        <Intelligence />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}
