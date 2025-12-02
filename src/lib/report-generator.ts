/**
 * ISO 14067 CFP 보고서 생성기
 * 
 * Store 데이터를 수집하여 CFP 보고서 데이터로 변환
 */

import { PCFState } from './store'
import {
    CFPReportData,
    CFP_REPORT_REQUIREMENTS,
    CFP_REPORT_ADDITIONAL_REQUIREMENTS,
    REPORT_SECTIONS,
    generateReportId,
    checkRequirementStatus,
    calculateComplianceScore,
    ReportExportOptions,
    DEFAULT_EXPORT_OPTIONS
} from './report-template'
import {
    MULTI_OUTPUT_ALLOCATION_METHODS,
    RECYCLING_ALLOCATION_METHODS
} from './allocation'
import {
    LIMITATION_SINGLE_IMPACT,
    METHODOLOGY_LIMITATIONS,
    getApplicableLimitations,
    EMISSION_FACTOR_SOURCES,
    GHG_LIST
} from './iso14067-constants'
import {
    DQI_LEVEL_LABELS,
    calculateDQI,
    getDQILevel
} from './data-quality'
import {
    ELECTRICITY_EMISSION_FACTORS,
    TRANSPORT_EMISSION_FACTORS,
    MATERIAL_EMISSION_FACTORS,
    EOL_EMISSION_FACTORS
} from './emission-factors'

// =============================================================================
// 단계 라벨
// =============================================================================

const STAGE_LABELS: Record<string, { en: string, ko: string }> = {
    raw_materials: { en: 'Raw Materials Acquisition', ko: '원료 채취' },
    manufacturing: { en: 'Manufacturing', ko: '제조' },
    transport: { en: 'Transportation', ko: '운송' },
    packaging: { en: 'Packaging', ko: '포장' },
    use: { en: 'Use Phase', ko: '사용' },
    eol: { en: 'End-of-Life', ko: '폐기' }
}

const BOUNDARY_LABELS: Record<string, { en: string, ko: string }> = {
    'cradle-to-gate': { en: 'Cradle-to-Gate', ko: '요람에서 출하까지' },
    'cradle-to-grave': { en: 'Cradle-to-Grave', ko: '요람에서 무덤까지' },
    'gate-to-gate': { en: 'Gate-to-Gate', ko: '공장 내' }
}

// =============================================================================
// 계산 결과 인터페이스
// =============================================================================

export interface CalculatedResults {
    totalCFP: number
    fossilEmissions: number
    biogenicEmissions: number
    aircraftEmissions: number
    dlucEmissions: number
    stageBreakdown: { stage: string, stageKo: string, emission: number, percentage: number }[]
    uncertainty: number
}

export interface SensitivityAnalysisData {
    performed: boolean
    analysisDate?: string
    baselineCFP: number
    significantFactors: string[]
    scenarios: {
        name: string
        type: string
        baseValue: string | number
        alternativeValue: string | number
        percentageChange: number
        isSignificant: boolean
    }[]
    recommendations: string[]
    isoCompliance: {
        clause: string
        requirement: string
        satisfied: boolean
    }[]
}

// =============================================================================
// 보고서 데이터 생성
// =============================================================================

/**
 * Store 상태에서 보고서 데이터 생성
 */
export const generateReportData = (
    state: PCFState,
    calculatedResults: CalculatedResults,
    sensitivityData?: SensitivityAnalysisData
): CFPReportData => {
    const {
        productInfo,
        stages,
        activityData,
        dataQualityMeta,
        multiOutputAllocation,
        recyclingAllocation
    } = state

    // 적용 가능한 제한사항
    const applicableLimitations = getApplicableLimitations(
        productInfo.boundary,
        stages,
        dataQualityMeta.overallType
    )

    // 준수 체크리스트 생성
    const complianceChecklist = [...CFP_REPORT_REQUIREMENTS, ...CFP_REPORT_ADDITIONAL_REQUIREMENTS]
        .map(req => ({
            requirementId: req.id,
            status: 'complete' as const, // 기본값, 실제로는 checkRequirementStatus 사용
            notes: ''
        }))

    const reportData: CFPReportData = {
        // 메타데이터
        reportId: generateReportId(),
        reportDate: new Date().toISOString().split('T')[0],
        reportVersion: '1.0',
        
        // 제품 정보
        product: {
            name: productInfo.name || '미지정 제품',
            description: `${productInfo.category} 카테고리의 제품`,
            category: productInfo.category || '미지정',
            functionalUnit: productInfo.unit || '1 kg',
            referenceFlow: productInfo.referenceFlow || productInfo.unit
        },
        
        // 연구 범위
        scope: {
            goal: 'ISO 14067:2018에 따른 제품 탄소발자국(CFP) 정량화',
            intendedApplication: '내부 환경 관리 및 제품 환경 정보 공개',
            systemBoundary: BOUNDARY_LABELS[productInfo.boundary]?.ko || productInfo.boundary,
            lifecycleStages: stages.map(s => STAGE_LABELS[s]?.ko || s),
            exclusions: getExcludedStages(productInfo.boundary, stages),
            cutOffCriteria: '질량 기준 1%, 에너지 기준 1%, 환경 영향 기준 1%'
        },
        
        // 방법론
        methodology: {
            standard: 'ISO 14067:2018',
            gwpSource: 'IPCC AR6 (제6차 평가 보고서)',
            gwpTimeHorizon: '100년',
            ghgList: GHG_LIST.slice(0, 7).map(ghg => ({
                formula: ghg.formula,
                name: ghg.name,
                gwp: typeof ghg.gwp100_ar6 === 'number' ? ghg.gwp100_ar6 : 0
            })),
            emissionFactorSources: [
                { name: EMISSION_FACTOR_SOURCES.korea_lci.name, year: EMISSION_FACTOR_SOURCES.korea_lci.year, region: '한국' },
                { name: EMISSION_FACTOR_SOURCES.ecoinvent.name, year: EMISSION_FACTOR_SOURCES.ecoinvent.year, region: '글로벌' },
                { name: EMISSION_FACTOR_SOURCES.ipcc.name, year: EMISSION_FACTOR_SOURCES.ipcc.year, region: '글로벌' }
            ],
            allocationMethod: MULTI_OUTPUT_ALLOCATION_METHODS[multiOutputAllocation.method].nameKo,
            allocationJustification: multiOutputAllocation.justification || '해당 공정은 단일 제품 생산으로 할당이 필요하지 않음',
            recyclingAllocationMethod: RECYCLING_ALLOCATION_METHODS[recyclingAllocation.method].nameKo,
            recyclingAllocationJustification: recyclingAllocation.justification || 'Cut-off 방법 적용 - 보수적 접근',
            dataQualityAssessment: `Pedigree Matrix 기반 DQI 평가, 전체 데이터 유형: ${
                dataQualityMeta.overallType === 'primary' ? '1차 데이터' : 
                dataQualityMeta.overallType === 'secondary' ? '2차 데이터' : '추정 데이터'
            }`
        },
        
        // 결과
        results: {
            totalCFP: calculatedResults.totalCFP,
            unit: `kg CO₂e / ${productInfo.unit}`,
            fossilEmissions: calculatedResults.fossilEmissions,
            biogenicEmissions: calculatedResults.biogenicEmissions,
            dlucEmissions: calculatedResults.dlucEmissions,
            aircraftEmissions: calculatedResults.aircraftEmissions,
            offsetEmissions: 0,
            stageBreakdown: calculatedResults.stageBreakdown,
            uncertaintyRange: {
                min: calculatedResults.totalCFP * (1 - calculatedResults.uncertainty / 100),
                max: calculatedResults.totalCFP * (1 + calculatedResults.uncertainty / 100)
            },
            uncertaintyPercentage: calculatedResults.uncertainty
        },
        
        // 데이터 품질
        dataQuality: {
            overallType: dataQualityMeta.overallType === 'primary' ? '1차 데이터' : 
                        dataQualityMeta.overallType === 'secondary' ? '2차 데이터' : '추정 데이터',
            primaryDataShare: dataQualityMeta.overallType === 'primary' ? 80 : 20,
            secondaryDataShare: dataQualityMeta.overallType === 'secondary' ? 80 : 20,
            sources: dataQualityMeta.sources,
            baseYear: dataQualityMeta.baseYear
        },
        
        // 제한사항
        limitations: {
            singleImpact: LIMITATION_SINGLE_IMPACT.description,
            methodologyLimitations: applicableLimitations.map(l => l.description),
            dataLimitations: [
                '사용된 배출계수는 2차 데이터 기반이며, 실제 공급망 데이터와 차이가 있을 수 있음',
                '일부 미량 원료 및 보조 물질은 Cut-off 기준에 따라 제외됨'
            ],
            assumptions: [
                '전력 배출계수는 국가 평균 그리드 배출계수 적용',
                '운송 거리 및 모드는 대표적인 시나리오 기반',
                productInfo.boundary === 'cradle-to-gate' 
                    ? '사용 및 폐기 단계는 시스템 경계에서 제외'
                    : '폐기 시나리오는 일반적인 처리 방법 가정'
            ]
        },
        
        // 결론
        conclusions: {
            keyFindings: generateKeyFindings(calculatedResults, stages),
            recommendations: [
                '주요 배출 단계에 대한 저감 방안 검토',
                '1차 데이터 수집을 통한 정확도 향상',
                '공급망 협력을 통한 배출계수 개선'
            ],
            improvementOpportunities: generateImprovementOpportunities(calculatedResults)
        },
        
        // 민감도 분석 (ISO 14067 7.3 h)
        sensitivityAnalysis: sensitivityData ? {
            performed: sensitivityData.performed,
            analysisDate: sensitivityData.analysisDate,
            baselineCFP: sensitivityData.baselineCFP,
            significantFactors: sensitivityData.significantFactors,
            scenarios: sensitivityData.scenarios.map(s => ({
                name: s.name,
                type: s.type,
                baseValue: s.baseValue,
                alternativeValue: s.alternativeValue,
                percentageChange: s.percentageChange,
                isSignificant: s.isSignificant
            })),
            recommendations: sensitivityData.recommendations,
            isoCompliance: sensitivityData.isoCompliance
        } : undefined,
        
        // 준수 체크리스트
        complianceChecklist
    }

    return reportData
}

/**
 * 제외된 단계 목록 생성
 */
const getExcludedStages = (boundary: string, includedStages: string[]): string[] => {
    const allStages = ['raw_materials', 'manufacturing', 'transport', 'packaging', 'use', 'eol']
    const excluded = allStages.filter(s => !includedStages.includes(s))
    
    return excluded.map(s => STAGE_LABELS[s]?.ko || s)
}

/**
 * 주요 발견사항 생성
 */
const generateKeyFindings = (results: CalculatedResults, stages: string[]): string[] => {
    const findings: string[] = []
    
    // 총 CFP
    findings.push(`총 탄소발자국은 ${results.totalCFP.toFixed(2)} kg CO₂e입니다.`)
    
    // 최대 기여 단계
    if (results.stageBreakdown.length > 0) {
        const maxStage = results.stageBreakdown.reduce((a, b) => 
            Math.abs(a.emission) > Math.abs(b.emission) ? a : b
        )
        if (maxStage.emission > 0) {
            findings.push(`${maxStage.stageKo} 단계가 전체 배출의 ${maxStage.percentage.toFixed(1)}%로 가장 큰 기여를 합니다.`)
        }
    }
    
    // 화석 vs 생물기원
    if (results.fossilEmissions > 0) {
        const fossilRatio = (results.fossilEmissions / results.totalCFP) * 100
        findings.push(`화석 기원 배출이 전체의 ${fossilRatio.toFixed(1)}%를 차지합니다.`)
    }
    
    // 항공 운송
    if (results.aircraftEmissions > 0) {
        findings.push(`항공 운송으로 인한 배출은 ${results.aircraftEmissions.toFixed(2)} kg CO₂e입니다.`)
    }
    
    // 불확실성
    findings.push(`추정 불확실성 범위는 ±${results.uncertainty.toFixed(0)}%입니다.`)
    
    return findings
}

/**
 * 개선 기회 생성
 */
const generateImprovementOpportunities = (results: CalculatedResults): string[] => {
    const opportunities: string[] = []
    
    // 상위 기여 단계별 개선 제안
    const sortedStages = [...results.stageBreakdown]
        .filter(s => s.emission > 0)
        .sort((a, b) => b.emission - a.emission)
    
    for (const stage of sortedStages.slice(0, 3)) {
        switch (stage.stage) {
            case 'raw_materials':
                opportunities.push('저탄소 원료 대체 또는 재활용 원료 사용 비율 증가')
                break
            case 'manufacturing':
                opportunities.push('제조 공정 에너지 효율 개선 및 재생에너지 사용 확대')
                break
            case 'transport':
                opportunities.push('운송 거리 최적화 및 저탄소 운송 모드 전환')
                break
            case 'packaging':
                opportunities.push('포장재 경량화 및 친환경 포장재 사용')
                break
            case 'use':
                opportunities.push('사용 단계 에너지 효율 개선')
                break
            case 'eol':
                opportunities.push('재활용률 향상 및 순환 경제 설계 적용')
                break
        }
    }
    
    return opportunities
}

// =============================================================================
// 보고서 HTML 생성
// =============================================================================

/**
 * HTML 보고서 생성
 */
export const generateHTMLReport = (
    reportData: CFPReportData,
    options: ReportExportOptions = DEFAULT_EXPORT_OPTIONS
): string => {
    const lang = options.language === 'en' ? 'en' : 'ko'
    
    return `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CFP 연구 보고서 - ${reportData.product.name}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background: #fff;
            padding: 40px;
            max-width: 210mm;
            margin: 0 auto;
        }
        @media print {
            body { padding: 20px; }
            .no-print { display: none; }
            .page-break { page-break-before: always; }
        }
        h1 { font-size: 24px; font-weight: 700; margin-bottom: 20px; color: #0f172a; }
        h2 { font-size: 18px; font-weight: 600; margin: 30px 0 15px; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
        h3 { font-size: 14px; font-weight: 600; margin: 20px 0 10px; color: #334155; }
        p { margin-bottom: 12px; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
        th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
        th { background: #f8fafc; font-weight: 600; color: #475569; }
        .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #3b82f6; }
        .header h1 { font-size: 28px; color: #1e40af; }
        .meta { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 12px; color: #64748b; }
        .result-box { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0; }
        .result-box .value { font-size: 48px; font-weight: 700; }
        .result-box .unit { font-size: 16px; opacity: 0.9; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
        .card { background: #f8fafc; border-radius: 8px; padding: 15px; }
        .card .label { font-size: 11px; color: #64748b; margin-bottom: 5px; }
        .card .value { font-size: 20px; font-weight: 700; color: #1e293b; }
        .chart-bar { background: #e2e8f0; border-radius: 4px; overflow: hidden; height: 20px; margin: 5px 0; }
        .chart-bar-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #8b5cf6); }
        .limitation { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 10px 0; font-size: 12px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; }
        ul { padding-left: 20px; margin: 10px 0; }
        li { margin: 5px 0; font-size: 13px; }
    </style>
</head>
<body>
    ${options.includeCoverPage ? generateCoverPage(reportData) : ''}
    
    <div class="meta">
        <span>보고서 ID: ${reportData.reportId}</span>
        <span>작성일: ${reportData.reportDate}</span>
        <span>버전: ${reportData.reportVersion}</span>
    </div>

    <h2>1. 요약 (Executive Summary)</h2>
    <div class="result-box">
        <div class="value">${reportData.results.totalCFP.toFixed(2)}</div>
        <div class="unit">${reportData.results.unit}</div>
    </div>
    <p>본 연구는 <strong>${reportData.product.name}</strong>의 탄소발자국(CFP)을 ISO 14067:2018에 따라 산정하였습니다. 
    시스템 경계는 <strong>${reportData.scope.systemBoundary}</strong>이며, 
    총 탄소발자국은 <strong>${reportData.results.totalCFP.toFixed(2)} ${reportData.results.unit}</strong>입니다.</p>

    <h2>2. 제품 정보 (Product Information)</h2>
    <table>
        <tr><th>항목</th><th>내용</th></tr>
        <tr><td>제품명</td><td>${reportData.product.name}</td></tr>
        <tr><td>카테고리</td><td>${reportData.product.category}</td></tr>
        <tr><td>기능 단위</td><td>${reportData.product.functionalUnit}</td></tr>
        <tr><td>기준 흐름</td><td>${reportData.product.referenceFlow}</td></tr>
    </table>

    <h2>3. 연구 목적 및 범위 (Goal and Scope)</h2>
    <h3>3.1 연구 목적</h3>
    <p>${reportData.scope.goal}</p>
    
    <h3>3.2 시스템 경계</h3>
    <p>시스템 경계: <strong>${reportData.scope.systemBoundary}</strong></p>
    <p>포함된 생애주기 단계:</p>
    <ul>
        ${reportData.scope.lifecycleStages.map(s => `<li>${s}</li>`).join('')}
    </ul>
    ${reportData.scope.exclusions && reportData.scope.exclusions.length > 0 ? `
    <p>제외된 단계: ${reportData.scope.exclusions.join(', ')}</p>
    ` : ''}
    
    <h3>3.3 Cut-off 기준</h3>
    <p>${reportData.scope.cutOffCriteria}</p>

    <div class="page-break"></div>

    <h2>4. 방법론 (Methodology)</h2>
    <table>
        <tr><th>항목</th><th>내용</th></tr>
        <tr><td>적용 표준</td><td>${reportData.methodology.standard}</td></tr>
        <tr><td>GWP 출처</td><td>${reportData.methodology.gwpSource}</td></tr>
        <tr><td>GWP 시간 범위</td><td>${reportData.methodology.gwpTimeHorizon}</td></tr>
        <tr><td>다중출력 할당</td><td>${reportData.methodology.allocationMethod}</td></tr>
        <tr><td>재활용 할당</td><td>${reportData.methodology.recyclingAllocationMethod}</td></tr>
    </table>

    <h3>4.1 고려된 온실가스</h3>
    <table>
        <tr><th>화학식</th><th>명칭</th><th>GWP (100년)</th></tr>
        ${reportData.methodology.ghgList.map(g => `
        <tr><td>${g.formula}</td><td>${g.name}</td><td>${g.gwp}</td></tr>
        `).join('')}
    </table>

    <h3>4.2 배출계수 출처</h3>
    <ul>
        ${reportData.methodology.emissionFactorSources.map(s => `
        <li>${s.name} (${s.year}, ${s.region})</li>
        `).join('')}
    </ul>

    <h2>5. CFP 결과 (Results)</h2>
    <div class="grid">
        <div class="card">
            <div class="label">화석 GHG 배출</div>
            <div class="value">${reportData.results.fossilEmissions.toFixed(2)}</div>
            <div class="label">kg CO₂e</div>
        </div>
        <div class="card">
            <div class="label">생물기원 GHG 배출</div>
            <div class="value">${reportData.results.biogenicEmissions.toFixed(2)}</div>
            <div class="label">kg CO₂e</div>
        </div>
        <div class="card">
            <div class="label">항공 운송 GHG</div>
            <div class="value">${reportData.results.aircraftEmissions.toFixed(2)}</div>
            <div class="label">kg CO₂e</div>
        </div>
    </div>

    <h3>5.1 단계별 배출량</h3>
    <table>
        <tr><th>생애주기 단계</th><th>배출량 (kg CO₂e)</th><th>기여율 (%)</th><th>그래프</th></tr>
        ${reportData.results.stageBreakdown.map(s => `
        <tr>
            <td>${s.stage}</td>
            <td>${s.emission.toFixed(2)}</td>
            <td>${s.percentage.toFixed(1)}%</td>
            <td>
                <div class="chart-bar">
                    <div class="chart-bar-fill" style="width: ${Math.abs(s.percentage)}%"></div>
                </div>
            </td>
        </tr>
        `).join('')}
    </table>

    <h3>5.2 불확실성</h3>
    <p>추정 불확실성 범위: <strong>±${reportData.results.uncertaintyPercentage.toFixed(0)}%</strong></p>
    <p>결과 범위: ${reportData.results.uncertaintyRange.min.toFixed(2)} ~ ${reportData.results.uncertaintyRange.max.toFixed(2)} kg CO₂e</p>

    <div class="page-break"></div>

    <h2>6. 데이터 품질 (Data Quality)</h2>
    <table>
        <tr><th>항목</th><th>내용</th></tr>
        <tr><td>전체 데이터 유형</td><td>${reportData.dataQuality.overallType}</td></tr>
        <tr><td>1차 데이터 비율</td><td>${reportData.dataQuality.primaryDataShare}%</td></tr>
        <tr><td>2차 데이터 비율</td><td>${reportData.dataQuality.secondaryDataShare}%</td></tr>
        <tr><td>기준 연도</td><td>${reportData.dataQuality.baseYear}</td></tr>
        <tr><td>데이터 출처</td><td>${reportData.dataQuality.sources.join(', ')}</td></tr>
    </table>

    <h2>7. 제한사항 및 가정 (Limitations)</h2>
    <div class="limitation">
        <strong>단일 환경 영향 지표:</strong> ${reportData.limitations.singleImpact}
    </div>
    
    <h3>7.1 방법론 제한사항</h3>
    <ul>
        ${reportData.limitations.methodologyLimitations.map(l => `<li>${l}</li>`).join('')}
    </ul>

    <h3>7.2 가정</h3>
    <ul>
        ${reportData.limitations.assumptions.map(a => `<li>${a}</li>`).join('')}
    </ul>

    ${reportData.sensitivityAnalysis?.performed ? `
    <div class="page-break"></div>

    <h2>8. 민감도 분석 (Sensitivity Analysis)</h2>
    <p>ISO 14067 조항 6.4.5, 6.4.6.1, 6.4.9.4, 6.6에 따라 민감도 분석을 수행하였습니다.</p>
    
    <table>
        <tr><th>항목</th><th>내용</th></tr>
        <tr><td>분석 일자</td><td>${reportData.sensitivityAnalysis.analysisDate || reportData.reportDate}</td></tr>
        <tr><td>기준 CFP</td><td>${reportData.sensitivityAnalysis.baselineCFP.toFixed(2)} kg CO₂e</td></tr>
        <tr><td>분석 시나리오 수</td><td>${reportData.sensitivityAnalysis.scenarios.length}개</td></tr>
        <tr><td>유의미한 영향 요인</td><td>${reportData.sensitivityAnalysis.significantFactors.length}개</td></tr>
    </table>

    ${reportData.sensitivityAnalysis.significantFactors.length > 0 ? `
    <h3>8.1 유의미한 영향 요인</h3>
    <p>다음 요인들이 CFP 결과에 5% 이상의 영향을 미치는 것으로 분석되었습니다:</p>
    <ul>
        ${reportData.sensitivityAnalysis.significantFactors.map(f => `<li>${f}</li>`).join('')}
    </ul>
    ` : ''}

    <h3>8.2 시나리오 분석 결과</h3>
    <table>
        <tr><th>시나리오</th><th>유형</th><th>기준값</th><th>대안값</th><th>변화율</th><th>유의성</th></tr>
        ${reportData.sensitivityAnalysis.scenarios.slice(0, 10).map(s => `
        <tr>
            <td>${s.name}</td>
            <td>${s.type}</td>
            <td>${s.baseValue}</td>
            <td>${s.alternativeValue}</td>
            <td style="color: ${s.percentageChange >= 0 ? '#dc2626' : '#16a34a'}">
                ${s.percentageChange >= 0 ? '+' : ''}${s.percentageChange.toFixed(1)}%
            </td>
            <td>${s.isSignificant ? '⚠️ 유의미' : '정상'}</td>
        </tr>
        `).join('')}
    </table>

    <h3>8.3 ISO 14067 준수 현황</h3>
    <table>
        <tr><th>조항</th><th>요구사항</th><th>준수</th></tr>
        ${reportData.sensitivityAnalysis.isoCompliance.map(c => `
        <tr>
            <td>${c.clause}</td>
            <td>${c.requirement}</td>
            <td style="color: ${c.satisfied ? '#16a34a' : '#dc2626'}">
                ${c.satisfied ? '✓ 준수' : '✗ 미준수'}
            </td>
        </tr>
        `).join('')}
    </table>

    <h3>8.4 권장사항</h3>
    <ul>
        ${reportData.sensitivityAnalysis.recommendations.map(r => `<li>${r}</li>`).join('')}
    </ul>
    ` : ''}

    <h2>${reportData.sensitivityAnalysis?.performed ? '9' : '8'}. 결론 (Conclusions)</h2>
    <h3>${reportData.sensitivityAnalysis?.performed ? '9' : '8'}.1 주요 발견사항</h3>
    <ul>
        ${reportData.conclusions?.keyFindings.map(f => `<li>${f}</li>`).join('')}
    </ul>

    <h3>${reportData.sensitivityAnalysis?.performed ? '9' : '8'}.2 개선 기회</h3>
    <ul>
        ${reportData.conclusions?.improvementOpportunities?.map(o => `<li>${o}</li>`).join('')}
    </ul>

    <div class="footer">
        <p>본 보고서는 ISO 14067:2018에 따라 작성되었습니다.</p>
        <p>보고서 ID: ${reportData.reportId} | 작성일: ${reportData.reportDate}</p>
        <p>© ${new Date().getFullYear()} CFP Calculator Platform</p>
    </div>
</body>
</html>`
}

/**
 * 커버 페이지 생성
 */
const generateCoverPage = (reportData: CFPReportData): string => {
    return `
    <div class="header">
        <h1>제품 탄소발자국 (CFP) 연구 보고서</h1>
        <h1 style="font-size: 18px; color: #64748b; margin-top: 10px;">Product Carbon Footprint Study Report</h1>
        <p style="margin-top: 30px; font-size: 24px; font-weight: 600;">${reportData.product.name}</p>
        <p style="margin-top: 20px; font-size: 14px; color: #64748b;">ISO 14067:2018 준수</p>
    </div>
    `
}

// =============================================================================
// 보고서 Markdown 생성
// =============================================================================

/**
 * Markdown 보고서 생성
 */
export const generateMarkdownReport = (reportData: CFPReportData): string => {
    return `# CFP 연구 보고서: ${reportData.product.name}

**보고서 ID:** ${reportData.reportId}  
**작성일:** ${reportData.reportDate}  
**버전:** ${reportData.reportVersion}

---

## 1. 요약

| 항목 | 값 |
|------|------|
| **총 탄소발자국** | ${reportData.results.totalCFP.toFixed(2)} kg CO₂e |
| **기능 단위** | ${reportData.product.functionalUnit} |
| **시스템 경계** | ${reportData.scope.systemBoundary} |

---

## 2. 제품 정보

- **제품명:** ${reportData.product.name}
- **카테고리:** ${reportData.product.category}
- **기능 단위:** ${reportData.product.functionalUnit}
- **기준 흐름:** ${reportData.product.referenceFlow}

---

## 3. 연구 범위

### 3.1 연구 목적
${reportData.scope.goal}

### 3.2 시스템 경계
${reportData.scope.systemBoundary}

### 3.3 포함된 생애주기 단계
${reportData.scope.lifecycleStages.map(s => `- ${s}`).join('\n')}

---

## 4. 방법론

| 항목 | 내용 |
|------|------|
| 적용 표준 | ${reportData.methodology.standard} |
| GWP 출처 | ${reportData.methodology.gwpSource} |
| 다중출력 할당 | ${reportData.methodology.allocationMethod} |
| 재활용 할당 | ${reportData.methodology.recyclingAllocationMethod} |

---

## 5. CFP 결과

### 5.1 GHG 배출 분류

| 분류 | 배출량 (kg CO₂e) |
|------|-----------------|
| 화석 GHG | ${reportData.results.fossilEmissions.toFixed(2)} |
| 생물기원 GHG | ${reportData.results.biogenicEmissions.toFixed(2)} |
| 항공 운송 GHG | ${reportData.results.aircraftEmissions.toFixed(2)} |

### 5.2 단계별 배출량

| 단계 | 배출량 (kg CO₂e) | 기여율 |
|------|-----------------|-------|
${reportData.results.stageBreakdown.map(s => 
    `| ${s.stage} | ${s.emission.toFixed(2)} | ${s.percentage.toFixed(1)}% |`
).join('\n')}

### 5.3 불확실성
- **추정 범위:** ±${reportData.results.uncertaintyPercentage.toFixed(0)}%
- **결과 범위:** ${reportData.results.uncertaintyRange.min.toFixed(2)} ~ ${reportData.results.uncertaintyRange.max.toFixed(2)} kg CO₂e

---

## 6. 민감도 분석

${reportData.sensitivityAnalysis?.performed ? `
### 6.1 분석 개요
- **분석 일자:** ${reportData.sensitivityAnalysis.analysisDate || '미지정'}
- **기준 CFP:** ${reportData.sensitivityAnalysis.baselineCFP.toFixed(2)} kg CO₂e
- **유의미한 영향 요인:** ${reportData.sensitivityAnalysis.significantFactors.length}개

### 6.2 유의미한 영향 요인 (>5% 변화)
${reportData.sensitivityAnalysis.significantFactors.length > 0 
    ? reportData.sensitivityAnalysis.significantFactors.map(f => `- ${f}`).join('\n')
    : '- 유의미한 영향 요인 없음'}

### 6.3 주요 시나리오 결과
| 시나리오 | 유형 | 기준값 | 대안값 | 변화율 |
|---------|------|--------|--------|--------|
${reportData.sensitivityAnalysis.scenarios
    .filter(s => s.isSignificant)
    .slice(0, 10)
    .map(s => `| ${s.name} | ${s.type} | ${s.baseValue} | ${s.alternativeValue} | ${s.percentageChange >= 0 ? '+' : ''}${s.percentageChange.toFixed(1)}% |`)
    .join('\n')}

### 6.4 ISO 14067 준수 현황
${reportData.sensitivityAnalysis.isoCompliance.map(c => 
    `- ${c.satisfied ? '✓' : '✗'} **${c.clause}**: ${c.requirement}`
).join('\n')}

### 6.5 권장사항
${reportData.sensitivityAnalysis.recommendations.map(r => `- ${r}`).join('\n')}
` : '민감도 분석이 수행되지 않았습니다.'}

---

## 7. 제한사항

> ⚠️ **단일 환경 영향:** ${reportData.limitations.singleImpact}

### 가정
${reportData.limitations.assumptions.map(a => `- ${a}`).join('\n')}

---

## 8. 결론

### 주요 발견사항
${reportData.conclusions?.keyFindings.map(f => `- ${f}`).join('\n')}

### 개선 기회
${reportData.conclusions?.improvementOpportunities?.map(o => `- ${o}`).join('\n')}

---

*본 보고서는 ISO 14067:2018에 따라 작성되었습니다.*
`
}

// =============================================================================
// 보고서 JSON 내보내기
// =============================================================================

/**
 * JSON 보고서 생성
 */
export const generateJSONReport = (reportData: CFPReportData): string => {
    return JSON.stringify(reportData, null, 2)
}

