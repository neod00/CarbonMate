"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ProductInfoStep } from "./steps/product-info"
import { LifecycleStagesStep } from "./steps/lifecycle-stages"
import { ActivityDataStep } from "./steps/activity-data"
import { DataQualityStep } from "./steps/data-quality"
import { AllocationStep } from "./steps/allocation"
import { ResultsStep } from "./steps/results"
import { cn } from "@/lib/utils"
import { 
    Package, 
    Layers, 
    ClipboardList, 
    Shield, 
    Scale,
    BarChart3,
    ChevronLeft,
    ChevronRight,
    Printer
} from "lucide-react"

const steps = [
    { 
        id: 1, 
        title: "제품 정보", 
        titleEn: "Product Info",
        description: "제품 기본 정보 및 시스템 경계 설정",
        icon: Package,
        component: ProductInfoStep 
    },
    { 
        id: 2, 
        title: "생애주기 단계", 
        titleEn: "Lifecycle Stages",
        description: "포함할 생애주기 단계 선택",
        icon: Layers,
        component: LifecycleStagesStep 
    },
    { 
        id: 3, 
        title: "활동 데이터", 
        titleEn: "Activity Data",
        description: "단계별 활동 데이터 입력",
        icon: ClipboardList,
        component: ActivityDataStep 
    },
    { 
        id: 4, 
        title: "데이터 품질", 
        titleEn: "Data Quality",
        description: "데이터 품질 평가 및 불확실성 산정",
        icon: Shield,
        component: DataQualityStep 
    },
    { 
        id: 5, 
        title: "할당", 
        titleEn: "Allocation",
        description: "다중 출력 및 재활용 할당 설정",
        icon: Scale,
        component: AllocationStep 
    },
    { 
        id: 6, 
        title: "결과", 
        titleEn: "Results",
        description: "CFP 계산 결과 및 분석",
        icon: BarChart3,
        component: ResultsStep 
    },
]

export function CalculatorWizard() {
    const [currentStep, setCurrentStep] = React.useState(1)
    const [isClient, setIsClient] = React.useState(false)

    React.useEffect(() => {
        setIsClient(true)
    }, [])

    if (!isClient) return null

    const handleNext = () => {
        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1)
        }
    }

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    const handleStepClick = (stepId: number) => {
        // 이전 단계로만 이동 가능 (또는 현재 단계)
        if (stepId <= currentStep) {
            setCurrentStep(stepId)
        }
    }

    const currentStepData = steps[currentStep - 1]
    const CurrentComponent = currentStepData.component
    const CurrentIcon = currentStepData.icon

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* Progress Steps */}
            <div className="mb-8">
                {/* 데스크톱 뷰 */}
                <div className="hidden md:flex justify-between mb-4">
                    {steps.map((step, index) => {
                        const StepIcon = step.icon
                        const isCompleted = currentStep > step.id
                        const isCurrent = currentStep === step.id
                        const isClickable = step.id <= currentStep

                        return (
                            <div 
                                key={step.id}
                                className="flex items-center flex-1"
                            >
                                <button
                                    onClick={() => handleStepClick(step.id)}
                                    disabled={!isClickable}
                                    className={cn(
                                        "flex flex-col items-center transition-all",
                                        isClickable ? "cursor-pointer" : "cursor-not-allowed"
                                    )}
                                >
                                    <div className={cn(
                                        "flex items-center justify-center w-10 h-10 rounded-full transition-all",
                                        isCompleted 
                                            ? "bg-primary text-primary-foreground" 
                                            : isCurrent 
                                                ? "bg-primary/20 text-primary border-2 border-primary"
                                                : "bg-muted text-muted-foreground"
                                    )}>
                                        <StepIcon className="h-5 w-5" />
                                    </div>
                                    <span className={cn(
                                        "mt-2 text-xs font-medium transition-colors",
                                        isCurrent || isCompleted 
                                            ? "text-primary" 
                                            : "text-muted-foreground"
                                    )}>
                                        {step.title}
                                    </span>
                                </button>

                                {/* 연결선 */}
                                {index < steps.length - 1 && (
                                    <div className={cn(
                                        "flex-1 h-0.5 mx-2 mt-[-20px]",
                                        isCompleted ? "bg-primary" : "bg-muted"
                                    )} />
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* 모바일 뷰 */}
                <div className="md:hidden space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-primary">
                            {currentStep}. {currentStepData.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {currentStep} / {steps.length}
                        </span>
                    </div>
                </div>

                {/* 프로그레스 바 */}
                <div className="h-2 w-full bg-secondary/20 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-300 ease-in-out"
                        style={{ width: `${(currentStep / steps.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* 메인 카드 */}
            <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <CurrentIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">
                                {currentStepData.title}
                            </CardTitle>
                            <CardDescription>
                                {currentStepData.description}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="min-h-[400px]">
                    <CurrentComponent />
                </CardContent>
                <CardFooter className="flex justify-between border-t border-border/50 pt-6">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={currentStep === 1}
                        className="gap-2"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        이전
                    </Button>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {currentStep} / {steps.length}
                    </div>

                    {currentStep < steps.length ? (
                        <Button onClick={handleNext} className="gap-2">
                            다음
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button onClick={() => window.print()} className="gap-2">
                            <Printer className="h-4 w-4" />
                            보고서 인쇄
                        </Button>
                    )}
                </CardFooter>
            </Card>

            {/* 단계 설명 (하단) */}
            <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground">
                    {currentStepData.titleEn} • ISO 14067:2018 준수
                </p>
            </div>
        </div>
    )
}
