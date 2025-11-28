import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export function Hero() {
    return (
        <section className="relative overflow-hidden py-20 md:py-32">
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

            <div className="container relative z-10 flex flex-col items-center text-center">
                {/* Logo */}
                <div className="mb-6">
                    <Image
                        src="/images/carbonmate-logo.png"
                        alt="CarbonMate Logo"
                        width={180}
                        height={180}
                        className="h-36 w-36 md:h-44 md:w-44 lg:h-52 lg:w-52"
                    />
                </div>
                
                {/* Slogan */}
                <p className="text-xl md:text-2xl text-primary font-semibold tracking-wide mb-6">
                    Carbon Footprint Made Easy
                </p>
                
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    ISO 14067 기준으로 <br className="hidden sm:inline" />
                    <span className="text-primary">탄소발자국</span>을 확인해보세요
                </h1>
                <p className="mt-6 max-w-[42rem] text-lg text-muted-foreground sm:text-xl">
                    복잡한 LCA 소프트웨어 없이, 단계별 질문에 답하면 <br />
                    제품당 CO₂e 배출량과 데이터 갭을 한 눈에 보여드립니다.
                </p>
                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                    <Link href="#calculator">
                        <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                            지금 바로 계산 시작하기
                        </Button>
                    </Link>
                    <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8">
                        더 알아보기
                    </Button>
                </div>
            </div>
        </section>
    )
}
