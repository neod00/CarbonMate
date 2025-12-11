import { useEffect } from "react"
import { usePCFStore, TransportMode } from "@/lib/store"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Info, Zap, Truck, Package, Recycle, Factory, Leaf, Plus, Trash2 } from "lucide-react"
import {
    ELECTRICITY_EMISSION_FACTORS,
    TRANSPORT_EMISSION_FACTORS,
    MATERIAL_EMISSION_FACTORS,
    getMaterialFactorsByCategory,
    getTransportFactorsByMode
} from "@/lib/emission-factors"

// =============================================================================
// 유틸리티
// =============================================================================

const generateId = () => Math.random().toString(36).substr(2, 9)

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
    const {
        detailedActivityData,
        addRawMaterial,
        removeRawMaterial,
        updateRawMaterial
    } = usePCFStore()

    const materialCategories = getMaterialFactorsByCategory()
    const rawMaterials = detailedActivityData?.raw_materials || []

    const handleAddMaterial = () => {
        addRawMaterial({
            id: generateId(),
            stageId: 'raw_materials',
            name: 'New Material',
            quantity: 0,
            unit: 'kg',
            emissionSourceType: 'fossil', // 기본값
            materialType: 'material_steel_primary', // 기본값
            dataQuality: {
                type: 'secondary',
                source: '국가 LCI DB',
                year: 2023,
                geographicScope: 'Korea',
                uncertainty: 30
            }
        })
    }

    // 레거시 데이터 마이그레이션 (최초 1회, 목록이 비어있고 레거시 데이터가 있는 경우)
    useEffect(() => {
        if (rawMaterials.length === 0 && (activityData['raw_material_weight'] || 0) > 0) {
            addRawMaterial({
                id: generateId(),
                stageId: 'raw_materials',
                name: 'Legacy Material',
                quantity: activityData['raw_material_weight'],
                unit: 'kg',
                emissionSourceType: 'fossil',
                materialType: activityData['raw_material_type'] || 'material_steel_primary',
                dataQuality: {
                    type: 'secondary',
                    source: '국가 LCI DB',
                    year: 2023,
                    geographicScope: 'Korea',
                    uncertainty: 30
                }
            })
            // 레거시 데이터 초기화 (중복 방지)
            setActivityData('raw_material_weight', 0)
        }
    }, [])

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label>원자재 목록</Label>
                    <Button onClick={handleAddMaterial} size="sm" variant="outline" className="h-8 gap-2">
                        <Plus className="h-4 w-4" /> 원자재 추가
                    </Button>
                </div>

                {rawMaterials.length === 0 ? (
                    <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground bg-muted/20">
                        등록된 원자재가 없습니다. '원자재 추가' 버튼을 눌러 추가해주세요.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {rawMaterials.map((item, index) => (
                            <div key={item.id} className="grid gap-3 p-3 border rounded-lg bg-card relative group">
                                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => removeRawMaterial(item.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2 pr-8">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">원자재 종류 #{index + 1}</Label>
                                        <Select
                                            value={item.materialType}
                                            onValueChange={(value) => updateRawMaterial(item.id, { materialType: value })}
                                        >
                                            <SelectTrigger>
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
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">중량 (kg)</Label>
                                        <Input
                                            type="number"
                                            placeholder="예: 100"
                                            value={item.quantity || ''}
                                            onChange={(e) => updateRawMaterial(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 총계 표시 */}
            {rawMaterials.length > 0 && (
                <div className="flex justify-end pt-2 border-t text-sm font-medium">
                    총 중량: {rawMaterials.reduce((acc, curr) => acc + (curr.quantity || 0), 0).toFixed(2)} kg
                </div>
            )}
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
    setActivityData
}: {
    activityData: Record<string, any>
    setActivityData: (id: string, value: number) => void
}) {
    const {
        detailedActivityData,
        addTransportStep,
        removeTransportStep,
        updateTransportStep
    } = usePCFStore()

    const transportList = detailedActivityData?.transport || []

    // 레거시 데이터 마이그레이션
    useEffect(() => {
        if (transportList.length === 0 && (activityData['transport_distance'] || 0) > 0) {
            addTransportStep({
                id: generateId(),
                stageId: 'transport',
                name: 'Legacy Transport',
                quantity: 0, // Not used directly in this model, but part of interface
                unit: 'km',
                emissionSourceType: 'fossil',
                transportMode: (activityData['transport_mode'] as TransportMode) || 'truck',
                distance: activityData['transport_distance'],
                weight: activityData['transport_weight'] || 0,
                dataQuality: {
                    type: 'secondary',
                    source: 'IPCC',
                    year: 2023,
                    geographicScope: 'Global',
                    uncertainty: 30
                }
            })
            // Reset legacy
            setActivityData('transport_distance', 0)
        }
    }, [])

    const handleAddTransport = () => {
        addTransportStep({
            id: generateId(),
            stageId: 'transport',
            name: 'New Transport Step',
            quantity: 0,
            unit: 'km',
            emissionSourceType: 'fossil',
            transportMode: 'truck',
            distance: 0,
            weight: 0,
            dataQuality: {
                type: 'secondary',
                source: 'IPCC',
                year: 2023,
                geographicScope: 'Global',
                uncertainty: 30
            }
        })
    }

    return (
        <div className="space-y-6">
            {/* 주요 운송 */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">운송 단계 (Multi-modal Transport)</span>
                    </div>
                    <Button onClick={handleAddTransport} size="sm" variant="outline" className="h-8 gap-2">
                        <Plus className="h-4 w-4" /> 과정 추가
                    </Button>
                </div>

                {transportList.length === 0 ? (
                    <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground bg-muted/20">
                        등록된 운송 과정이 없습니다. '과정 추가' 버튼을 눌러 추가해주세요.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {transportList.map((item, index) => {
                            const modeFactors = getTransportFactorsByMode(item.transportMode)
                            return (
                                <div key={item.id} className="grid gap-3 p-4 border rounded-lg bg-card relative group">
                                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => removeTransportStep(item.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-3 pr-8">
                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">운송 수단 #{index + 1}</Label>
                                            <Select
                                                value={item.transportMode}
                                                onValueChange={(value) => updateTransportStep(item.id, { transportMode: value as TransportMode })}
                                            >
                                                <SelectTrigger>
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
                                            <Label className="text-xs text-muted-foreground">운송 거리 (km)</Label>
                                            <Input
                                                type="number"
                                                placeholder="예: 500"
                                                value={item.distance || ''}
                                                onChange={(e) => updateTransportStep(item.id, { distance: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">운송 중량 (kg)</Label>
                                            <Input
                                                type="number"
                                                placeholder="예: 100"
                                                value={item.weight || ''}
                                                onChange={(e) => updateTransportStep(item.id, { weight: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                    {modeFactors.length > 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            배출계수: {modeFactors[0].value} {modeFactors[0].unit} (출처: {modeFactors[0].source})
                                        </p>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* 항공 운송 (Legacy ISO 14067 7.2 e - Not strictly needed if aircraft is selectable above, but keeping for backward compat if needed or removing? Removing as "aircraft" option covers it, but user might want explicit separation. I'll remove the separate redundant section as Aircraft is now a first-class citizen in the list) */}
            <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-muted-foreground">
                <p>
                    ISO 14067 7.2 e에 따라 항공 운송은 다른 운송 수단과 구분되어야 합니다.
                    위 목록에서 '항공'을 선택하면 자동으로 구분되어 계산됩니다.
                </p>
            </div>
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
    const {
        detailedActivityData,
        addPackagingPart,
        removePackagingPart,
        updatePackagingPart
    } = usePCFStore()

    const packagingList = detailedActivityData?.packaging || []

    // 레거시 데이터 마이그레이션
    useEffect(() => {
        if (packagingList.length === 0 && (activityData['packaging_weight'] || 0) > 0) {
            addPackagingPart({
                id: generateId(),
                stageId: 'packaging',
                name: 'Legacy Packaging',
                quantity: activityData['packaging_weight'],
                unit: 'kg',
                emissionSourceType: 'fossil',
                materialType: activityData['packaging_material'] || 'material_paper_cardboard',
                dataQuality: {
                    type: 'secondary',
                    source: '국가 LCI DB',
                    year: 2023,
                    geographicScope: 'Korea',
                    uncertainty: 30
                }
            })
            // Reset legacy
            setActivityData('packaging_weight', 0)
        }
    }, [])

    const handleAddPackaging = () => {
        addPackagingPart({
            id: generateId(),
            stageId: 'packaging',
            name: 'New Packaging',
            quantity: 0,
            unit: 'kg',
            emissionSourceType: 'fossil',
            materialType: 'material_paper_cardboard',
            dataQuality: {
                type: 'secondary',
                source: '국가 LCI DB',
                year: 2023,
                geographicScope: 'Korea',
                uncertainty: 30
            }
        })
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">포장재 목록</span>
                </div>
                <Button onClick={handleAddPackaging} size="sm" variant="outline" className="h-8 gap-2">
                    <Plus className="h-4 w-4" /> 포장재 추가
                </Button>
            </div>

            {packagingList.length === 0 ? (
                <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground bg-muted/20">
                    등록된 포장재가 없습니다. '포장재 추가' 버튼을 눌러 추가해주세요.
                </div>
            ) : (
                <div className="space-y-3">
                    {packagingList.map((item, index) => (
                        <div key={item.id} className="grid gap-3 p-3 border rounded-lg bg-card relative group">
                            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => removePackagingPart(item.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2 pr-8">
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">포장재 종류 #{index + 1}</Label>
                                    <Select
                                        value={item.materialType}
                                        onValueChange={(value) => updatePackagingPart(item.id, { materialType: value })}
                                    >
                                        <SelectTrigger>
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
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">포장재 중량 (kg)</Label>
                                    <Input
                                        type="number"
                                        placeholder="예: 5"
                                        value={item.quantity || ''}
                                        onChange={(e) => updatePackagingPart(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
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
