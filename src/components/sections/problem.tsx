import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { AlertTriangle, HelpCircle, FileText } from "lucide-react"

export function Problem() {
    return (
        <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-muted/30 px-4 sm:px-6">
            <div className="container max-w-7xl mx-auto">
                <div className="mx-auto max-w-2xl text-center mb-8 sm:mb-12 md:mb-16">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight px-4">
                        PCF 계산, 왜 이렇게 어려울까요?
                    </h2>
                    <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground px-4">
                        많은 기업들이 탄소발자국 계산을 시작하기도 전에 포기합니다.
                    </p>
                </div>
                <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="bg-background/50 backdrop-blur border-border/50">
                        <CardHeader>
                            <HelpCircle className="h-10 w-10 text-primary mb-4" />
                            <CardTitle>어디까지 포함해야 할까?</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                System Boundary 설정이 가장 어렵습니다. Cradle-to-Gate? Gate-to-Gate?
                                기준을 잡기 어렵습니다.
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-background/50 backdrop-blur border-border/50">
                        <CardHeader>
                            <AlertTriangle className="h-10 w-10 text-accent mb-4" />
                            <CardTitle>배출계수는 뭘 써야 해?</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Ecoinvent, Gabi, 국가 LCI DB... 수많은 데이터베이스 중
                                우리 제품에 맞는 계수를 찾기 힘듭니다.
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-background/50 backdrop-blur border-border/50">
                        <CardHeader>
                            <FileText className="h-10 w-10 text-secondary mb-4" />
                            <CardTitle>보고서는 어떻게?</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                고객사가 ISO 14067 기준 보고서를 요구하는데,
                                어떤 형식으로 작성해야 할지 막막합니다.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    )
}
