import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"

export function CTA() {
    return (
        <section className="py-20 border-t border-border/40 relative overflow-hidden">
            <div className="absolute inset-0 z-0">
                <Image
                    src="/images/cta-bg.png"
                    alt="Background"
                    fill
                    className="object-cover opacity-10"
                />
            </div>
            <div className="container relative z-10">
                <div className="rounded-3xl bg-primary/10 px-6 py-16 sm:px-16 md:py-24 lg:flex lg:items-center lg:justify-between lg:px-20 backdrop-blur-sm border border-primary/20">
                    <div className="max-w-xl">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-primary-foreground">
                            전문가 검증이 필요하신가요?
                        </h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            자가 진단 결과는 시작일 뿐입니다. <br />
                            실제 ISO 14067 검증 및 제3자 인증을 위한 상세 컨설팅을 받아보세요.
                        </p>
                        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                            <Input
                                type="email"
                                placeholder="이메일을 입력하세요"
                                className="bg-background/80 border-0 h-12"
                            />
                            <Button size="lg" className="h-12 px-8">
                                상담 신청하기
                            </Button>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground/60">
                            *입력하신 이메일로 PCF 가이드북을 먼저 보내드립니다.
                        </p>
                    </div>
                    <div className="mt-10 lg:mt-0 lg:flex-shrink-0">
                        {/* Optional: Add an image or illustration here */}
                    </div>
                </div>
            </div>
        </section>
    )
}
