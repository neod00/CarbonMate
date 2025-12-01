import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export function Hero() {
    return (
        <section className="relative overflow-hidden py-12 sm:py-16 md:py-24 lg:py-32 px-4 sm:px-6">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/images/hero-bg.png"
                    alt="Background"
                    fill
                    className="object-cover opacity-20"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background" />
            </div>

            <div className="container relative z-10 flex flex-col items-center text-center max-w-7xl mx-auto">
                {/* Logo */}
                <div className="mb-4 sm:mb-6">
                    <Image
                        src="/images/carbonmate-logo.png"
                        alt="CarbonMate Logo"
                        width={180}
                        height={180}
                        className="h-24 w-24 sm:h-32 sm:w-32 md:h-40 md:w-40 lg:h-52 lg:w-52"
                    />
                </div>
                
                {/* Slogan */}
                <p className="text-lg sm:text-xl md:text-2xl text-primary font-semibold tracking-wide mb-4 sm:mb-6 px-4">
                    Carbon Footprint Made Easy
                </p>
                
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 px-4">
                    ISO 14067 기준으로 <br className="hidden sm:inline" />
                    <span className="text-primary">탄소발자국</span>을 확인해보세요
                </h1>
                <p className="mt-4 sm:mt-6 max-w-[42rem] text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground px-4">
                    복잡한 LCA 소프트웨어 없이, 단계별 질문에 답하면 <br className="hidden sm:block" />
                    제품당 CO₂e 배출량과 데이터 갭을 한 눈에 보여드립니다.
                </p>
                <div className="mt-6 sm:mt-8 md:mt-10 flex flex-col gap-3 sm:gap-4 w-full sm:w-auto px-4 sm:px-0">
                    <Link href="#calculator" className="w-full sm:w-auto">
                        <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 h-12 sm:h-auto">
                            지금 바로 계산 시작하기
                        </Button>
                    </Link>
                    <Button variant="outline" size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 h-12 sm:h-auto">
                        더 알아보기
                    </Button>
                </div>
            </div>
        </section>
    )
}
