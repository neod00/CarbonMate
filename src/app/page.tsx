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
        <section id="calculator" className="py-20 bg-muted/30">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Start Your PCF Calculation
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
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
