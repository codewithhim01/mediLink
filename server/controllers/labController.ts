import { Request, Response } from 'express';
import { db } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { DiagnosticTest } from '../types/index.js';

export async function getLaboratories(req: Request, res: Response) {
  try {
    const { city, homeCollection, search } = req.query;
    let list = db.getLaboratories();

    if (city) {
      const cityStr = String(city).toLowerCase();
      list = list.filter(l => l.city.toLowerCase().includes(cityStr));
    }

    if (homeCollection === 'true') {
      list = list.filter(l => l.homeCollectionAvailable);
    }

    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(l => l.name.toLowerCase().includes(q) || l.address.toLowerCase().includes(q) || (l.accreditation && l.accreditation.toLowerCase().includes(q)));
    }

    const testCounts = db.getDiagnosticTests();
    const result = list.map(lab => {
      const labTests = testCounts.filter(t => t.labId === lab.id);
      return {
        ...lab,
        testCount: labTests.length,
        minTestPrice: labTests.length > 0 ? Math.min(...labTests.map(t => t.discountPrice || t.price)) : 0
      };
    });

    return res.json({ success: true, count: result.length, data: result });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve laboratories: ' + error.message });
  }
}

export async function getLaboratoryById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const lab = db.findLaboratoryById(id);
    if (!lab) {
      return res.status(404).json({ success: false, error: 'Laboratory not found.' });
    }

    const tests = db.getTestsByLabId(lab.id).map(t => {
      let parameters = [];
      try { parameters = JSON.parse(t.parametersJson); } catch {}
      return { ...t, parameters };
    });

    const reviews = db.getReviews().filter(r => r.targetType === 'LABORATORY' && r.targetId === lab.id);

    return res.json({
      success: true,
      data: {
        ...lab,
        tests,
        reviews
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve laboratory: ' + error.message });
  }
}

export async function getDiagnosticTests(req: Request, res: Response) {
  try {
    const { category, maxPrice, sampleType, maxTAT, search, sort } = req.query;

    const allTests = db.getDiagnosticTests();
    const allLabs = db.getLaboratories();

    let list = allTests.map(t => {
      const lab = allLabs.find(l => l.id === t.labId);
      let parameters = [];
      try { parameters = JSON.parse(t.parametersJson); } catch {}

      return {
        ...t,
        parameters,
        effectivePrice: t.discountPrice !== undefined && t.discountPrice !== null ? t.discountPrice : t.price,
        laboratoryName: lab ? lab.name : 'MediLink Partner Lab',
        laboratoryAddress: lab ? lab.address : 'Portland, OR',
        laboratoryCity: lab ? lab.city : 'Portland, OR',
        laboratoryRating: lab ? lab.rating : 5.0,
        homeCollectionAvailable: lab ? lab.homeCollectionAvailable : true,
      };
    });

    if (category) {
      const catStr = String(category).toLowerCase();
      list = list.filter(t => t.category.toLowerCase().includes(catStr));
    }

    if (sampleType) {
      const stStr = String(sampleType).toLowerCase();
      list = list.filter(t => t.sampleType.toLowerCase().includes(stStr));
    }

    if (maxPrice) {
      const priceNum = parseFloat(String(maxPrice));
      if (!isNaN(priceNum)) {
        list = list.filter(t => t.effectivePrice <= priceNum);
      }
    }

    if (maxTAT) {
      const tatNum = parseInt(String(maxTAT), 10);
      if (!isNaN(tatNum)) {
        list = list.filter(t => t.turnaroundHours <= tatNum);
      }
    }

    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.laboratoryName.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // Sort options: price_asc, price_desc, tat_asc, rating_desc
    if (sort === 'price_asc') {
      list.sort((a, b) => a.effectivePrice - b.effectivePrice);
    } else if (sort === 'price_desc') {
      list.sort((a, b) => b.effectivePrice - a.effectivePrice);
    } else if (sort === 'tat_asc') {
      list.sort((a, b) => a.turnaroundHours - b.turnaroundHours);
    } else if (sort === 'rating_desc') {
      list.sort((a, b) => b.laboratoryRating - a.laboratoryRating);
    }

    return res.json({ success: true, count: list.length, data: list });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve diagnostic tests: ' + error.message });
  }
}

export async function createDiagnosticTest(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'LABORATORY') {
      return res.status(403).json({ success: false, error: 'Only authorized laboratories can add tests.' });
    }

    const lab = db.findLaboratoryByUserId(req.user.userId);
    if (!lab) {
      return res.status(404).json({ success: false, error: 'Laboratory profile not found.' });
    }

    const { name, code, category, sampleType, turnaroundHours, price, discountPrice, preparationInstructions, description, parameters } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ success: false, error: 'Test name, category, and price are required.' });
    }

    const now = new Date().toISOString();
    const newTest: DiagnosticTest = {
      id: `test-${Date.now()}`,
      labId: lab.id,
      name,
      code: code || `TST-${Math.floor(1000 + Math.random() * 9000)}`,
      category,
      sampleType: sampleType || 'Serum',
      turnaroundHours: Number(turnaroundHours) || 24,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      preparationInstructions: preparationInstructions || 'Standard procedure.',
      description: description || '',
      parametersJson: JSON.stringify(parameters || []),
      isAvailable: true,
      createdAt: now,
      updatedAt: now,
    };

    db.addDiagnosticTest(newTest);
    return res.status(201).json({ success: true, message: 'Diagnostic test created', data: newTest });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to create test: ' + error.message });
  }
}

export async function updateDiagnosticTest(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'LABORATORY') {
      return res.status(403).json({ success: false, error: 'Unauthorized.' });
    }

    const lab = db.findLaboratoryByUserId(req.user.userId);
    if (!lab) {
      return res.status(404).json({ success: false, error: 'Laboratory profile not found.' });
    }

    const { id } = req.params;
    const test = db.findDiagnosticTestById(id);
    if (!test || test.labId !== lab.id) {
      return res.status(404).json({ success: false, error: 'Diagnostic test not found in your laboratory catalog.' });
    }

    const { name, code, category, sampleType, turnaroundHours, price, discountPrice, preparationInstructions, description, parameters, isAvailable } = req.body;
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (code !== undefined) updates.code = code;
    if (category !== undefined) updates.category = category;
    if (sampleType !== undefined) updates.sampleType = sampleType;
    if (turnaroundHours !== undefined) updates.turnaroundHours = Number(turnaroundHours);
    if (price !== undefined) updates.price = Number(price);
    if (discountPrice !== undefined) updates.discountPrice = discountPrice ? Number(discountPrice) : null;
    if (preparationInstructions !== undefined) updates.preparationInstructions = preparationInstructions;
    if (description !== undefined) updates.description = description;
    if (parameters !== undefined) updates.parametersJson = JSON.stringify(parameters);
    if (isAvailable !== undefined) updates.isAvailable = Boolean(isAvailable);

    const updated = db.updateDiagnosticTest(id, updates);
    return res.json({ success: true, message: 'Test updated successfully', data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to update test: ' + error.message });
  }
}

export async function deleteDiagnosticTest(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'LABORATORY') {
      return res.status(403).json({ success: false, error: 'Unauthorized.' });
    }

    const lab = db.findLaboratoryByUserId(req.user.userId);
    if (!lab) {
      return res.status(404).json({ success: false, error: 'Laboratory profile not found.' });
    }

    const { id } = req.params;
    const test = db.findDiagnosticTestById(id);
    if (!test || test.labId !== lab.id) {
      return res.status(404).json({ success: false, error: 'Diagnostic test not found.' });
    }

    db.deleteDiagnosticTest(id);
    return res.json({ success: true, message: 'Test removed from catalog.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to delete test: ' + error.message });
  }
}
