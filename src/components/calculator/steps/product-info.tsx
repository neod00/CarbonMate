"use client"

import { useEffect } from "react"
import { usePCFStore, BoundaryType } from "@/lib/store"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Info, ArrowRight, Package, Factory, Recycle } from "lucide-react"
import {
    SYSTEM_BOUNDARIES,
    PRODUCT_CATEGORIES,
    FUNCTIONAL_UNIT_TEMPLATES,
    getSystemBoundaryConfig,
    applyProductCategoryDefaults,
    adjustStagesForBoundaryChange
} from "@/lib/system-boundary"

export function ProductInfoStep() {
    const { productInfo, setProductInfo, stages, toggleStage } = usePCFStore()

    // 제품 카테고리 변경 시 기본값 적용
    const handleCategoryChange = (categoryId: string) => {
        setProductInfo({ category: categoryId })
        
        // 카테고리에 따른 기본값 적용 (사용자가 원하면)
        const defaults = applyProductCategoryDefaults(categoryId)
        
        // 시스템 경계와 기능단위 자동 설정
        setProductInfo({ 
            boundary: defaults.boundary,
            unit: defaults.functionalUnit
        })
        
        // 단계 자동 조정은 lifecycle-stages에서 처리
    }

    // 시스템 경계 변경 시 단계 자동 조정
    const handleBoundaryChange = (boundary: BoundaryType) => {
        setProductInfo({ boundary })
        
        // 현재 단계를 새 경계에 맞게 조정
        const adjustedStages = adjustStagesForBoundaryChange(stages, boundary)
        
        // 현재 단계와 조정된 단계 비교하여 토글
        const currentSet = new Set(stages)
        const adjustedSet = new Set(adjustedStages)
        
        // 제거해야 할 단계
        stages.forEach(stage => {
            if (!adjustedSet.has(stage)) {
                toggleStage(stage)
            }
        })
        
        // 추가해야 할 단계
        adjustedStages.forEach(stage => {
            if (!currentSet.has(stage)) {
                toggleStage(stage)
            }
        })
    }

    const currentBoundary = getSystemBoundaryConfig(productInfo.boundary)

    return (
        <div className="space-y-8">
            {/* 제품 기본 정보 */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium">제품 기본 정보</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="name">제품명 *</Label>
                        <Input
                            id="name"
                            placeholder="예: Eco-Chair 2000"
                            value={productInfo.name}
                            onChange={(e) => setProductInfo({ name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category">제품 카테고리</Label>
                        <Select
                            value={productInfo.category || 'other'}
                            onValueChange={handleCategoryChange}
                        >
                            <SelectTrigger id="category">
                                <SelectValue placeholder="카테고리 선택" />
                            </SelectTrigger>
                            <SelectContent>
                                {PRODUCT_CATEGORIES.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                        {cat.nameKo}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            카테고리 선택 시 권장 설정이 자동 적용됩니다.
                        </p>
                    </div>
                </div>
            </div>

            {/* 기능단위 (ISO 14067 6.3.3) */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium">기능단위</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                        ISO 14067 6.3.3
                    </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="unit">기능단위 (Functional Unit) *</Label>
                        <Input
                            id="unit"
                            placeholder="예: 1 piece, 1 kg"
                            value={productInfo.unit}
                            onChange={(e) => setProductInfo({ unit: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>기능단위 템플릿</Label>
                        <Select
                            value=""
                            onValueChange={(value) => setProductInfo({ unit: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="템플릿에서 선택" />
                            </SelectTrigger>
                            <SelectContent>
                                {FUNCTIONAL_UNIT_TEMPLATES.map((category) => (
                                    <div key={category.id}>
                                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                            {category.categoryKo}
                                        </div>
                                        {category.templates.map((template) => (
                                            <SelectItem key={template.unit} value={template.unit}>
                                                {template.nameKo} ({template.unit})
                                            </SelectItem>
                                        ))}
                                    </div>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">
                        <span className="font-medium">기능단위란?</span> CFP 결과를 표현하는 기준입니다. 
                        동일한 기능을 수행하는 제품 간 비교를 가능하게 합니다.
                        <br />예: "1 kg의 강철", "1 대의 노트북", "100회 세탁"
                    </p>
                </div>
            </div>

            {/* 시스템 경계 (ISO 14067 6.3.4) */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium">시스템 경계</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                        ISO 14067 6.3.4
                    </span>
                </div>
                
                <div className="grid gap-4 md:grid-cols-3">
                    {SYSTEM_BOUNDARIES.map((boundary) => {
                        const isSelected = productInfo.boundary === boundary.id
                        return (
                            <Card
                                key={boundary.id}
                                className={`cursor-pointer transition-all hover:border-primary/50 ${
                                    isSelected 
                                        ? 'border-primary bg-primary/5' 
                                        : 'border-border/50'
                                }`}
                                onClick={() => handleBoundaryChange(boundary.id)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg ${
                                            isSelected ? 'bg-primary/20' : 'bg-muted'
                                        }`}>
                                            <BoundaryIcon type={boundary.id} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-sm">
                                                {boundary.nameKo}
                                            </h4>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {boundary.name}
                                            </p>
                                        </div>
                                        {isSelected && (
                                            <div className="h-2 w-2 rounded-full bg-primary" />
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-3">
                                        {boundary.descriptionKo}
                                    </p>
                                    <p className="text-xs text-muted-foreground/60 mt-2">
                                        용도: {boundary.typicalUseCase}
                                    </p>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>

            {/* 선택된 경계 상세 정보 */}
            <div className="p-4 rounded-lg border border-border/50 bg-muted/30">
                <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="space-y-3 flex-1">
                        <div>
                            <h4 className="font-medium text-sm">
                                선택된 경계: {currentBoundary.nameKo} ({currentBoundary.name})
                            </h4>
                        </div>
                        
                        {/* 단계 흐름 시각화 */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            {currentBoundary.requiredStages.map((stage, idx) => (
                                <div key={stage} className="flex items-center gap-1">
                                    <span className="px-2 py-1 rounded bg-primary/20 text-primary font-medium">
                                        {getStageLabel(stage)}
                                    </span>
                                    {idx < currentBoundary.requiredStages.length - 1 && (
                                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                    )}
                                </div>
                            ))}
                            {currentBoundary.optionalStages.length > 0 && (
                                <>
                                    <span className="text-muted-foreground">+</span>
                                    {currentBoundary.optionalStages.map((stage) => (
                                        <span 
                                            key={stage}
                                            className="px-2 py-1 rounded bg-muted text-muted-foreground"
                                        >
                                            {getStageLabel(stage)} (선택)
                                        </span>
                                    ))}
                                </>
                            )}
                        </div>

                        {/* 제외 단계 */}
                        {currentBoundary.excludedStages.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                                제외 단계: {currentBoundary.excludedStages.map(s => getStageLabel(s)).join(', ')}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

// =============================================================================
// 헬퍼 컴포넌트
// =============================================================================

function BoundaryIcon({ type }: { type: BoundaryType }) {
    switch (type) {
        case 'cradle-to-gate':
            return (
                <div className="flex items-center gap-0.5 text-primary">
                    <Package className="h-4 w-4" />
                    <ArrowRight className="h-3 w-3" />
                    <Factory className="h-4 w-4" />
                </div>
            )
        case 'cradle-to-grave':
            return (
                <div className="flex items-center gap-0.5 text-primary">
                    <Package className="h-4 w-4" />
                    <ArrowRight className="h-3 w-3" />
                    <Recycle className="h-4 w-4" />
                </div>
            )
        case 'gate-to-gate':
            return (
                <div className="flex items-center gap-0.5 text-primary">
                    <Factory className="h-4 w-4" />
                </div>
            )
        default:
            return <Package className="h-4 w-4" />
    }
}

function getStageLabel(stageId: string): string {
    const labels: Record<string, string> = {
        raw_materials: '원료',
        manufacturing: '제조',
        transport: '운송',
        packaging: '포장',
        use: '사용',
        eol: '폐기'
    }
    return labels[stageId] || stageId
}
