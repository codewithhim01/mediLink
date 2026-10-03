import { db } from '../db/store.js';
import { config } from '../config/index.js';
import {
  GeminiAIProvider,
  MockDevelopmentAIProvider,
  IAIProviderAdapter,
  ExtractedFact
} from './aiAdapter.js';

export interface DoctorRecommendation {
  doctorId: string;
  doctorName: string;
  specialty: string;
  subSpecialty?: string;
  clinicName: string;
  clinicAddress: string;
  fees: number;
  rating: number;
  reviewCount: number;
  availability: string[];
  location: string;
}

export interface LabTestRecommendation {
  testId: string;
  testName: string;
  category: string;
  price: number;
  discountPrice?: number;
  turnaroundHours: number;
  turnaroundNote: string;
  labId: string;
  labName: string;
  labAddress: string;
  homeCollectionAvailable: boolean;
  location: string;
}

export interface CompleteAIReportAnalysis {
  reportDate?: string;
  testNames: string[];
  extractedFacts: ExtractedFact[];
  interpretation: {
    plainLanguageSummary: string;
    abnormalFindings: string[];
    possibleGeneralMeanings: string;
    concerningFindingsNotice?: string;
    relevantSpecialties: string[];
    suggestedQuestionsForDoctor: string[];
  };
  recommendations: {
    matchedDoctors: DoctorRecommendation[];
    matchedLabTests: LabTestRecommendation[];
  };
  disclaimer: string;
  providerUsed: string;
}

export class AIReportService {
  private primaryProvider: IAIProviderAdapter;
  private fallbackProvider: IAIProviderAdapter;

  constructor() {
    this.primaryProvider = config.geminiApiKey ? new GeminiAIProvider() : new MockDevelopmentAIProvider();
    this.fallbackProvider = new MockDevelopmentAIProvider();
  }

  async analyzeReport(reportText: string, fileName: string): Promise<CompleteAIReportAnalysis> {
    let rawResult;
    let providerUsed = this.primaryProvider.name;

    try {
      rawResult = await this.primaryProvider.analyzeReport(reportText, fileName);
    } catch (err) {
      console.warn(`[AIReportService] Primary provider (${this.primaryProvider.name}) failed, falling back to mock provider:`, err);
      rawResult = await this.fallbackProvider.analyzeReport(reportText, fileName);
      providerUsed = this.fallbackProvider.name;
    }

    // Search MediLink's existing doctor database
    const allDoctors = db.getDoctorProfiles();
    const allClinics = db.getClinics();
    const allUsers = db.getUsers();

    const matchedDoctors: DoctorRecommendation[] = [];
    const specialtiesLower = rawResult.relevantSpecialties.map(s => s.toLowerCase());

    for (const doc of allDoctors) {
      const user = allUsers.find(u => u.id === doc.userId);
      const clinic = allClinics.find(c => c.id === doc.clinicId);
      const docSpecialty = doc.specialty.toLowerCase();
      const docSub = (doc.subSpecialty || '').toLowerCase();

      // Check if matches any of the relevant specialties
      const isMatch = specialtiesLower.some(s => docSpecialty.includes(s) || s.includes(docSpecialty) || docSub.includes(s));
      
      let availability: string[] = [];
      try {
        availability = JSON.parse(doc.availabilityJson);
      } catch {
        availability = ['Mon - Fri'];
      }

      const item: DoctorRecommendation = {
        doctorId: doc.id,
        doctorName: user ? user.name : 'Dr. Specialist',
        specialty: doc.specialty,
        subSpecialty: doc.subSpecialty,
        clinicName: clinic ? clinic.name : 'MediLink Specialist Network',
        clinicAddress: clinic ? clinic.address : 'Lucknow, UP',
        fees: doc.consultationFee,
        rating: doc.rating,
        reviewCount: doc.reviewCount,
        availability,
        location: clinic ? clinic.city : 'Lucknow, UP'
      };

      if (isMatch) {
        matchedDoctors.unshift(item); // Prioritize matches at the top
      } else {
        matchedDoctors.push(item);
      }
    }

    // Search MediLink's existing diagnostic tests and labs
    const allTests = db.getDiagnosticTests();
    const allLabs = db.getLaboratories();
    const matchedLabTests: LabTestRecommendation[] = [];

    for (const test of allTests) {
      const lab = allLabs.find(l => l.id === test.labId);
      const testCategory = test.category.toLowerCase();
      const testName = test.name.toLowerCase();

      const isMatch = specialtiesLower.some(s => testCategory.includes(s) || testName.includes(s)) ||
        rawResult.testNames.some(t => testName.includes(t.toLowerCase()) || testCategory.includes(t.toLowerCase()));

      const item: LabTestRecommendation = {
        testId: test.id,
        testName: test.name,
        category: test.category,
        price: test.price,
        discountPrice: test.discountPrice,
        turnaroundHours: test.turnaroundHours,
        turnaroundNote: `${test.turnaroundHours} hours TAT`,
        labId: lab ? lab.id : 'lab-default',
        labName: lab ? lab.name : 'Accredited Diagnostics',
        labAddress: lab ? lab.address : 'Metro Medical Area',
        homeCollectionAvailable: lab ? lab.homeCollectionAvailable : true,
        location: lab ? lab.city : 'Lucknow, UP'
      };

      if (isMatch) {
        matchedLabTests.unshift(item);
      } else {
        matchedLabTests.push(item);
      }
    }

    return {
      reportDate: rawResult.reportDate,
      testNames: rawResult.testNames,
      extractedFacts: rawResult.extractedFacts,
      interpretation: {
        plainLanguageSummary: rawResult.plainLanguageSummary,
        abnormalFindings: rawResult.abnormalFindings,
        possibleGeneralMeanings: rawResult.possibleGeneralMeanings,
        concerningFindingsNotice: rawResult.concerningFindingsNotice,
        relevantSpecialties: rawResult.relevantSpecialties,
        suggestedQuestionsForDoctor: rawResult.suggestedQuestionsForDoctor,
      },
      recommendations: {
        matchedDoctors: matchedDoctors.slice(0, 4),
        matchedLabTests: matchedLabTests.slice(0, 4),
      },
      disclaimer: 'AI-generated information is for educational and healthcare-navigation purposes only. It is not a diagnosis or a substitute for professional medical advice.',
      providerUsed
    };
  }
}

export const aiReportService = new AIReportService();
