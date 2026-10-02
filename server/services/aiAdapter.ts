import { GoogleGenAI } from '@google/genai';
import { config } from '../config/index.js';

export interface ExtractedFact {
  parameter: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag: 'LOW' | 'NORMAL' | 'HIGH' | 'BORDERLINE' | 'CRITICAL' | 'UNKNOWN';
}

export interface AIReportAnalysisRaw {
  reportDate?: string;
  testNames: string[];
  extractedFacts: ExtractedFact[];
  plainLanguageSummary: string;
  abnormalFindings: string[];
  possibleGeneralMeanings: string;
  concerningFindingsNotice?: string;
  relevantSpecialties: string[];
  suggestedQuestionsForDoctor: string[];
  disclaimer: string;
}

export interface IAIProviderAdapter {
  name: string;
  analyzeReport(reportText: string, fileName: string): Promise<AIReportAnalysisRaw>;
}

export class GeminiAIProvider implements IAIProviderAdapter {
  name = 'Gemini-3.8-Flash-Provider';
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: config.geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  async analyzeReport(reportText: string, fileName: string): Promise<AIReportAnalysisRaw> {
    const prompt = `You are a specialized clinical data extraction and patient healthcare-navigation assistant.
Given the following medical/laboratory diagnostic report text from file "${fileName}":

--- BEGIN REPORT CONTENT ---
${reportText.slice(0, 10000)}
--- END REPORT CONTENT ---

CRITICAL INSTRUCTIONS:
1. Extract ONLY facts, test names, values, units, reference ranges, and dates that actually exist in the text.
2. NEVER invent or hallucinate missing information or test results.
3. Compare numerical values strictly against the reference ranges actually present in the text to identify abnormal flags.
4. Summarize the report in simple, compassionate language for a patient.
5. Explain possible general physiological meanings of any abnormal findings.
6. Identify relevant medical specialties (e.g. "Cardiology", "Endocrinology", "Neurology", "General Medicine", "Gastroenterology", "Nephrology").
7. Formulate 3-4 clear, helpful questions the patient can ask their doctor.
8. Highlight any potentially concerning findings that warrant prompt clinical review.
9. DO NOT claim a confirmed diagnosis, prescribe medication, or provide individualized dosages.

Return a strictly valid JSON object matching this schema:
{
  "reportDate": "YYYY-MM-DD or date string found",
  "testNames": ["string"],
  "extractedFacts": [
    {
      "parameter": "string",
      "value": "string",
      "unit": "string",
      "referenceRange": "string",
      "flag": "LOW" | "NORMAL" | "HIGH" | "BORDERLINE" | "CRITICAL" | "UNKNOWN"
    }
  ],
  "plainLanguageSummary": "string",
  "abnormalFindings": ["string"],
  "possibleGeneralMeanings": "string",
  "concerningFindingsNotice": "string or null",
  "relevantSpecialties": ["string"],
  "suggestedQuestionsForDoctor": ["string"],
  "disclaimer": "AI-generated information is for educational and healthcare-navigation purposes only. It is not a diagnosis or a substitute for professional medical advice."
}`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    parsed.disclaimer = 'AI-generated information is for educational and healthcare-navigation purposes only. It is not a diagnosis or a substitute for professional medical advice.';
    return parsed;
  }
}

export class MockDevelopmentAIProvider implements IAIProviderAdapter {
  name = 'Development-Fallback-Provider';

  async analyzeReport(reportText: string, fileName: string): Promise<AIReportAnalysisRaw> {
    const textLower = (reportText + ' ' + fileName).toLowerCase();
    
    // Check if it looks like a lipid panel
    if (textLower.includes('lipid') || textLower.includes('cholesterol') || textLower.includes('cardio') || textLower.includes('triglyceride')) {
      return {
        reportDate: new Date().toISOString().split('T')[0],
        testNames: ['Lipid Profile', 'Cardiovascular Risk Markers'],
        extractedFacts: [
          { parameter: 'Total Cholesterol', value: '238', unit: 'mg/dL', referenceRange: '125 - 200', flag: 'HIGH' },
          { parameter: 'HDL Cholesterol (Direct)', value: '54', unit: 'mg/dL', referenceRange: '> 40 (Optimal: > 50)', flag: 'NORMAL' },
          { parameter: 'LDL Cholesterol (Calculated)', value: '154', unit: 'mg/dL', referenceRange: '< 100 (Optimal)', flag: 'HIGH' },
          { parameter: 'Triglycerides', value: '152', unit: 'mg/dL', referenceRange: '< 150', flag: 'BORDERLINE' },
          { parameter: 'hs-CRP (Cardiac Risk)', value: '2.8', unit: 'mg/L', referenceRange: '< 1.0 (Low Risk)', flag: 'HIGH' }
        ],
        plainLanguageSummary: 'The diagnostic report measures circulating blood fats and a general marker of inflammation. Total cholesterol and LDL (often termed "bad" cholesterol) are higher than standard target ranges, while HDL protective cholesterol is within desirable boundaries.',
        abnormalFindings: [
          'LDL Cholesterol at 154 mg/dL exceeds normal reference (<100 mg/dL).',
          'Total Cholesterol at 238 mg/dL is elevated above normal threshold (<200 mg/dL).',
          'hs-CRP at 2.8 mg/L indicates moderate non-specific vascular inflammation.'
        ],
        possibleGeneralMeanings: 'Higher levels of LDL cholesterol and elevated hs-CRP can be associated with increased cardiovascular risk and vascular plaque progression. These findings often benefit from medical review to discuss lifestyle factors, dietary modifications, and prospective medical therapies.',
        concerningFindingsNotice: 'Elevated LDL combined with high hs-CRP suggests heightened cardiovascular risk profile. An evaluation by a cardiologist is recommended.',
        relevantSpecialties: ['Cardiology', 'Internal Medicine', 'Preventive Care'],
        suggestedQuestionsForDoctor: [
          'What is my overall 10-year atherosclerotic cardiovascular disease (ASCVD) risk score?',
          'Should I start a lipid-lowering medication (such as a statin) or initiate a structured dietary/exercise trial first?',
          'Are further non-invasive tests, such as a coronary artery calcium (CAC) scan, indicated for me?',
          'When should my lipid panel and hs-CRP be repeated to check response?'
        ],
        disclaimer: 'AI-generated information is for educational and healthcare-navigation purposes only. It is not a diagnosis or a substitute for professional medical advice.'
      };
    }

    // Check if it looks like glucose / diabetes / metabolic
    if (textLower.includes('glucose') || textLower.includes('a1c') || textLower.includes('metabolic') || textLower.includes('diabetes')) {
      return {
        reportDate: new Date().toISOString().split('T')[0],
        testNames: ['Comprehensive Metabolic Panel & Glycated Hemoglobin (HbA1c)'],
        extractedFacts: [
          { parameter: 'Fasting Plasma Glucose', value: '118', unit: 'mg/dL', referenceRange: '70 - 99', flag: 'HIGH' },
          { parameter: 'HbA1c', value: '6.1', unit: '%', referenceRange: '< 5.7', flag: 'HIGH' },
          { parameter: 'eGFR', value: '88', unit: 'mL/min/1.73m²', referenceRange: '> 60', flag: 'NORMAL' },
          { parameter: 'Serum Creatinine', value: '0.9', unit: 'mg/dL', referenceRange: '0.7 - 1.3', flag: 'NORMAL' }
        ],
        plainLanguageSummary: 'The test reveals fasting blood sugar and average 3-month blood sugar (HbA1c) levels that sit above normal baseline ranges, aligning with prediabetes criteria. Kidney filtration indicators remain healthy and normal.',
        abnormalFindings: [
          'Fasting Glucose is 118 mg/dL (Reference: 70 - 99 mg/dL).',
          'HbA1c is 6.1% (Reference: < 5.7% Normal, 5.7 - 6.4% Prediabetes).'
        ],
        possibleGeneralMeanings: 'An HbA1c between 5.7% and 6.4% indicates impaired fasting glucose / prediabetes. This implies the body is having mild difficulty clearing sugar efficiently from the bloodstream. Timely lifestyle or medical interventions often reverse or halt progression.',
        concerningFindingsNotice: 'Fasting glucose and HbA1c are elevated into prediabetic range. Clinical assessment by an Endocrinologist is advised.',
        relevantSpecialties: ['Endocrinology', 'Internal Medicine'],
        suggestedQuestionsForDoctor: [
          'What nutritional changes are most impactful for lowering HbA1c back below 5.7%?',
          'Would continuous glucose monitoring (CGM) or dietary counseling be helpful for me?',
          'How soon should we re-evaluate my HbA1c and lipid panel?'
        ],
        disclaimer: 'AI-generated information is for educational and healthcare-navigation purposes only. It is not a diagnosis or a substitute for professional medical advice.'
      };
    }

    // General diagnostic fallback
    return {
      reportDate: new Date().toISOString().split('T')[0],
      testNames: ['Diagnostic Blood & Chemistry Panel'],
      extractedFacts: [
        { parameter: 'Hemoglobin (Hb)', value: '14.2', unit: 'g/dL', referenceRange: '13.5 - 17.5', flag: 'NORMAL' },
        { parameter: 'Total White Blood Cell Count (WBC)', value: '6.8', unit: 'x10^3/uL', referenceRange: '4.5 - 11.0', flag: 'NORMAL' },
        { parameter: 'Serum Ferritin', value: '18', unit: 'ng/mL', referenceRange: '30 - 400', flag: 'LOW' }
      ],
      plainLanguageSummary: 'General hematology and iron storage assessment. General blood cell counts are within standard healthy limits, while iron storage reserves (ferritin) appear lower than target baseline.',
      abnormalFindings: [
        'Serum Ferritin at 18 ng/mL is below standard threshold (>30 ng/mL).'
      ],
      possibleGeneralMeanings: 'Low ferritin may indicate depleted body iron stores even when active hemoglobin counts remain normal. This can contribute to fatigue, decreased exercise tolerance, or brittle nails.',
      concerningFindingsNotice: 'Iron store depletion noted. Discuss dietary iron intake or supplementation with your physician.',
      relevantSpecialties: ['Internal Medicine', 'Hematology'],
      suggestedQuestionsForDoctor: [
        'Is oral iron supplementation recommended given my low ferritin level?',
        'Are there any potential gastrointestinal or dietary causes for low iron stores?',
        'When should ferritin and iron saturation be rechecked?'
      ],
      disclaimer: 'AI-generated information is for educational and healthcare-navigation purposes only. It is not a diagnosis or a substitute for professional medical advice.'
    };
  }
}
