import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Hero } from "@/components/sections/hero"
import { Problem } from "@/components/sections/problem"
import { HowItWorks } from "@/components/sections/how-it-works"
import { CTA } from "@/components/sections/cta"
import { FAQ } from "@/components/sections/faq"
import { CalculatorWizard } from "@/components/calculator/wizard"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <Problem />
        <HowItWorks />
        <section id="calculator" className="py-12 sm:py-16 md:py-20 lg:py-24 bg-muted/30 px-4 sm:px-6">
          <div className="container max-w-7xl mx-auto">
            <div className="mx-auto max-w-2xl text-center mb-8 sm:mb-12 px-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
                Start Your PCF Calculation
              </h2>
              <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground">
                Follow the steps below to estimate your product's carbon footprint.
              </p>
            </div>
            <CalculatorWizard />
          </div>
        </section>
        <CTA />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
