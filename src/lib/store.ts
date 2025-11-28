import { create } from 'zustand'
import {
    MultiOutputAllocation,
    RecyclingAllocation,
    DEFAULT_MULTI_OUTPUT_ALLOCATION,
    DEFAULT_RECYCLING_ALLOCATION,
    MultiOutputAllocationMethod,
    RecyclingAllocationMethod,
    PhysicalAllocationBasis,
    LoopType,
    CoProduct
} from './allocation'

// =============================================================================
// 타입 정의
// =============================================================================

export type BoundaryType = 'cradle-to-gate' | 'cradle-to-grave' | 'gate-to-gate'
export type EmissionSourceType = 'fossil' | 'biogenic' | 'mixed'
export type DataQualityType = 'primary' | 'secondary' | 'estimated'
export type TransportMode = 'truck' | 'rail' | 'ship' | 'aircraft'

/**
 * 제품 기본 정보
 */
export interface ProductInfo {
    name: string
    category: string
    unit: string // Functional Unit
    boundary: BoundaryType
    referenceFlow?: string // ISO 14067 6.3.3 - 기준 흐름
}

/**
 * 데이터 품질 정보 (ISO 14067 6.3.5)
 */
export interface DataQuality {
    type: DataQualityType
    source: string
    year: number
    geographicScope: string
    uncertainty?: number // %
}

/**
 * 단일 활동 데이터 입력 항목
 */
export interface ActivityInput {
    id: string
    stageId: string
    name: string
    quantity: number
    unit: string
    emissionSourceType: EmissionSourceType
    emissionFactorId?: string // 배출계수 DB 참조 ID
    customEmissionFactor?: number // 사용자 지정 배출계수
    dataQuality: DataQuality
}

/**
 * 운송 데이터 (특수 처리 필요)
 */
export interface TransportInput extends ActivityInput {
    transportMode: TransportMode
    distance: number // km
    weight: number // kg
}

/**
 * 전력 데이터 (ISO 14067 6.4.9.4)
 */
export interface ElectricityInput extends ActivityInput {
    gridType: 'national' | 'regional' | 'supplier_specific' | 'onsite'
    gridRegion?: string
    renewableShare?: number // %
}

/**
 * 원자재 데이터
 */
export interface MaterialInput extends ActivityInput {
    materialType: string
    recycledContent?: number // %
}

// =============================================================================
// 단계별 활동 데이터 구조
// =============================================================================

export interface StageActivityData {
    raw_materials: MaterialInput[]
    manufacturing: {
        electricity: ElectricityInput[]
        fuels: ActivityInput[]
        processEmissions: ActivityInput[]
    }
    transport: TransportInput[]
    packaging: MaterialInput[]
    use: {
        electricity: ElectricityInput[]
        consumables: ActivityInput[]
    }
    eol: {
        disposal: ActivityInput[]
        recycling: ActivityInput[]
    }
}

// =============================================================================
// 레거시 호환성을 위한 단순 데이터 구조 유지
// =============================================================================

export interface SimplifiedActivityData {
    // 원자재
    raw_material_weight?: number
    raw_material_type?: string
    
    // 제조
    electricity?: number
    electricity_grid?: string
    gas?: number
    diesel?: number
    
    // 운송
    transport_distance?: number
    transport_weight?: number
    transport_mode?: TransportMode
    
    // 포장
    packaging_weight?: number
    packaging_material?: string
    
    // 사용
    use_electricity?: number
    use_years?: number
    
    // 폐기
    waste_weight?: number
    recycling_rate?: number
    
    // 항공 운송 (ISO 14067 7.2 e 필수 분리)
    aircraft_transport_distance?: number
    aircraft_transport_weight?: number
}

// =============================================================================
// Store 상태 정의
// =============================================================================

export interface PCFState {
    // 기본 정보
    productInfo: ProductInfo
    stages: string[]
    
    // 활동 데이터 (레거시 호환)
    activityData: SimplifiedActivityData
    
    // 확장된 활동 데이터 (향후 사용)
    detailedActivityData?: Partial<StageActivityData>
    
    // 데이터 품질 메타데이터
    dataQualityMeta: {
        overallType: DataQualityType
        sources: string[]
        baseYear: number
    }
    
    // 할당 설정 (ISO 14067 6.4.9)
    multiOutputAllocation: MultiOutputAllocation
    recyclingAllocation: RecyclingAllocation
    
    // Actions
    setProductInfo: (info: Partial<ProductInfo>) => void
    toggleStage: (stageId: string) => void
    setActivityData: (id: string, value: number) => void
    setActivityDataWithMeta: (id: string, value: number, meta?: Partial<DataQuality>) => void
    setTransportMode: (mode: TransportMode) => void
    setElectricityGrid: (grid: string) => void
    setDataQualityMeta: (meta: Partial<PCFState['dataQualityMeta']>) => void
    
    // 할당 관련 Actions
    setMultiOutputAllocationMethod: (method: MultiOutputAllocationMethod) => void
    setPhysicalAllocationBasis: (basis: PhysicalAllocationBasis) => void
    addCoProduct: (coProduct: CoProduct) => void
    removeCoProduct: (id: string) => void
    updateCoProduct: (id: string, updates: Partial<CoProduct>) => void
    setRecyclingAllocationMethod: (method: RecyclingAllocationMethod) => void
    setRecyclingParams: (params: Partial<RecyclingAllocation>) => void
    setAllocationJustification: (type: 'multiOutput' | 'recycling', justification: string) => void
    
    reset: () => void
}

// =============================================================================
// 기본값
// =============================================================================

const DEFAULT_DATA_QUALITY: DataQuality = {
    type: 'secondary',
    source: '국가 LCI DB',
    year: 2023,
    geographicScope: 'Korea',
    uncertainty: 30
}

const DEFAULT_DATA_QUALITY_META: PCFState['dataQualityMeta'] = {
    overallType: 'secondary',
    sources: ['국가 LCI DB', 'IPCC', 'Ecoinvent'],
    baseYear: 2023
}

// =============================================================================
// Store 생성
// =============================================================================

export const usePCFStore = create<PCFState>((set) => ({
    productInfo: {
        name: '',
        category: '',
        unit: '1 kg',
        boundary: 'cradle-to-gate',
        referenceFlow: ''
    },
    
    stages: ['raw_materials', 'manufacturing', 'transport', 'packaging', 'use', 'eol'],
    
    activityData: {},
    
    detailedActivityData: undefined,
    
    dataQualityMeta: DEFAULT_DATA_QUALITY_META,
    
    // 할당 초기값
    multiOutputAllocation: DEFAULT_MULTI_OUTPUT_ALLOCATION,
    recyclingAllocation: DEFAULT_RECYCLING_ALLOCATION,

    setProductInfo: (info) =>
        set((state) => ({
            productInfo: { ...state.productInfo, ...info },
        })),

    toggleStage: (stageId) =>
        set((state) => {
            const stages = state.stages.includes(stageId)
                ? state.stages.filter((id) => id !== stageId)
                : [...state.stages, stageId]
            return { stages }
        }),

    setActivityData: (id, value) =>
        set((state) => ({
            activityData: { ...state.activityData, [id]: value },
        })),
    
    setActivityDataWithMeta: (id, value, meta) =>
        set((state) => ({
            activityData: { ...state.activityData, [id]: value },
            dataQualityMeta: meta 
                ? { ...state.dataQualityMeta, ...meta }
                : state.dataQualityMeta
        })),
    
    setTransportMode: (mode) =>
        set((state) => ({
            activityData: { ...state.activityData, transport_mode: mode }
        })),
    
    setElectricityGrid: (grid) =>
        set((state) => ({
            activityData: { ...state.activityData, electricity_grid: grid }
        })),
    
    setDataQualityMeta: (meta) =>
        set((state) => ({
            dataQualityMeta: { ...state.dataQualityMeta, ...meta }
        })),
    
    // 할당 관련 Actions
    setMultiOutputAllocationMethod: (method) =>
        set((state) => ({
            multiOutputAllocation: { ...state.multiOutputAllocation, method }
        })),
    
    setPhysicalAllocationBasis: (basis) =>
        set((state) => ({
            multiOutputAllocation: { ...state.multiOutputAllocation, physicalBasis: basis }
        })),
    
    addCoProduct: (coProduct) =>
        set((state) => ({
            multiOutputAllocation: {
                ...state.multiOutputAllocation,
                coProducts: [...state.multiOutputAllocation.coProducts, coProduct]
            }
        })),
    
    removeCoProduct: (id) =>
        set((state) => ({
            multiOutputAllocation: {
                ...state.multiOutputAllocation,
                coProducts: state.multiOutputAllocation.coProducts.filter(p => p.id !== id)
            }
        })),
    
    updateCoProduct: (id, updates) =>
        set((state) => ({
            multiOutputAllocation: {
                ...state.multiOutputAllocation,
                coProducts: state.multiOutputAllocation.coProducts.map(p =>
                    p.id === id ? { ...p, ...updates } : p
                )
            }
        })),
    
    setRecyclingAllocationMethod: (method) =>
        set((state) => ({
            recyclingAllocation: { ...state.recyclingAllocation, method }
        })),
    
    setRecyclingParams: (params) =>
        set((state) => ({
            recyclingAllocation: { ...state.recyclingAllocation, ...params }
        })),
    
    setAllocationJustification: (type, justification) =>
        set((state) => {
            if (type === 'multiOutput') {
                return {
                    multiOutputAllocation: { ...state.multiOutputAllocation, justification }
                }
            } else {
                return {
                    recyclingAllocation: { ...state.recyclingAllocation, justification }
                }
            }
        }),

    reset: () =>
        set({
            productInfo: {
                name: '',
                category: '',
                unit: '1 kg',
                boundary: 'cradle-to-gate',
                referenceFlow: ''
            },
            stages: ['raw_materials', 'manufacturing', 'transport', 'packaging', 'use', 'eol'],
            activityData: {},
            detailedActivityData: undefined,
            dataQualityMeta: DEFAULT_DATA_QUALITY_META,
            multiOutputAllocation: DEFAULT_MULTI_OUTPUT_ALLOCATION,
            recyclingAllocation: DEFAULT_RECYCLING_ALLOCATION
        }),
}))

// =============================================================================
// 유틸리티 함수
// =============================================================================

/**
 * 시스템 경계에 따른 권장 단계 반환
 */
export const getRecommendedStages = (boundary: BoundaryType): string[] => {
    switch (boundary) {
        case 'cradle-to-gate':
            return ['raw_materials', 'manufacturing', 'transport', 'packaging']
        case 'cradle-to-grave':
            return ['raw_materials', 'manufacturing', 'transport', 'packaging', 'use', 'eol']
        case 'gate-to-gate':
            return ['manufacturing']
        default:
            return []
    }
}

/**
 * 단계가 시스템 경계에 포함되는지 확인
 */
export const isStageInBoundary = (stageId: string, boundary: BoundaryType): boolean => {
    const recommended = getRecommendedStages(boundary)
    return recommended.includes(stageId)
}
