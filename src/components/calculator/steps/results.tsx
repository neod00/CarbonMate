"use client"

import { useState } from "react"
import { usePCFStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertTriangle, Info, FileText, Leaf, Flame, Plane, TrendingDown, Shield, CheckCircle2, Scale, Recycle, FileDown } from "lucide-react"
import { ReportPreview } from "../report-preview"
import {
    LIMITATION_SINGLE_IMPACT,
    METHODOLOGY_LIMITATIONS,
    getApplicableLimitations,
    EMISSION_FACTOR_SOURCES,
    GHG_LIST
} from "@/lib/iso14067-constants"
import {
    DQI_LEVEL_LABELS,
    DataQualityLevel
} from "@/lib/data-quality"
import {
    getEmissionFactorById,
    getDefaultElectricityFactor,
    getDefaultTransportFactor,
    ELECTRICITY_EMISSION_FACTORS,
    TRANSPORT_EMISSION_FACTORS,
    MATERIAL_EMISSION_FACTORS,
    EOL_EMISSION_FACTORS
} from "@/lib/emission-factors"
import {
    MULTI_OUTPUT_ALLOCATION_METHODS,
    RECYCLING_ALLOCATION_METHODS,
    calculateCutOffAllocation,
    calculateSubstitutionAllocation,
    calculatePEFCircularFootprint
} from "@/lib/allocation"

// =============================================================================
// 단계별 라벨
// =============================================================================

const STAGE_LABELS: Record<string, string> = {
    raw_materials: '원료 채취 (Raw Materials)',
    manufacturing: '제조 (Manufacturing)',
    transport: '운송 (Transport)',
    packaging: '포장 (Packaging)',
    use: '사용 (Use Phase)',
    eol: '폐기 (End-of-Life)'
}

// =============================================================================
// 메인 컴포넌트
// =============================================================================

export function ResultsStep() {
    const { 
        productInfo, 
        stages, 
        activityData, 
        dataQualityMeta,
        multiOutputAllocation,
        recyclingAllocation
    } = usePCFStore()
    
    // 보고서 미리보기 상태
    const [showReportPreview, setShowReportPreview] = useState(false)

    // =========================================================================
    // 배출량 계산 로직 (ISO 14067 6.4, 6.5 준수)
    // =========================================================================

    interface StageEmissionResult {
        total: number
        fossil: number
        biogenic: number
        aircraft: number
        uncertainty: number
        details: { 
            source: string
            value: number
            type: string
            emissionFactor: string
            quantity: number
            unit: string
        }[]
    }

    const calculateStageEmission = (stageId: string): StageEmissionResult => {
        const result: StageEmissionResult = {
            total: 0,
            fossil: 0,
            biogenic: 0,
            aircraft: 0,
            uncertainty: 0,
            details: []
        }

        switch (stageId) {
            case 'raw_materials': {
                const weight = activityData['raw_material_weight'] || 0
                const materialId = activityData['material_type'] || 'material_steel_primary'
                const factor = MATERIAL_EMISSION_FACTORS.find(f => f.id === materialId)
                    || MATERIAL_EMISSION_FACTORS.find(f => f.id === 'material_steel_primary')!

                if (weight > 0 && factor) {
                    const emission = weight * factor.value
                    result.total += emission

                    if (factor.sourceType === 'fossil') {
                        result.fossil += emission
                    } else if (factor.sourceType === 'biogenic') {
                        result.biogenic += emission
                    } else {
                        result.fossil += emission * 0.5
                        result.biogenic += emission * 0.5
                    }

                    result.uncertainty = factor.uncertainty
                    result.details.push({
                        source: factor.nameKo,
                        value: emission,
                        type: factor.sourceType,
                        emissionFactor: `${factor.value} ${factor.unit}`,
                        quantity: weight,
                        unit: 'kg'
                    })
                }
                break
            }

            case 'manufacturing': {
                // 전력
                const electricity = activityData['electricity'] || 0
                const gridId = activityData['electricity_grid'] || 'electricity_korea_grid_2023'
                const gridFactor = ELECTRICITY_EMISSION_FACTORS.find(f => f.id === gridId)
                    || getDefaultElectricityFactor()

                if (electricity > 0 && gridFactor) {
                    const emission = electricity * gridFactor.value
                    result.total += emission
                    result.fossil += emission
                    result.uncertainty = Math.max(result.uncertainty, gridFactor.uncertainty)
                    result.details.push({
                        source: '전력',
                        value: emission,
                        type: 'fossil',
                        emissionFactor: `${gridFactor.value} ${gridFactor.unit}`,
                        quantity: electricity,
                        unit: 'kWh'
                    })
                }

                // 천연가스
                const gas = activityData['gas'] || 0
                if (gas > 0) {
                    const gasEmission = gas * 0.0561 // IPCC
                    result.total += gasEmission
                    result.fossil += gasEmission
                    result.details.push({
                        source: '천연가스',
                        value: gasEmission,
                        type: 'fossil',
                        emissionFactor: '0.0561 kgCO2e/MJ',
                        quantity: gas,
                        unit: 'MJ'
                    })
                }

                // 경유
                const diesel = activityData['diesel'] || 0
                if (diesel > 0) {
                    const dieselEmission = diesel * 2.68 // IPCC
                    result.total += dieselEmission
                    result.fossil += dieselEmission
                    result.details.push({
                        source: '경유',
                        value: dieselEmission,
                        type: 'fossil',
                        emissionFactor: '2.68 kgCO2e/L',
                        quantity: diesel,
                        unit: 'L'
                    })
                }
                break
            }

            case 'transport': {
                const weight = activityData['transport_weight'] || 0
                const distance = activityData['transport_distance'] || 0
                const mode = activityData['transport_mode'] || 'truck'

                if (weight > 0 && distance > 0) {
                    const tkm = (weight * distance) / 1000 // ton-km

                    // 운송 모드별 배출계수
                    let transportFactor = getDefaultTransportFactor()
                    if (mode === 'rail') {
                        transportFactor = TRANSPORT_EMISSION_FACTORS.find(f => f.id === 'transport_rail_freight')!
                    } else if (mode === 'ship') {
                        transportFactor = TRANSPORT_EMISSION_FACTORS.find(f => f.id === 'transport_ship_container')!
                    } else if (mode === 'aircraft') {
                        transportFactor = TRANSPORT_EMISSION_FACTORS.find(f => f.id === 'transport_aircraft_cargo')!
                    }

                    const emission = tkm * transportFactor.value
                    result.total += emission

                    if (mode === 'aircraft') {
                        result.aircraft += emission
                    }
                    result.fossil += emission
                    result.uncertainty = Math.max(result.uncertainty, transportFactor.uncertainty)

                    result.details.push({
                        source: transportFactor.nameKo,
                        value: emission,
                        type: 'fossil',
                        emissionFactor: `${transportFactor.value} ${transportFactor.unit}`,
                        quantity: tkm,
                        unit: 'tkm'
                    })
                }

                // 항공 운송 (별도 입력, ISO 14067 7.2 e)
                const aircraftWeight = activityData['aircraft_transport_weight'] || 0
                const aircraftDistance = activityData['aircraft_transport_distance'] || 0
                if (aircraftWeight > 0 && aircraftDistance > 0) {
                    const aircraftTkm = (aircraftWeight * aircraftDistance) / 1000
                    const aircraftFactor = TRANSPORT_EMISSION_FACTORS.find(f => f.id === 'transport_aircraft_cargo')!
                    const aircraftEmission = aircraftTkm * aircraftFactor.value

                    result.total += aircraftEmission
                    result.fossil += aircraftEmission
                    result.aircraft += aircraftEmission

                    result.details.push({
                        source: '항공 운송',
                        value: aircraftEmission,
                        type: 'fossil',
                        emissionFactor: `${aircraftFactor.value} ${aircraftFactor.unit}`,
                        quantity: aircraftTkm,
                        unit: 'tkm'
                    })
                }
                break
            }

            case 'packaging': {
                const weight = activityData['packaging_weight'] || 0
                const materialId = activityData['packaging_material'] || 'material_paper_cardboard'
                const factor = MATERIAL_EMISSION_FACTORS.find(f => f.id === materialId)
                    || MATERIAL_EMISSION_FACTORS.find(f => f.id === 'material_paper_cardboard')!

                if (weight > 0 && factor) {
                    const emission = weight * factor.value
                    result.total += emission

                    if (factor.sourceType === 'fossil') {
                        result.fossil += emission
                    } else if (factor.sourceType === 'biogenic') {
                        result.biogenic += emission
                    } else {
                        result.fossil += emission * 0.5
                        result.biogenic += emission * 0.5
                    }

                    result.uncertainty = factor.uncertainty
                    result.details.push({
                        source: factor.nameKo,
                        value: emission,
                        type: factor.sourceType,
                        emissionFactor: `${factor.value} ${factor.unit}`,
                        quantity: weight,
                        unit: 'kg'
                    })
                }
                break
            }

            case 'use': {
                const electricity = activityData['use_electricity'] || 0
                const gridFactor = getDefaultElectricityFactor()

                if (electricity > 0) {
                    const emission = electricity * gridFactor.value
                    result.total += emission
                    result.fossil += emission
                    result.uncertainty = gridFactor.uncertainty

                    result.details.push({
                        source: '사용 중 전력',
                        value: emission,
                        type: 'fossil',
                        emissionFactor: `${gridFactor.value} ${gridFactor.unit}`,
                        quantity: electricity,
                        unit: 'kWh'
                    })
                }
                break
            }

            case 'eol': {
                const wasteWeight = activityData['waste_weight'] || 0
                
                // 재활용 할당 설정에서 파라미터 가져오기
                const recyclingRateFromAllocation = recyclingAllocation.recyclabilityOutput
                const recycledContentInput = recyclingAllocation.recycledContentInput
                const recyclingMethod = recyclingAllocation.method
                const qualityFactor = recyclingAllocation.qualityFactorOutput || 1

                // 활동 데이터 또는 할당 설정에서 재활용률 사용
                const recyclingRate = recyclingRateFromAllocation > 0 
                    ? recyclingRateFromAllocation 
                    : (activityData['recycling_rate'] || 0) / 100

                if (wasteWeight > 0) {
                    const disposalFactor = EOL_EMISSION_FACTORS.find(f => f.id === 'eol_landfill_mixed')!
                    const recyclingFactor = EOL_EMISSION_FACTORS.find(f => f.id === 'eol_recycling_metal')!
                    const virginFactor = 2.0 // 버진 원료 배출계수 (kg CO2e/kg)

                    // 재활용 할당 방법에 따른 계산
                    switch (recyclingMethod) {
                        case 'cut_off': {
                            // Cut-off: 재활용 크레딧 없음, 폐기만 계산
                            const disposalWeight = wasteWeight * (1 - recyclingRate)
                            const disposalEmission = disposalWeight * disposalFactor.value

                            result.total += disposalEmission
                            result.fossil += disposalEmission * 0.5
                            result.biogenic += disposalEmission * 0.5

                            result.details.push({
                                source: `매립/소각 (Cut-off)`,
                                value: disposalEmission,
                                type: 'mixed',
                                emissionFactor: `${disposalFactor.value} ${disposalFactor.unit}`,
                                quantity: disposalWeight,
                                unit: 'kg'
                            })
                            break
                        }

                        case 'substitution': {
                            // Substitution: 재활용으로 회피된 생산 크레딧 부여
                            const disposalWeight = wasteWeight * (1 - recyclingRate)
                            const disposalEmission = disposalWeight * disposalFactor.value
                            const recyclingWeight = wasteWeight * recyclingRate
                            const avoidedEmission = recyclingWeight * virginFactor * qualityFactor // 크레딧

                            result.total += disposalEmission - avoidedEmission
                            result.fossil += (disposalEmission - avoidedEmission) * 0.5
                            result.biogenic += (disposalEmission - avoidedEmission) * 0.5

                            result.details.push({
                                source: '매립/소각',
                                value: disposalEmission,
                                type: 'mixed',
                                emissionFactor: `${disposalFactor.value} ${disposalFactor.unit}`,
                                quantity: disposalWeight,
                                unit: 'kg'
                            })

                            if (recyclingRate > 0) {
                                result.details.push({
                                    source: `재활용 대체 크레딧 (Q=${qualityFactor})`,
                                    value: -avoidedEmission,
                                    type: 'credit',
                                    emissionFactor: `-${virginFactor * qualityFactor} kgCO2e/kg`,
                                    quantity: recyclingWeight,
                                    unit: 'kg'
                                })
                            }
                            break
                        }

                        case 'fifty_fifty': {
                            // 50:50: 절반씩 분배
                            const disposalWeight = wasteWeight * (1 - recyclingRate)
                            const disposalEmission = 0.5 * disposalWeight * disposalFactor.value
                            const recyclingWeight = wasteWeight * recyclingRate
                            const recyclingCredit = 0.5 * recyclingWeight * recyclingFactor.value

                            result.total += disposalEmission + recyclingCredit
                            result.fossil += (disposalEmission + recyclingCredit) * 0.5
                            result.biogenic += (disposalEmission + recyclingCredit) * 0.5

                            result.details.push({
                                source: '매립/소각 (50:50)',
                                value: disposalEmission,
                                type: 'mixed',
                                emissionFactor: `0.5 × ${disposalFactor.value} ${disposalFactor.unit}`,
                                quantity: disposalWeight,
                                unit: 'kg'
                            })

                            if (recyclingRate > 0) {
                                result.details.push({
                                    source: '재활용 크레딧 (50:50)',
                                    value: recyclingCredit,
                                    type: 'credit',
                                    emissionFactor: `0.5 × ${recyclingFactor.value} ${recyclingFactor.unit}`,
                                    quantity: recyclingWeight,
                                    unit: 'kg'
                                })
                            }
                            break
                        }

                        case 'pef_formula': {
                            // PEF Circular Footprint Formula (간소화)
                            const A = 0.5 // 기본 할당 계수
                            const R1 = recycledContentInput
                            const R2 = recyclingRate
                            const R3 = 0 // 에너지 회수 (미구현)
                            const Qs = qualityFactor
                            const Qp = 1

                            // (1-R2-R3) × Ed
                            const disposalWeight = wasteWeight * (1 - R2 - R3)
                            const disposalEmission = disposalWeight * disposalFactor.value

                            // (1-A) × R2 × (Erecycling - Ev × Qs/Qp)
                            const recyclingCredit = (1 - A) * R2 * wasteWeight * (
                                Math.abs(recyclingFactor.value) - virginFactor * (Qs / Qp)
                            )

                            result.total += disposalEmission + recyclingCredit
                            result.fossil += (disposalEmission + recyclingCredit) * 0.5
                            result.biogenic += (disposalEmission + recyclingCredit) * 0.5

                            result.details.push({
                                source: '폐기 (PEF)',
                                value: disposalEmission,
                                type: 'mixed',
                                emissionFactor: `${disposalFactor.value} ${disposalFactor.unit}`,
                                quantity: disposalWeight,
                                unit: 'kg'
                            })

                            result.details.push({
                                source: '재활용 조정 (PEF CFF)',
                                value: recyclingCredit,
                                type: recyclingCredit < 0 ? 'credit' : 'mixed',
                                emissionFactor: 'PEF Formula',
                                quantity: wasteWeight * R2,
                                unit: 'kg'
                            })
                            break
                        }

                        default: {
                            // 기본 (eol_recycling 또는 기타)
                            const disposalWeight = wasteWeight * (1 - recyclingRate)
                            const disposalEmission = disposalWeight * disposalFactor.value

                            result.total += disposalEmission
                            result.fossil += disposalEmission * 0.5
                            result.biogenic += disposalEmission * 0.5

                            result.details.push({
                                source: '매립/소각',
                                value: disposalEmission,
                                type: 'mixed',
                                emissionFactor: `${disposalFactor.value} ${disposalFactor.unit}`,
                                quantity: disposalWeight,
                                unit: 'kg'
                            })

                            if (recyclingRate > 0) {
                                const recyclingWeight = wasteWeight * recyclingRate
                                const recyclingCredit = recyclingWeight * recyclingFactor.value

                                result.total += recyclingCredit
                                result.fossil += recyclingCredit

                                result.details.push({
                                    source: '재활용 크레딧',
                                    value: recyclingCredit,
                                    type: 'credit',
                                    emissionFactor: `${recyclingFactor.value} ${recyclingFactor.unit}`,
                                    quantity: recyclingWeight,
                                    unit: 'kg'
                                })
                            }
                        }
                    }

                    result.uncertainty = 50 // EOL 높은 불확실성
                }
                break
            }
        }

        return result
    }

    // 모든 단계의 배출량 계산
    const stageResults = stages.reduce((acc, stage) => {
        acc[stage] = calculateStageEmission(stage)
        return acc
    }, {} as Record<string, StageEmissionResult>)

    // 총계 계산
    const totalEmission = Object.values(stageResults).reduce((a, b) => a + b.total, 0)
    const totalFossil = Object.values(stageResults).reduce((a, b) => a + b.fossil, 0)
    const totalBiogenic = Object.values(stageResults).reduce((a, b) => a + b.biogenic, 0)
    const totalAircraft = Object.values(stageResults).reduce((a, b) => a + b.aircraft, 0)

    // 평균 불확실성 계산
    const uncertainties = Object.values(stageResults).filter(r => r.uncertainty > 0)
    const avgUncertainty = uncertainties.length > 0
        ? uncertainties.reduce((a, b) => a + b.uncertainty, 0) / uncertainties.length
        : 30

    // 적용 가능한 제한사항 가져오기
    const applicableLimitations = getApplicableLimitations(
        productInfo.boundary,
        stages,
        'secondary'
    )

    // =========================================================================
    // 렌더링
    // =========================================================================

    return (
        <div className="space-y-8">
            {/* 헤더 */}
            <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold">CFP 계산 결과</h3>
                <p className="text-muted-foreground">
                    제품: <span className="font-semibold text-foreground">
                        {productInfo.name || '미지정 제품'}
                    </span> | 기능단위: {productInfo.unit}
                </p>
                <p className="text-xs text-muted-foreground">
                    시스템 경계: {productInfo.boundary.replace(/-/g, ' → ').replace('to', '')}
                </p>
            </div>

            {/* 메인 결과 카드 */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* 총 탄소발자국 */}
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                        <CardTitle className="text-center text-primary">
                            총 탄소발자국 (CFP)
                        </CardTitle>
                        <CardDescription className="text-center">
                            ISO 14067:2018 기준
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <div className="text-5xl font-extrabold tracking-tight">
                            {totalEmission.toFixed(2)}
                            <span className="text-lg font-normal text-muted-foreground ml-2">
                                kg CO₂e
                            </span>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                            per {productInfo.unit}
                        </p>
                        <div className="mt-4 text-xs text-muted-foreground">
                            불확실성 범위: ±{avgUncertainty.toFixed(0)}%
                            <br />
                            ({(totalEmission * (1 - avgUncertainty/100)).toFixed(2)} ~ {(totalEmission * (1 + avgUncertainty/100)).toFixed(2)} kg CO₂e)
                        </div>
                    </CardContent>
                </Card>

                {/* 단계별 분해 */}
                <Card>
                    <CardHeader>
                        <CardTitle>단계별 배출량</CardTitle>
                        <CardDescription>ISO 14067 7.2 (a) 준수</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {stages.map(stage => {
                                const result = stageResults[stage]
                                const percentage = totalEmission > 0
                                    ? (result.total / totalEmission) * 100
                                    : 0

                                return (
                                    <div key={stage} className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span>{STAGE_LABELS[stage] || stage}</span>
                                            <span className="font-mono">
                                                {result.total.toFixed(2)} ({percentage.toFixed(1)}%)
                                            </span>
                                        </div>
                                        <div className="w-full h-2 bg-secondary/20 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all ${result.total < 0 ? 'bg-green-500' : 'bg-primary'}`}
                                                style={{ width: `${Math.abs(percentage)}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ISO 14067 7.2 (b)(c)(e) - 화석/생물기원/항공 GHG 분리 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        GHG 배출원 분류
                    </CardTitle>
                    <CardDescription>ISO 14067 7.2 (b)(c)(e) - 필수 분리 기록</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                            <Flame className="h-8 w-8 text-orange-500" />
                            <div>
                                <p className="text-sm text-muted-foreground">화석 GHG 배출</p>
                                <p className="text-2xl font-bold">{totalFossil.toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground">kg CO₂e</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                            <Leaf className="h-8 w-8 text-green-500" />
                            <div>
                                <p className="text-sm text-muted-foreground">생물기원 GHG 배출</p>
                                <p className="text-2xl font-bold">{totalBiogenic.toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground">kg CO₂e</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                            <Plane className="h-8 w-8 text-blue-500" />
                            <div>
                                <p className="text-sm text-muted-foreground">항공 운송 GHG</p>
                                <p className="text-2xl font-bold">{totalAircraft.toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground">kg CO₂e</p>
                            </div>
                        </div>
                    </div>
                    <p className="mt-4 text-xs text-muted-foreground">
                        * dLUC(직접 토지이용변화) 및 iLUC(간접 토지이용변화) 배출은 현재 버전에서 미지원
                    </p>
                </CardContent>
            </Card>

            {/* 데이터 품질 요약 (ISO 14067 6.3.5) */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        데이터 품질 요약
                    </CardTitle>
                    <CardDescription>ISO 14067 6.3.5 - 데이터 품질 평가 결과</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="p-4 rounded-lg bg-muted/50">
                            <p className="text-sm text-muted-foreground">데이터 유형</p>
                            <p className="text-lg font-bold mt-1">
                                {dataQualityMeta.overallType === 'primary' ? '1차 데이터' : 
                                 dataQualityMeta.overallType === 'secondary' ? '2차 데이터' : '추정'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {dataQualityMeta.overallType === 'primary' 
                                    ? '현장 특정 데이터' 
                                    : '데이터베이스 기반'}
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50">
                            <p className="text-sm text-muted-foreground">불확실성 범위</p>
                            <p className="text-lg font-bold mt-1">±{avgUncertainty.toFixed(0)}%</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {(totalEmission * (1 - avgUncertainty/100)).toFixed(1)} ~ {(totalEmission * (1 + avgUncertainty/100)).toFixed(1)} kg CO₂e
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50">
                            <p className="text-sm text-muted-foreground">기준 연도</p>
                            <p className="text-lg font-bold mt-1">{dataQualityMeta.baseYear}</p>
                            <p className="text-xs text-muted-foreground mt-1">배출계수 기준</p>
                        </div>
                    </div>
                    <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div className="text-xs text-muted-foreground">
                                <span className="font-medium text-blue-400">데이터 출처: </span>
                                {dataQualityMeta.sources.join(', ')}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 상세 계산 내역 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingDown className="h-5 w-5" />
                        상세 계산 내역
                    </CardTitle>
                    <CardDescription>사용된 배출계수 및 계산 근거</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {stages.map(stage => {
                            const result = stageResults[stage]
                            if (result.details.length === 0) return null

                            return (
                                <div key={stage} className="space-y-2">
                                    <h4 className="font-medium text-sm">{STAGE_LABELS[stage]}</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="border-b text-muted-foreground">
                                                    <th className="text-left py-1 pr-2">항목</th>
                                                    <th className="text-right py-1 px-2">수량</th>
                                                    <th className="text-right py-1 px-2">배출계수</th>
                                                    <th className="text-right py-1 pl-2">배출량</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {result.details.map((detail, idx) => (
                                                    <tr key={idx} className="border-b border-border/50">
                                                        <td className="py-1 pr-2">{detail.source}</td>
                                                        <td className="text-right py-1 px-2">
                                                            {detail.quantity.toFixed(2)} {detail.unit}
                                                        </td>
                                                        <td className="text-right py-1 px-2 text-muted-foreground">
                                                            {detail.emissionFactor}
                                                        </td>
                                                        <td className={`text-right py-1 pl-2 font-mono ${detail.value < 0 ? 'text-green-500' : ''}`}>
                                                            {detail.value.toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* 할당 설정 요약 (ISO 14067 6.4.9) */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Scale className="h-5 w-5" />
                        할당 설정 요약
                    </CardTitle>
                    <CardDescription>ISO 14067 6.4.9 - 할당 절차</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* 다중 출력 할당 */}
                        <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                            <div className="flex items-center gap-2 mb-2">
                                <Scale className="h-5 w-5 text-indigo-500" />
                                <span className="font-medium text-indigo-400">다중 출력 프로세스</span>
                            </div>
                            <p className="text-sm font-medium">
                                {MULTI_OUTPUT_ALLOCATION_METHODS[multiOutputAllocation.method].nameKo}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {MULTI_OUTPUT_ALLOCATION_METHODS[multiOutputAllocation.method].descriptionKo}
                            </p>
                            {multiOutputAllocation.coProducts.length > 0 && (
                                <p className="text-xs text-indigo-400 mt-2">
                                    공동 제품: {multiOutputAllocation.coProducts.length}개
                                </p>
                            )}
                            {multiOutputAllocation.justification && (
                                <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-indigo-500/20">
                                    <span className="font-medium">정당화:</span> {multiOutputAllocation.justification}
                                </p>
                            )}
                        </div>

                        {/* 재활용 할당 */}
                        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                            <div className="flex items-center gap-2 mb-2">
                                <Recycle className="h-5 w-5 text-green-500" />
                                <span className="font-medium text-green-400">재사용/재활용</span>
                            </div>
                            <p className="text-sm font-medium">
                                {RECYCLING_ALLOCATION_METHODS[recyclingAllocation.method].nameKo}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {recyclingAllocation.loopType === 'closed_loop' ? '폐쇄 루프' : '개방 루프'}
                            </p>
                            <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                <div>
                                    <span className="text-muted-foreground">재활용 투입:</span>
                                    <span className="ml-1 font-mono">{(recyclingAllocation.recycledContentInput * 100).toFixed(0)}%</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">재활용 산출:</span>
                                    <span className="ml-1 font-mono">{(recyclingAllocation.recyclabilityOutput * 100).toFixed(0)}%</span>
                                </div>
                            </div>
                            {recyclingAllocation.justification && (
                                <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-green-500/20">
                                    <span className="font-medium">정당화:</span> {recyclingAllocation.justification}
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 데이터 품질 및 갭 경고 */}
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold text-yellow-500">데이터 품질 및 갭</h4>
                        <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside space-y-1">
                            <li>
                                사용된 배출계수는 2차 데이터(Secondary Data)입니다.
                                실제 공급망 1차 데이터(Primary Data) 사용 시 정확도가 향상됩니다.
                            </li>
                            {productInfo.boundary === 'cradle-to-gate' && (
                                <li>
                                    Cradle-to-Gate 경계로 사용 및 폐기 단계는 제외되거나 참고용입니다.
                                </li>
                            )}
                            {totalEmission === 0 && (
                                <li className="text-yellow-600 font-medium">
                                    입력된 데이터가 없어 결과가 0입니다. 이전 단계에서 데이터를 입력해주세요.
                                </li>
                            )}
                            <li>
                                배출계수 출처: {EMISSION_FACTOR_SOURCES.korea_lci.name} ({EMISSION_FACTOR_SOURCES.korea_lci.year}),
                                {' '}{EMISSION_FACTOR_SOURCES.ipcc.name}, {EMISSION_FACTOR_SOURCES.glec.name}
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* ISO 14067 Annex A - 제한사항 */}
            <Card className="border-blue-500/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-400">
                        <Info className="h-5 w-5" />
                        CFP 연구 제한사항
                    </CardTitle>
                    <CardDescription>
                        ISO 14067:2018 Annex A (규정) 준수 - 모든 CFP 보고서에 명시 필수
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* A.2 단일 환경 영향 */}
                    <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                        <h5 className="font-medium text-sm text-blue-400">
                            {LIMITATION_SINGLE_IMPACT.title}
                        </h5>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {LIMITATION_SINGLE_IMPACT.description}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground/60">
                            참조: {LIMITATION_SINGLE_IMPACT.isoReference}
                        </p>
                    </div>

                    {/* A.3 방법론 제한사항 */}
                    <div className="space-y-2">
                        <h5 className="font-medium text-sm">방법론 관련 제한사항</h5>
                        <div className="grid gap-2 md:grid-cols-2">
                            {applicableLimitations.slice(0, 6).map((limitation) => (
                                <div
                                    key={limitation.id}
                                    className="p-2 rounded border border-border/50 bg-muted/30"
                                >
                                    <p className="text-xs font-medium">{limitation.title}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {limitation.description.slice(0, 100)}...
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 고려된 GHG 목록 (7.3 e) */}
                    <div className="pt-2 border-t border-border/50">
                        <h5 className="font-medium text-sm mb-2">고려된 온실가스 (ISO 14067 7.3 e)</h5>
                        <div className="flex flex-wrap gap-2">
                            {GHG_LIST.slice(0, 4).map((ghg) => (
                                <span
                                    key={ghg.formula}
                                    className="px-2 py-1 text-xs rounded-full bg-muted"
                                >
                                    {ghg.formula} ({ghg.name})
                                </span>
                            ))}
                            <span className="px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground">
                                +{GHG_LIST.length - 4} more
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 보고서 생성 버튼 */}
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5">
                <CardContent className="py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-lg">ISO 14067 준수 보고서</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                CFP 연구 보고서를 생성하여 HTML, Markdown, JSON 형식으로 내보내세요.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowReportPreview(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl hover:from-primary/90 hover:to-purple-700 transition-all font-medium shadow-lg shadow-primary/25"
                        >
                            <FileDown className="w-5 h-5" />
                            보고서 생성
                        </button>
                    </div>
                </CardContent>
            </Card>

            {/* 푸터 메타데이터 */}
            <div className="text-center text-xs text-muted-foreground space-y-1">
                <p>계산 기준: ISO 14067:2018 | GWP: IPCC AR6 (100년 기준)</p>
                <p>본 결과는 스크리닝 목적의 추정치이며, 공식 CFP 인증을 대체하지 않습니다.</p>
            </div>

            {/* 보고서 미리보기 모달 */}
            <ReportPreview
                isOpen={showReportPreview}
                onClose={() => setShowReportPreview(false)}
                calculatedResults={{
                    totalCFP: totalEmission,
                    fossilEmissions: totalFossil,
                    biogenicEmissions: totalBiogenic,
                    aircraftEmissions: totalAircraft,
                    dlucEmissions: 0,
                    stageBreakdown: stages.map(stage => {
                        const result = stageResults[stage]
                        return {
                            stage: STAGE_LABELS[stage] || stage,
                            stageKo: STAGE_LABELS[stage]?.split(' ')[0] || stage,
                            emission: result.total,
                            percentage: totalEmission > 0 ? (result.total / totalEmission) * 100 : 0
                        }
                    }),
                    uncertainty: avgUncertainty
                }}
            />
        </div>
    )
}
