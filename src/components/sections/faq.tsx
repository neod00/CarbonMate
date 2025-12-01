import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

export function FAQ() {
    return (
        <section id="faq" className="py-12 sm:py-16 md:py-20 lg:py-24 bg-muted/30 px-4 sm:px-6">
            <div className="container max-w-3xl mx-auto">
                <div className="text-center mb-8 sm:mb-12">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">자주 묻는 질문</h2>
                </div>
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>이 계산기는 ISO 14067을 준수하나요?</AccordionTrigger>
                        <AccordionContent>
                            네, ISO 14067:2018 표준의 4단계 절차(목표 및 범위 정의, 목록 분석, 영향 평가, 결과 해석)를 기반으로 설계되었습니다. 다만, 이 웹 도구는 약식 계산기이므로 제3자 검증을 위한 공식 보고서로 사용하기 위해서는 전문가의 상세 검토가 필요합니다.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <AccordionTrigger>LCA 소프트웨어와 무엇이 다른가요?</AccordionTrigger>
                        <AccordionContent>
                            기존 LCA 소프트웨어(SimaPro, Gabi 등)는 전문가용으로 매우 복잡하고 비쌉니다. 이 도구는 비전문가도 쉽게 제품 탄소발자국을 추정할 수 있도록 UX를 단순화하고, 필수적인 데이터만 입력받도록 설계된 '입문용/진단용' 도구입니다.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                        <AccordionTrigger>데이터는 어디에 저장되나요?</AccordionTrigger>
                        <AccordionContent>
                            현재 버전에서는 입력하신 데이터가 브라우저 내에서만 처리되며 서버에 저장되지 않습니다. 결과 리포트를 인쇄하거나 PDF로 저장하여 보관하시기 바랍니다.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-4">
                        <AccordionTrigger>CBAM 대응도 가능한가요?</AccordionTrigger>
                        <AccordionContent>
                            CBAM(탄소국경조정제도)은 별도의 산정 방식과 리포팅 양식을 요구합니다. 이 도구의 결과값은 CBAM 배출량 산정의 기초 자료로 활용될 수 있으나, CBAM 전용 리포팅을 위해서는 추가적인 컨설팅이 필요합니다.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-5">
                        <AccordionTrigger>모바일이나 태블릿에서도 사용할 수 있나요?</AccordionTrigger>
                        <AccordionContent>
                            네, CarbonMate는 모바일, 태블릿, 데스크톱 모든 기기에서 최적화된 반응형 디자인으로 제공됩니다. 스마트폰에서도 쉽게 제품 탄소발자국을 계산하고 결과를 확인할 수 있습니다.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-6">
                        <AccordionTrigger>무료로 사용할 수 있나요?</AccordionTrigger>
                        <AccordionContent>
                            네, CarbonMate는 완전 무료로 제공됩니다. 사용을 위해서는 회원가입이 필요하며, 별도의 결제 없이 바로 사용하실 수 있습니다. 전문가 검증이나 상세 컨설팅이 필요한 경우에만 별도 문의를 통해 서비스를 제공합니다.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-7">
                        <AccordionTrigger>계산 결과 보고서는 어떤 형식으로 받을 수 있나요?</AccordionTrigger>
                        <AccordionContent>
                            계산 완료 후 ISO 14067 준수 보고서를 HTML, Markdown, JSON 형식으로 내보낼 수 있습니다. 브라우저의 인쇄 기능을 사용하여 PDF로 저장하거나 인쇄할 수도 있습니다.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </section>
    )
}
