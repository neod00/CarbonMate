'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePCFStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    MULTI_OUTPUT_ALLOCATION_METHODS,
    PHYSICAL_ALLOCATION_BASIS_OPTIONS,
    RECYCLING_ALLOCATION_METHODS,
    MultiOutputAllocationMethod,
    RecyclingAllocationMethod,
    PhysicalAllocationBasis,
    calculatePhysicalAllocation,
    CoProduct
} from '@/lib/allocation'
import { 
    Scale, 
    Recycle, 
    Plus, 
    Trash2, 
    Info, 
    ChevronDown, 
    ChevronUp,
    AlertCircle,
    CheckCircle,
    HelpCircle,
    Scissors,
    RefreshCw,
    ArrowLeftRight,
    Sparkles,
    TrendingDown,
    Leaf,
    Factory
} from 'lucide-react'

// 재활용 방법 아이콘 매핑
const RECYCLING_METHOD_ICONS: Record<RecyclingAllocationMethod, React.ElementType> = {
    cut_off: Scissors,
    eol_recycling: RefreshCw,
    fifty_fifty: ArrowLeftRight,
    substitution: Sparkles,
    pef_formula: Leaf
}

// 추천 방법 (상위 3개)
const RECOMMENDED_METHODS: RecyclingAllocationMethod[] = ['cut_off', 'fifty_fifty', 'substitution']
const ADVANCED_METHODS: RecyclingAllocationMethod[] = ['eol_recycling', 'pef_formula']

export const AllocationStep = () => {
    const {
        multiOutputAllocation,
        recyclingAllocation,
        activityData,
        setMultiOutputAllocationMethod,
        setPhysicalAllocationBasis,
        addCoProduct,
        removeCoProduct,
        setRecyclingAllocationMethod,
        setRecyclingParams,
        setAllocationJustification
    } = usePCFStore()

    const [expandedSection, setExpandedSection] = useState<'multiOutput' | 'recycling' | null>('recycling')
    const [showGuidance, setShowGuidance] = useState(false)
    const [showAdvancedMethods, setShowAdvancedMethods] = useState(false)
    
    // 공동 제품 추가 폼 상태
    const [newCoProduct, setNewCoProduct] = useState<Partial<CoProduct>>({
        name: '',
        quantity: 0,
        unit: 'kg',
        allocationValue: 0,
        allocationUnit: 'kg'
    })

    // 공동 제품이 있는지 여부
    const hasCoProducts = multiOutputAllocation.coProducts.length > 0

    // 공동 제품 추가
    const handleAddCoProduct = () => {
        if (newCoProduct.name && (newCoProduct.quantity ?? 0) > 0) {
            addCoProduct({
                id: `coproduct_${Date.now()}`,
                name: newCoProduct.name || '',
                quantity: newCoProduct.quantity || 0,
                unit: newCoProduct.unit || 'kg',
                allocationValue: newCoProduct.allocationValue || 0,
                allocationUnit: newCoProduct.allocationUnit || 'kg'
            })
            setNewCoProduct({
                name: '',
                quantity: 0,
                unit: 'kg',
                allocationValue: 0,
                allocationUnit: 'kg'
            })
        }
    }

    // 할당 비율 계산
    const allocationShares = useMemo(() => {
        if (!hasCoProducts) return null
        
        const mainProductValue = 100
        const coProductValues = multiOutputAllocation.coProducts.map(p => ({
            value: p.allocationValue
        }))
        
        return calculatePhysicalAllocation(
            { value: mainProductValue },
            coProductValues
        )
    }, [hasCoProducts, multiOutputAllocation.coProducts])

    // 예상 효과 계산
    const estimatedEffect = useMemo(() => {
        const recycledIn = recyclingAllocation.recycledContentInput
        const recycledOut = recyclingAllocation.recyclabilityOutput
        const method = recyclingAllocation.method
        
        // 가상의 기준 배출량 (버진 원료 1kg 기준)
        const baseEmission = 2.0 // kg CO2e/kg
        
        let virginBurden = 1 - recycledIn
        let disposalBurden = 1 - recycledOut
        let creditEffect = 0
        
        switch (method) {
            case 'cut_off':
                // 재활용 투입의 부담 없음
                creditEffect = 0
                break
            case 'substitution':
                // 재활용 산출에 대한 크레딧
                creditEffect = recycledOut * baseEmission * (recyclingAllocation.qualityFactorOutput || 1)
                break
            case 'fifty_fifty':
                virginBurden = 0.5 * (1 - recycledIn)
                disposalBurden = 0.5 * (1 - recycledOut)
                break
            case 'pef_formula':
                // PEF는 복잡한 계산, 간소화
                creditEffect = 0.5 * recycledOut * baseEmission
                break
            default:
                break
        }
        
        return {
            virginBurden: virginBurden * 100,
            disposalBurden: disposalBurden * 100,
            creditEffect: creditEffect,
            netEffect: creditEffect > 0 ? -creditEffect : 0
        }
    }, [recyclingAllocation])

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                        <Scale className="w-6 h-6 text-primary" />
                        할당 설정
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        ISO 14067 6.4.9에 따른 할당 절차 설정
                    </p>
                </div>
                <button
                    onClick={() => setShowGuidance(!showGuidance)}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors font-medium"
                >
                    <HelpCircle className="w-4 h-4" />
                    할당 가이드
                </button>
            </div>

            {/* 할당 가이드 */}
            <AnimatePresence>
                {showGuidance && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <Card className="border-primary/30 bg-primary/5">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-xl bg-primary/10">
                                        <Info className="w-6 h-6 text-primary" />
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <h4 className="font-semibold text-foreground mb-2">ISO 14067 할당 우선순위</h4>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="p-3 bg-background/50 rounded-lg border border-border/50">
                                                    <p className="font-medium text-sm text-green-600 mb-2">1단계: 할당 회피 (가장 권장)</p>
                                                    <ul className="text-sm text-muted-foreground space-y-1">
                                                        <li>• 하위 분할: 공정을 각 제품별로 분리</li>
                                                        <li>• 시스템 확장: 대체 생산 고려</li>
                                                    </ul>
                                                </div>
                                                <div className="p-3 bg-background/50 rounded-lg border border-border/50">
                                                    <p className="font-medium text-sm text-amber-600 mb-2">2단계: 할당 필요시</p>
                                                    <ul className="text-sm text-muted-foreground space-y-1">
                                                        <li>• 물리적 관계 기반 (질량, 에너지)</li>
                                                        <li>• 경제적 관계 기반 (가격)</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground border-t border-border/50 pt-3">
                                            ※ 선택한 할당 방법과 정당화 사유는 CFP 보고서에 포함되어야 합니다.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 다중 출력 프로세스 할당 */}
            <Card className={`transition-all ${expandedSection === 'multiOutput' ? 'ring-2 ring-indigo-500/30' : ''}`}>
                <button
                    onClick={() => setExpandedSection(expandedSection === 'multiOutput' ? null : 'multiOutput')}
                    className="w-full"
                >
                    <CardHeader className="flex flex-row items-center justify-between hover:bg-muted/50 transition-colors rounded-t-lg">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-indigo-500/10">
                                <Factory className="w-6 h-6 text-indigo-500" />
                            </div>
                            <div className="text-left">
                                <CardTitle className="text-lg">다중 출력 프로세스 할당</CardTitle>
                                <CardDescription>공동 제품이 있는 경우 환경 부하 배분</CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {hasCoProducts ? (
                                <span className="px-3 py-1.5 text-xs bg-indigo-100 text-indigo-700 rounded-full font-medium">
                                    {multiOutputAllocation.coProducts.length}개 공동제품
                                </span>
                            ) : (
                                <span className="px-3 py-1.5 text-xs bg-muted text-muted-foreground rounded-full">
                                    해당없음
                                </span>
                            )}
                            {expandedSection === 'multiOutput' ? (
                                <ChevronUp className="w-5 h-5 text-muted-foreground" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            )}
                        </div>
                    </CardHeader>
                </button>

                <AnimatePresence>
                    {expandedSection === 'multiOutput' && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <CardContent className="border-t space-y-6 pt-6">
                                {/* 할당 방법 선택 */}
                                <div>
                                    <label className="block text-sm font-medium mb-3">할당 방법</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {(Object.entries(MULTI_OUTPUT_ALLOCATION_METHODS) as [MultiOutputAllocationMethod, typeof MULTI_OUTPUT_ALLOCATION_METHODS[MultiOutputAllocationMethod]][]).map(([key, method]) => (
                                            <button
                                                key={key}
                                                onClick={() => setMultiOutputAllocationMethod(key)}
                                                className={`p-4 rounded-xl border-2 text-left transition-all ${
                                                    multiOutputAllocation.method === key
                                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                                                        : 'border-border hover:border-indigo-300 hover:bg-muted/50'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`font-semibold ${
                                                        multiOutputAllocation.method === key ? 'text-indigo-700 dark:text-indigo-400' : 'text-foreground'
                                                    }`}>
                                                        {method.nameKo}
                                                    </span>
                                                    {method.isAvoidance && (
                                                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full font-medium">
                                                            권장
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {method.descriptionKo}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 물리적 할당 기준 */}
                                {multiOutputAllocation.method === 'physical' && (
                                    <div>
                                        <label className="block text-sm font-medium mb-2">물리적 할당 기준</label>
                                        <select
                                            value={multiOutputAllocation.physicalBasis}
                                            onChange={(e) => setPhysicalAllocationBasis(e.target.value as PhysicalAllocationBasis)}
                                            className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            {(Object.entries(PHYSICAL_ALLOCATION_BASIS_OPTIONS) as [PhysicalAllocationBasis, typeof PHYSICAL_ALLOCATION_BASIS_OPTIONS[PhysicalAllocationBasis]][]).map(([key, option]) => (
                                                <option key={key} value={key}>
                                                    {option.nameKo} ({option.unit}) - {option.description}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* 공동 제품 관리 */}
                                {(multiOutputAllocation.method === 'physical' || multiOutputAllocation.method === 'economic') && (
                                    <div className="space-y-4">
                                        <label className="block text-sm font-medium">공동 제품 (Co-products)</label>
                                        
                                        {multiOutputAllocation.coProducts.length > 0 && (
                                            <div className="space-y-2">
                                                {multiOutputAllocation.coProducts.map((product, index) => (
                                                    <div key={product.id} className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                                                        <div className="flex-1 grid grid-cols-4 gap-3 text-sm">
                                                            <span className="font-medium">{product.name}</span>
                                                            <span className="text-muted-foreground">{product.quantity} {product.unit}</span>
                                                            <span className="text-muted-foreground">{product.allocationValue} {product.allocationUnit}</span>
                                                            {allocationShares && (
                                                                <span className="text-indigo-600 font-semibold">
                                                                    {(allocationShares.coProductShares[index] * 100).toFixed(1)}%
                                                                </span>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => removeCoProduct(product.id)}
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex items-end gap-3">
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    placeholder="제품명"
                                                    value={newCoProduct.name}
                                                    onChange={(e) => setNewCoProduct({ ...newCoProduct, name: e.target.value })}
                                                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-background"
                                                />
                                            </div>
                                            <div className="w-28">
                                                <input
                                                    type="number"
                                                    placeholder="수량"
                                                    value={newCoProduct.quantity || ''}
                                                    onChange={(e) => setNewCoProduct({ ...newCoProduct, quantity: parseFloat(e.target.value) || 0 })}
                                                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-background"
                                                />
                                            </div>
                                            <div className="w-28">
                                                <input
                                                    type="number"
                                                    placeholder="할당값"
                                                    value={newCoProduct.allocationValue || ''}
                                                    onChange={(e) => setNewCoProduct({ ...newCoProduct, allocationValue: parseFloat(e.target.value) || 0 })}
                                                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-background"
                                                />
                                            </div>
                                            <button
                                                onClick={handleAddCoProduct}
                                                className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {allocationShares && hasCoProducts && (
                                            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle className="w-5 h-5 text-indigo-600" />
                                                    <span className="text-indigo-700 dark:text-indigo-400 font-medium">
                                                        주 제품 할당 비율: {(allocationShares.mainShare * 100).toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* 정당화 사유 */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">할당 방법 선택 정당화 사유</label>
                                    <textarea
                                        value={multiOutputAllocation.justification}
                                        onChange={(e) => setAllocationJustification('multiOutput', e.target.value)}
                                        placeholder="선택한 할당 방법의 정당화 사유를 입력하세요..."
                                        rows={2}
                                        className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-background focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </CardContent>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>

            {/* 재사용/재활용 할당 */}
            <Card className={`transition-all ${expandedSection === 'recycling' ? 'ring-2 ring-green-500/30' : ''}`}>
                <button
                    onClick={() => setExpandedSection(expandedSection === 'recycling' ? null : 'recycling')}
                    className="w-full"
                >
                    <CardHeader className="flex flex-row items-center justify-between hover:bg-muted/50 transition-colors rounded-t-lg">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-green-500/10">
                                <Recycle className="w-6 h-6 text-green-500" />
                            </div>
                            <div className="text-left">
                                <CardTitle className="text-lg">재사용/재활용 할당</CardTitle>
                                <CardDescription>재활용 원료 및 EOL 재활용 처리 방법</CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-full font-medium">
                                {RECYCLING_ALLOCATION_METHODS[recyclingAllocation.method].nameKo}
                            </span>
                            {expandedSection === 'recycling' ? (
                                <ChevronUp className="w-5 h-5 text-muted-foreground" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            )}
                        </div>
                    </CardHeader>
                </button>

                <AnimatePresence>
                    {expandedSection === 'recycling' && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <CardContent className="border-t space-y-6 pt-6">
                                {/* 재활용 방법 선택 - 추천 3개 */}
                                <div>
                                    <label className="block text-sm font-medium mb-3">재활용 할당 방법</label>
                                    <div className="grid grid-cols-3 gap-4 mb-4">
                                        {RECOMMENDED_METHODS.map((key) => {
                                            const method = RECYCLING_ALLOCATION_METHODS[key]
                                            const Icon = RECYCLING_METHOD_ICONS[key]
                                            const isSelected = recyclingAllocation.method === key
                                            
                                            return (
                                                <button
                                                    key={key}
                                                    onClick={() => setRecyclingAllocationMethod(key)}
                                                    className={`relative p-5 rounded-2xl border-2 text-left transition-all ${
                                                        isSelected
                                                            ? 'border-green-500 bg-green-50 dark:bg-green-950/30 shadow-lg shadow-green-500/10'
                                                            : 'border-border hover:border-green-300 hover:bg-muted/50'
                                                    }`}
                                                >
                                                    {key === 'cut_off' && (
                                                        <span className="absolute -top-2 -right-2 px-2 py-0.5 text-xs bg-green-500 text-white rounded-full font-medium">
                                                            추천
                                                        </span>
                                                    )}
                                                    <div className={`p-3 rounded-xl inline-block mb-3 ${
                                                        isSelected ? 'bg-green-500/20' : 'bg-muted'
                                                    }`}>
                                                        <Icon className={`w-6 h-6 ${isSelected ? 'text-green-600' : 'text-muted-foreground'}`} />
                                                    </div>
                                                    <h4 className={`font-semibold mb-1 ${
                                                        isSelected ? 'text-green-700 dark:text-green-400' : 'text-foreground'
                                                    }`}>
                                                        {method.nameKo}
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                                        {method.descriptionKo}
                                                    </p>
                                                    {isSelected && (
                                                        <div className="absolute bottom-3 right-3">
                                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                                        </div>
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>

                                    {/* 고급 옵션 */}
                                    <button
                                        onClick={() => setShowAdvancedMethods(!showAdvancedMethods)}
                                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
                                    >
                                        {showAdvancedMethods ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        고급 옵션 ({ADVANCED_METHODS.length}개)
                                    </button>

                                    <AnimatePresence>
                                        {showAdvancedMethods && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="grid grid-cols-2 gap-3"
                                            >
                                                {ADVANCED_METHODS.map((key) => {
                                                    const method = RECYCLING_ALLOCATION_METHODS[key]
                                                    const Icon = RECYCLING_METHOD_ICONS[key]
                                                    const isSelected = recyclingAllocation.method === key
                                                    
                                                    return (
                                                        <button
                                                            key={key}
                                                            onClick={() => setRecyclingAllocationMethod(key)}
                                                            className={`p-4 rounded-xl border-2 text-left transition-all flex items-start gap-3 ${
                                                                isSelected
                                                                    ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                                                                    : 'border-border hover:border-green-300'
                                                            }`}
                                                        >
                                                            <Icon className={`w-5 h-5 mt-0.5 ${isSelected ? 'text-green-600' : 'text-muted-foreground'}`} />
                                                            <div>
                                                                <h4 className={`font-medium text-sm ${isSelected ? 'text-green-700' : ''}`}>
                                                                    {method.nameKo}
                                                                </h4>
                                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                                    {method.descriptionKo}
                                                                </p>
                                                            </div>
                                                        </button>
                                                    )
                                                })}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* 수식 표시 */}
                                <div className="p-4 bg-muted/50 rounded-xl border border-border">
                                    <p className="text-xs text-muted-foreground mb-1">적용 수식</p>
                                    <p className="text-sm font-mono text-foreground">
                                        {RECYCLING_ALLOCATION_METHODS[recyclingAllocation.method].formula}
                                    </p>
                                </div>

                                {/* 파라미터 입력 - 슬라이더 */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* 재활용 투입 비율 */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium">
                                                재활용 투입 비율 (R<sub>in</sub>)
                                            </label>
                                            <span className="text-lg font-bold text-green-600">
                                                {(recyclingAllocation.recycledContentInput * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={recyclingAllocation.recycledContentInput * 100}
                                            onChange={(e) => setRecyclingParams({ 
                                                recycledContentInput: parseFloat(e.target.value) / 100 
                                            })}
                                            className="w-full h-3 bg-muted rounded-full appearance-none cursor-pointer accent-green-500"
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>0% (모두 버진)</span>
                                            <span>100% (모두 재활용)</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            제품에 투입되는 재활용 원료 비율
                                        </p>
                                    </div>

                                    {/* 재활용 산출 비율 */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium">
                                                재활용 산출 비율 (R<sub>out</sub>)
                                            </label>
                                            <span className="text-lg font-bold text-green-600">
                                                {(recyclingAllocation.recyclabilityOutput * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={recyclingAllocation.recyclabilityOutput * 100}
                                            onChange={(e) => setRecyclingParams({ 
                                                recyclabilityOutput: parseFloat(e.target.value) / 100 
                                            })}
                                            className="w-full h-3 bg-muted rounded-full appearance-none cursor-pointer accent-green-500"
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>0% (모두 폐기)</span>
                                            <span>100% (모두 재활용)</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            EOL 단계에서 재활용되는 비율
                                        </p>
                                    </div>
                                </div>

                                {/* 품질 계수 */}
                                {(recyclingAllocation.method === 'pef_formula' || recyclingAllocation.method === 'substitution') && (
                                    <div className="grid md:grid-cols-2 gap-6 p-4 bg-muted/30 rounded-xl">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                투입 품질 계수 (Q<sub>s,in</sub>)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="1"
                                                step="0.1"
                                                value={recyclingAllocation.qualityFactorInput}
                                                onChange={(e) => setRecyclingParams({ 
                                                    qualityFactorInput: parseFloat(e.target.value) || 1 
                                                })}
                                                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-background"
                                            />
                                            <p className="text-xs text-muted-foreground">다운사이클링 시 1 미만</p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                산출 품질 계수 (Q<sub>s,out</sub>)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="1"
                                                step="0.1"
                                                value={recyclingAllocation.qualityFactorOutput}
                                                onChange={(e) => setRecyclingParams({ 
                                                    qualityFactorOutput: parseFloat(e.target.value) || 1 
                                                })}
                                                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-background"
                                            />
                                            <p className="text-xs text-muted-foreground">재활용 원료 품질 계수</p>
                                        </div>
                                    </div>
                                )}

                                {/* 루프 타입 */}
                                <div>
                                    <label className="block text-sm font-medium mb-3">재활용 루프 타입</label>
                                    <div className="flex gap-4">
                                        {[
                                            { id: 'closed_loop', label: '폐쇄 루프 (Closed-loop)', desc: '동일 제품으로 재활용' },
                                            { id: 'open_loop', label: '개방 루프 (Open-loop)', desc: '다른 제품으로 재활용' }
                                        ].map((option) => (
                                            <button
                                                key={option.id}
                                                onClick={() => setRecyclingParams({ loopType: option.id as 'closed_loop' | 'open_loop' })}
                                                className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${
                                                    recyclingAllocation.loopType === option.id
                                                        ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                                                        : 'border-border hover:border-green-300'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    {recyclingAllocation.loopType === option.id ? (
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                    ) : (
                                                        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                                                    )}
                                                    <span className="font-medium text-sm">{option.label}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground ml-6">{option.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 선택 요약 & 예상 효과 */}
                                <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-2xl border border-green-200 dark:border-green-800">
                                    <div className="flex items-center gap-2 mb-4">
                                        <TrendingDown className="w-5 h-5 text-green-600" />
                                        <h4 className="font-semibold text-green-800 dark:text-green-400">할당 설정 요약 및 예상 효과</h4>
                                    </div>
                                    
                                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                                        <div className="p-3 bg-white/50 dark:bg-black/20 rounded-xl">
                                            <p className="text-xs text-muted-foreground mb-1">방법</p>
                                            <p className="font-semibold text-green-700 dark:text-green-400">
                                                {RECYCLING_ALLOCATION_METHODS[recyclingAllocation.method].nameKo}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-white/50 dark:bg-black/20 rounded-xl">
                                            <p className="text-xs text-muted-foreground mb-1">버진 원료 부담</p>
                                            <p className="font-semibold">
                                                {estimatedEffect.virginBurden.toFixed(0)}%
                                                <span className="text-xs text-muted-foreground ml-1">
                                                    (투입 {(recyclingAllocation.recycledContentInput * 100).toFixed(0)}% 재활용)
                                                </span>
                                            </p>
                                        </div>
                                        <div className="p-3 bg-white/50 dark:bg-black/20 rounded-xl">
                                            <p className="text-xs text-muted-foreground mb-1">폐기 부담</p>
                                            <p className="font-semibold">
                                                {estimatedEffect.disposalBurden.toFixed(0)}%
                                                <span className="text-xs text-muted-foreground ml-1">
                                                    (산출 {(recyclingAllocation.recyclabilityOutput * 100).toFixed(0)}% 재활용)
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    {estimatedEffect.creditEffect > 0 && (
                                        <div className="flex items-center gap-2 p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                                            <Sparkles className="w-4 h-4 text-green-600" />
                                            <span className="text-sm text-green-700 dark:text-green-400">
                                                예상 재활용 크레딧: <strong>-{estimatedEffect.creditEffect.toFixed(2)} kg CO₂e</strong> (버진 원료 대체)
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* 적합한 시나리오 */}
                                <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                                    <Info className="w-5 h-5 text-emerald-600 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-emerald-800 dark:text-emerald-400 mb-2">적합한 시나리오</p>
                                        <ul className="text-sm text-emerald-700 dark:text-emerald-500 space-y-1">
                                            {RECYCLING_ALLOCATION_METHODS[recyclingAllocation.method].suitableFor.map((scenario, i) => (
                                                <li key={i} className="flex items-center gap-2">
                                                    <CheckCircle className="w-3 h-3" />
                                                    {scenario}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* 정당화 사유 */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">할당 방법 선택 정당화 사유</label>
                                    <textarea
                                        value={recyclingAllocation.justification}
                                        onChange={(e) => setAllocationJustification('recycling', e.target.value)}
                                        placeholder="선택한 할당 방법의 정당화 사유를 입력하세요..."
                                        rows={2}
                                        className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-background focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                            </CardContent>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>

            {/* 할당 참고사항 */}
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                            <AlertCircle className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-amber-900 dark:text-amber-400 mb-2">할당 절차 참고사항</h3>
                            <ul className="text-sm text-amber-800 dark:text-amber-500 space-y-1.5">
                                <li className="flex items-start gap-2">
                                    <span className="text-amber-500">•</span>
                                    <span><strong>ISO 14044</strong>에 따라 가능한 경우 항상 할당을 회피하세요</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-amber-500">•</span>
                                    <span>할당 방법과 정당화 사유는 <strong>CFP 보고서</strong>에 명시해야 합니다</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-amber-500">•</span>
                                    <span><strong>민감도 분석</strong>을 통해 다른 할당 방법의 영향을 확인하세요</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-amber-500">•</span>
                                    <span><strong>Cut-off</strong> 방법은 보수적 접근으로 널리 수용됩니다</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
