import Problem from '../models/Problem.js';
import Submission from '../models/Submission.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { evaluateCode } from '../utils/judge.js';

const maskHiddenResults = (results, viewerRole) => {
  if (viewerRole === 'instructor') return results;
  return results.map((r) => {
    if (!r.isHidden) return r;
    return {
      testCaseNumber: r.testCaseNumber,
      isHidden: true,
      status: r.status,
      passed: r.passed,
      runtimeMs: r.runtimeMs,
      input: '[Hidden]',
      expectedOutput: '[Hidden]',
      actualOutput: r.passed ? '[Hidden]' : '[Hidden - output mismatch]',
      stderr: r.status === 'Runtime Error' ? r.stderr : '',
    };
  });
};

/**
 * POST /api/submissions/run
 * Executes code against custom input or visible sample test cases without saving a DB submission.
 */
export const runCode = asyncHandler(async (req, res) => {
  const { problemId, code, language, customInput } = req.body;

  const problem = await Problem.findById(problemId);
  if (!problem) {
    throw new AppError('Problem not found.', 404, 'PROBLEM_NOT_FOUND');
  }

  const isCustomRun = customInput !== undefined && customInput !== null;
  let casesToRun;

  if (isCustomRun) {
    const matchesSample =
      String(customInput).replace(/\r\n/g, '\n').trim() ===
      String(problem.sampleInput || '').replace(/\r\n/g, '\n').trim();
    casesToRun = [
      {
        input: String(customInput),
        expectedOutput: matchesSample ? problem.sampleOutput : '',
        isHidden: false,
      },
    ];
  } else {
    const visibleCases = problem.testCases.filter((tc) => !tc.isHidden);
    casesToRun =
      visibleCases.length > 0
        ? visibleCases
        : [
            {
              input: problem.sampleInput ?? '',
              expectedOutput: problem.sampleOutput ?? '',
              isHidden: false,
            },
          ];
  }

  const evaluation = await evaluateCode({
    code,
    language,
    testCases: casesToRun,
    timeoutMs: 3000,
  });

  // If custom input was provided without a reference expectedOutput, don't mark a clean run as Wrong Answer
  if (isCustomRun && evaluation.results[0]) {
    const matchesSample =
      String(customInput).replace(/\r\n/g, '\n').trim() ===
      String(problem.sampleInput || '').replace(/\r\n/g, '\n').trim();
    if (!matchesSample && evaluation.results[0].status === 'Wrong Answer') {
      evaluation.status = 'Executed';
      evaluation.results[0].status = 'Executed';
      evaluation.results[0].passed = true;
      evaluation.results[0].expectedOutput = null;
      evaluation.passedTests = 1;
    }
  }

  res.status(200).json({
    success: true,
    isCustomRun,
    evaluation,
  });
});

/**
 * POST /api/submissions/submit
 * Evaluates code against all problem test cases and persists the Submission record.
 */
export const submitCode = asyncHandler(async (req, res) => {
  const { problemId, code, language } = req.body;

  const problem = await Problem.findById(problemId);
  if (!problem) {
    throw new AppError('Problem not found.', 404, 'PROBLEM_NOT_FOUND');
  }

  const evaluation = await evaluateCode({
    code,
    language,
    testCases: problem.testCases,
    timeoutMs: 3000,
  });

  const submission = await Submission.create({
    student: req.user._id,
    problem: problem._id,
    code,
    language,
    status: evaluation.status,
    runtimeMs: evaluation.runtimeMs,
    passedTests: evaluation.passedTests,
    totalTests: evaluation.totalTests,
  });

  await submission.populate('problem', 'title difficulty');

  res.status(201).json({
    success: true,
    submission,
    evaluation: {
      ...evaluation,
      results: maskHiddenResults(evaluation.results, req.user.role),
    },
  });
});

/**
 * GET /api/submissions/my-history
 * Returns paginated submissions for the authenticated user, populated with problem details.
 */
export const getMyHistory = asyncHandler(async (req, res) => {
  const { page = '1', limit = '10', problemId, status } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const filter = { student: req.user._id };
  if (problemId) {
    filter.problem = problemId;
  }
  if (status) {
    filter.status = status;
  }

  const [submissions, total] = await Promise.all([
    Submission.find(filter)
      .populate('problem', 'title difficulty')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Submission.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    submissions,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    },
  });
});

/**
 * GET /api/submissions/problem/:problemId
 * Instructor view: returns paginated student submissions for a problem, populated with student info.
 */
export const getProblemSubmissions = asyncHandler(async (req, res) => {
  const { problemId } = req.params;
  const { page = '1', limit = '15' } = req.query;

  const problem = await Problem.findById(problemId).select('title difficulty');
  if (!problem) {
    throw new AppError('Problem not found.', 404, 'PROBLEM_NOT_FOUND');
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 15));
  const skip = (pageNum - 1) * limitNum;

  const filter = { problem: problemId };

  const [submissions, total] = await Promise.all([
    Submission.find(filter)
      .populate('student', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Submission.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    problem,
    submissions,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    },
  });
});
