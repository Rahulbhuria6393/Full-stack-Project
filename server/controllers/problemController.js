import Problem from '../models/Problem.js';
import Submission from '../models/Submission.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const serializeProblemForViewer = (problemDoc, viewerRole, solvedSet = null) => {
  const obj = problemDoc.toJSON ? problemDoc.toJSON() : { ...problemDoc };
  const isInstructor = viewerRole === 'instructor';
  const allCases = Array.isArray(obj.testCases) ? obj.testCases : [];

  return {
    ...obj,
    totalTestCasesCount: allCases.length,
    visibleTestCasesCount: allCases.filter((tc) => !tc.isHidden).length,
    testCases: isInstructor ? allCases : allCases.filter((tc) => !tc.isHidden),
    ...(solvedSet ? { solved: solvedSet.has(String(obj._id)) } : {}),
  };
};

/**
 * GET /api/problems
 * Supports regex title search (?search=), difficulty filter (?difficulty=), and pagination (?page=&limit=).
 */
export const getProblems = asyncHandler(async (req, res) => {
  const { search = '', difficulty = '', page = '1', limit = '10' } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const filter = {};
  if (typeof search === 'string' && search.trim().length > 0) {
    filter.title = { $regex: escapeRegex(search.trim()), $options: 'i' };
  }
  if (['Easy', 'Medium', 'Hard'].includes(difficulty)) {
    filter.difficulty = difficulty;
  }

  const [problems, total] = await Promise.all([
    Problem.find(filter)
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Problem.countDocuments(filter),
  ]);

  let solvedSet = null;
  if (req.user) {
    const solvedIds = await Submission.distinct('problem', {
      student: req.user._id,
      status: 'Accepted',
    });
    solvedSet = new Set(solvedIds.map(String));
  }

  const sanitized = problems.map((p) =>
    serializeProblemForViewer(p, req.user?.role, solvedSet)
  );

  res.status(200).json({
    success: true,
    problems: sanitized,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    },
  });
});

/**
 * GET /api/problems/:id
 */
export const getProblemById = asyncHandler(async (req, res) => {
  const problem = await Problem.findById(req.params.id).populate('createdBy', 'name email role');
  if (!problem) {
    throw new AppError('Problem not found.', 404, 'PROBLEM_NOT_FOUND');
  }

  let solvedSet = null;
  if (req.user) {
    const hasAccepted = await Submission.exists({
      student: req.user._id,
      problem: problem._id,
      status: 'Accepted',
    });
    solvedSet = new Set(hasAccepted ? [String(problem._id)] : []);
  }

  res.status(200).json({
    success: true,
    problem: serializeProblemForViewer(problem, req.user?.role, solvedSet),
  });
});

/**
 * POST /api/problems
 * Instructor-only endpoint to create a coding assignment problem with test cases.
 */
export const createProblem = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    difficulty,
    sampleInput,
    sampleOutput,
    starterCode,
    testCases,
  } = req.body;

  const firstCase = testCases[0];
  const problem = await Problem.create({
    title: title.trim(),
    description,
    difficulty,
    sampleInput: sampleInput !== undefined ? sampleInput : firstCase.input ?? '',
    sampleOutput: sampleOutput !== undefined ? sampleOutput : firstCase.expectedOutput ?? '',
    starterCode: starterCode || { python: '', javascript: '' },
    testCases: testCases.map((tc) => ({
      input: tc.input ?? '',
      expectedOutput: tc.expectedOutput,
      isHidden: Boolean(tc.isHidden),
    })),
    createdBy: req.user._id,
  });

  await problem.populate('createdBy', 'name email role');

  res.status(201).json({
    success: true,
    problem: serializeProblemForViewer(problem, req.user.role),
  });
});
