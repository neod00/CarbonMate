"use client"

import { usePCFStore, TransportMode } from "@/lib/store"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Info, Zap, Truck, Package, Recycle, Factory, Leaf } from "lucide-react"
import {
    ELECTRICITY_EMISSION_FACTORS,
    TRANSPORT_EMISSION_FACTORS,
    MATERIAL_EMISSION_FACTORS,
    getMaterialFactorsByCategory,
    getTransportFactorsByMode
} from "@/lib/emission-factors"

// =============================================================================
// 단계별 아이콘 및 라벨
// =============================================================================

const STAGE_CONFIG = {
    raw_materials: {
        icon: Package,
        label: '원료 채취 (Raw Materials)',
        description: '원자재 생산 및 전처리 과정의 배출'
    },
    manufacturing: {
        icon: Factory,
        label: '제조 (Manufacturing)',
        description: '공장 내 에너지 사용 및 공정 배출'
    },
    transport: {
        icon: Truck,
        label: '운송 (Transport)',
        description: '원료 운송 및 제품 배송'
    },
    packaging: {
        icon: Package,
        label: '포장 (Packaging)',
        description: '포장재 생산 및 폐기'
    },
    use: {
        icon: Zap,
        label: '사용 (Use Phase)',
        description: '제품 사용 중 에너지 소비'
    },
    eol: {
        icon: Recycle,
        label: '폐기 (End-of-Life)',
        description: '제품 폐기 및 재활용'
    }
}

// =============================================================================
// 메인 컴포넌트
// =============================================================================

export function ActivityDataStep() {
    const { 
        stages, 
        activityData, 
        setActivityData, 
        setTransportMode, 
        setElectricityGrid,
        productInfo 
    } = usePCFStore()

    // 원자재 카테고리별 그룹
    const materialCategories = getMaterialFactorsByCategory()

    return (
        <div className="space-y-8">
            {/* 헤더 */}
            <div className="space-y-2">
                <h3 className="text-lg font-medium">활동 데이터 입력</h3>
                <p className="text-sm text-muted-foreground">
                    선택한 단계별 활동 데이터를 입력해주세요. 
                    배출계수는 자동으로 적용되며, 필요 시 변경할 수 있습니다.
                </p>
            </div>

            {stages.length === 0 && (
                <div className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10">
                    <p className="text-muted-foreground">
                        선택된 단계가 없습니다. 이전 단계로 돌아가 단계를 선택해주세요.
                    </p>
                </div>
            )}

            {/* 단계별 입력 폼 */}
            {stages.map((stageId) => {
                const config = STAGE_CONFIG[stageId as keyof typeof STAGE_CONFIG]
                if (!config) return null

                const Icon = config.icon

                return (
                    <Card key={stageId} className="border-border/50">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-3 text-lg">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Icon className="h-5 w-5 text-primary" />
                                </div>
                                {config.label}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                {config.description}
                            </p>
                        </CardHeader>
                        <CardContent>
                            {renderStageInputs(stageId, activityData, setActivityData, setTransportMode, setElectricityGrid)}
                        </CardContent>
                    </Card>
                )
            })}

            {/* 데이터 품질 안내 */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-blue-400 mb-1">데이터 품질 안내</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>기본 배출계수는 2차 데이터(Secondary Data)입니다.</li>
                        <li>더 정확한 결과를 위해 실제 공급망 데이터를 사용하세요.</li>
                        <li>불확실성 범위는 결과 페이지에서 확인할 수 있습니다.</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

// =============================================================================
// 단계별 입력 폼 렌더링
// =============================================================================

function renderStageInputs(
    stageId: string,
    activityData: Record<string, any>,
    setActivityData: (id: string, value: number) => void,
    setTransportMode: (mode: TransportMode) => void,
    setElectricityGrid: (grid: string) => void
) {
    switch (stageId) {
        case 'raw_materials':
            return <RawMaterialsInputs activityData={activityData} setActivityData={setActivityData} />
        case 'manufacturing':
            return <ManufacturingInputs 
                activityData={activityData} 
                setActivityData={setActivityData}
                setElectricityGrid={setElectricityGrid}
            />
        case 'transport':
            return <TransportInputs 
                activityData={activityData} 
                setActivityData={setActivityData}
                setTransportMode={setTransportMode}
            />
        case 'packaging':
            return <PackagingInputs activityData={activityData} setActivityData={setActivityData} />
        case 'use':
            return <UsePhaseInputs 
                activityData={activityData} 
                setActivityData={setActivityData}
                setElectricityGrid={setElectricityGrid}
            />
        case 'eol':
            return <EndOfLifeInputs activityData={activityData} setActivityData={setActivityData} />
        default:
            return null
    }
}

// =============================================================================
// 원자재 입력
// =============================================================================

function RawMaterialsInputs({ 
    activityData, 
    setActivityData 
}: { 
    activityData: Record<string, any>
    setActivityData: (id: string, value: number) => void 
}) {
    const materialCategories = getMaterialFactorsByCategory()

    return (
        <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="raw_material_weight">총 원자재 중량 (kg)</Label>
                    <Input
                        id="raw_material_weight"
                        type="number"
                        placeholder="예: 100"
                        value={activityData['raw_material_weight'] || ''}
                        onChange={(e) => setActivityData('raw_material_weight', parseFloat(e.target.value) || 0)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="raw_material_type">주요 원자재 종류</Label>
                    <Select
                        value={activityData['raw_material_type'] || 'material_steel_primary'}
                        onValueChange={(value) => setActivityData('raw_material_type', value as any)}
                    >
                        <SelectTrigger id="raw_material_type">
                            <SelectValue placeholder="원자재 선택" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(materialCategories).map(([category, materials]) => (
                                <div key={category}>
                                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                        {category}
                                    </div>
                                    {materials.map((material) => (
                                        <SelectItem key={material.id} value={material.id}>
                                            {material.nameKo} ({material.value} {material.unit})
                                        </SelectItem>
                                    ))}
                                </div>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <p className="text-xs text-muted-foreground">
                * 여러 종류의 원자재가 있는 경우, 가장 비중이 큰 원자재를 선택하거나 평균값을 사용하세요.
            </p>
        </div>
    )
}

// =============================================================================
// 제조 입력
// =============================================================================

function ManufacturingInputs({ 
    activityData, 
    setActivityData,
    setElectricityGrid
}: { 
    activityData: Record<string, any>
    setActivityData: (id: string, value: number) => void
    setElectricityGrid: (grid: string) => void
}) {
    return (
        <div className="space-y-6">
            {/* 전력 */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">전력 소비</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="electricity">전력 사용량 (kWh)</Label>
                        <Input
                            id="electricity"
                            type="number"
                            placeholder="예: 50"
                            value={activityData['electricity'] || ''}
                            onChange={(e) => setActivityData('electricity', parseFloat(e.target.value) || 0)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="electricity_grid">전력 그리드</Label>
                        <Select
                            value={activityData['electricity_grid'] || 'electricity_korea_grid_2023'}
                            onValueChange={(value) => setElectricityGrid(value)}
                        >
                            <SelectTrigger id="electricity_grid">
                                <SelectValue placeholder="그리드 선택" />
                            </SelectTrigger>
                            <SelectContent>
                                {ELECTRICITY_EMISSION_FACTORS.map((ef) => (
                                    <SelectItem key={ef.id} value={ef.id}>
                                        {ef.nameKo} ({ef.value} {ef.unit})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* 연료 */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Factory className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">연료 소비</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="gas">천연가스 (MJ)</Label>
                        <Input
                            id="gas"
                            type="number"
                            placeholder="예: 10"
                            value={activityData['gas'] || ''}
                            onChange={(e) => setActivityData('gas', parseFloat(e.target.value) || 0)}
                        />
                        <p className="text-xs text-muted-foreground">
                            배출계수: 0.0561 kgCO₂e/MJ (IPCC)
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="diesel">경유 (L)</Label>
                        <Input
                            id="diesel"
                            type="number"
                            placeholder="예: 0"
                            value={activityData['diesel'] || ''}
                            onChange={(e) => setActivityData('diesel', parseFloat(e.target.value) || 0)}
                        />
                        <p className="text-xs text-muted-foreground">
                            배출계수: 2.68 kgCO₂e/L (IPCC)
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

// =============================================================================
// 운송 입력
// =============================================================================

function TransportInputs({ 
    activityData, 
    setActivityData,
    setTransportMode
}: { 
    activityData: Record<string, any>
    setActivityData: (id: string, value: number) => void
    setTransportMode: (mode: TransportMode) => void
}) {
    const selectedMode = (activityData['transport_mode'] as TransportMode) || 'truck'
    const modeFactors = getTransportFactorsByMode(selectedMode)

    return (
        <div className="space-y-6">
            {/* 주요 운송 */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">주요 운송</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                        <Label htmlFor="transport_mode">운송 수단</Label>
                        <Select
                            value={selectedMode}
                            onValueChange={(value) => setTransportMode(value as TransportMode)}
                        >
                            <SelectTrigger id="transport_mode">
                                <SelectValue placeholder="운송 수단 선택" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="truck">🚚 트럭 (도로)</SelectItem>
                                <SelectItem value="rail">🚂 철도</SelectItem>
                                <SelectItem value="ship">🚢 선박 (해상)</SelectItem>
                                <SelectItem value="aircraft">✈️ 항공</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="transport_distance">운송 거리 (km)</Label>
                        <Input
                            id="transport_distance"
                            type="number"
                            placeholder="예: 500"
                            value={activityData['transport_distance'] || ''}
                            onChange={(e) => setActivityData('transport_distance', parseFloat(e.target.value) || 0)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="transport_weight">운송 중량 (kg)</Label>
                        <Input
                            id="transport_weight"
                            type="number"
                            placeholder="예: 100"
                            value={activityData['transport_weight'] || ''}
                            onChange={(e) => setActivityData('transport_weight', parseFloat(e.target.value) || 0)}
                        />
                    </div>
                </div>
                {modeFactors.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                        선택된 배출계수: {modeFactors[0].nameKo} - {modeFactors[0].value} {modeFactors[0].unit}
                    </p>
                )}
            </div>

            {/* 항공 운송 (ISO 14067 7.2 e - 별도 보고 필수) */}
            {selectedMode !== 'aircraft' && (
                <div className="space-y-4 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <div className="flex items-center gap-2">
                        <span className="text-sm">✈️</span>
                        <span className="font-medium text-sm">항공 운송 (별도 입력)</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                            ISO 14067 필수 분리
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        항공 운송은 ISO 14067에 따라 별도로 보고해야 합니다.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="aircraft_transport_distance">항공 운송 거리 (km)</Label>
                            <Input
                                id="aircraft_transport_distance"
                                type="number"
                                placeholder="예: 0"
                                value={activityData['aircraft_transport_distance'] || ''}
                                onChange={(e) => setActivityData('aircraft_transport_distance', parseFloat(e.target.value) || 0)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="aircraft_transport_weight">항공 운송 중량 (kg)</Label>
                            <Input
                                id="aircraft_transport_weight"
                                type="number"
                                placeholder="예: 0"
                                value={activityData['aircraft_transport_weight'] || ''}
                                onChange={(e) => setActivityData('aircraft_transport_weight', parseFloat(e.target.value) || 0)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// =============================================================================
// 포장 입력
// =============================================================================

function PackagingInputs({ 
    activityData, 
    setActivityData 
}: { 
    activityData: Record<string, any>
    setActivityData: (id: string, value: number) => void 
}) {
    return (
        <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="packaging_weight">포장재 중량 (kg)</Label>
                    <Input
                        id="packaging_weight"
                        type="number"
                        placeholder="예: 5"
                        value={activityData['packaging_weight'] || ''}
                        onChange={(e) => setActivityData('packaging_weight', parseFloat(e.target.value) || 0)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="packaging_material">포장재 종류</Label>
                    <Select
                        value={activityData['packaging_material'] || 'material_paper_cardboard'}
                        onValueChange={(value) => setActivityData('packaging_material', value as any)}
                    >
                        <SelectTrigger id="packaging_material">
                            <SelectValue placeholder="포장재 선택" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="material_paper_cardboard">골판지 (0.89 kgCO₂e/kg)</SelectItem>
                            <SelectItem value="material_paper_kraft">크라프트지 (0.78 kgCO₂e/kg)</SelectItem>
                            <SelectItem value="material_plastic_pe">PE 필름 (1.89 kgCO₂e/kg)</SelectItem>
                            <SelectItem value="material_plastic_pp">PP (1.86 kgCO₂e/kg)</SelectItem>
                            <SelectItem value="material_wood_softwood">목재 팔레트 (0.31 kgCO₂e/kg)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    )
}

// =============================================================================
// 사용 단계 입력
// =============================================================================

function UsePhaseInputs({ 
    activityData, 
    setActivityData,
    setElectricityGrid
}: { 
    activityData: Record<string, any>
    setActivityData: (id: string, value: number) => void
    setElectricityGrid: (grid: string) => void
}) {
    return (
        <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="use_electricity">수명 기간 전력 사용량 (kWh)</Label>
                    <Input
                        id="use_electricity"
                        type="number"
                        placeholder="예: 200"
                        value={activityData['use_electricity'] || ''}
                        onChange={(e) => setActivityData('use_electricity', parseFloat(e.target.value) || 0)}
                    />
                    <p className="text-xs text-muted-foreground">
                        제품의 전체 수명 동안 예상되는 전력 소비량
                    </p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="use_years">예상 사용 기간 (년)</Label>
                    <Input
                        id="use_years"
                        type="number"
                        placeholder="예: 5"
                        value={activityData['use_years'] || ''}
                        onChange={(e) => setActivityData('use_years', parseFloat(e.target.value) || 0)}
                    />
                </div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">
                    <span className="font-medium">ISO 14067 6.3.7:</span> 사용 단계의 시나리오는 
                    실제 사용 패턴을 반영해야 하며, 제조사 권장 사용 조건과 다를 수 있습니다.
                </p>
            </div>
        </div>
    )
}

// =============================================================================
// 폐기 단계 입력
// =============================================================================

function EndOfLifeInputs({ 
    activityData, 
    setActivityData 
}: { 
    activityData: Record<string, any>
    setActivityData: (id: string, value: number) => void 
}) {
    return (
        <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="waste_weight">폐기물 중량 (kg)</Label>
                    <Input
                        id="waste_weight"
                        type="number"
                        placeholder="예: 100"
                        value={activityData['waste_weight'] || ''}
                        onChange={(e) => setActivityData('waste_weight', parseFloat(e.target.value) || 0)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="recycling_rate">재활용률 (%)</Label>
                    <Input
                        id="recycling_rate"
                        type="number"
                        placeholder="예: 30"
                        min="0"
                        max="100"
                        value={activityData['recycling_rate'] || ''}
                        onChange={(e) => setActivityData('recycling_rate', parseFloat(e.target.value) || 0)}
                    />
                    <p className="text-xs text-muted-foreground">
                        재활용되는 비율 (나머지는 소각/매립 처리)
                    </p>
                </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <Leaf className="h-4 w-4 text-green-500 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                    재활용은 1차 원자재 생산을 대체하여 배출량 크레딧을 제공합니다.
                    ISO 14067 6.4.6.3에 따라 할당됩니다.
                </p>
            </div>
        </div>
    )
}
