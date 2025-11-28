"use client"

import { ArrowRight, CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"

const steps = [
    {
        id: "01",
        title: "Product & Boundary",
        description: "어떤 제품을, 어느 단계까지(Cradle-to-Gate 등) 계산할지 정의합니다.",
        image: "/images/step-1.png",
    },
    {
        id: "02",
        title: "Activity Data",
        description: "원자재 사용량, 에너지 소비량, 운송 거리 등 활동 데이터를 입력합니다.",
        image: "/images/step-2.png",
    },
    {
        id: "03",
        title: "Emission Factor",
        description: "입력된 데이터에 맞는 표준 배출계수를 매칭하거나 자체 계수를 적용합니다.",
        image: "/images/step-3.png",
    },
    {
        id: "04",
        title: "Result & Report",
        description: "제품별 탄소발자국(kg CO₂e) 결과와 데이터 품질 분석 리포트를 확인합니다.",
        image: "/images/step-4.png",
    },
]

export function HowItWorks() {
    return (
        <section id="how-it-works" className="py-20 overflow-hidden bg-muted/10">
            <div className="container">
                <div className="mx-auto max-w-2xl text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-3xl font-bold tracking-tight sm:text-4xl"
                    >
                        ISO 14067 계산 프로세스
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mt-4 text-lg text-muted-foreground"
                    >
                        복잡한 과정을 4단계로 단순화하여 안내해 드립니다.
                    </motion.p>
                </div>
                <div className="grid gap-8 md:grid-cols-4">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="relative flex flex-col items-center text-center group"
                        >
                            <div className="mb-6 relative w-full aspect-square max-w-[200px] rounded-2xl overflow-hidden bg-background border border-border/50 shadow-lg transition-transform duration-300 group-hover:scale-105">
                                <Image
                                    src={step.image}
                                    alt={step.title}
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute top-2 left-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/90 text-primary-foreground font-bold text-sm">
                                    {step.id}
                                </div>
                            </div>

                            <h3 className="mb-2 text-xl font-bold">{step.title}</h3>
                            <p className="text-muted-foreground text-sm">{step.description}</p>

                            {index < steps.length - 1 && (
                                <div className="hidden md:block absolute top-[100px] -right-[50%] w-full h-[2px] bg-gradient-to-r from-transparent via-border to-transparent z-[-1]" />
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
