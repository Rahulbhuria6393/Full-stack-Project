import mongoose from 'mongoose';
import { AppError } from './errorHandler.js';

/**
 * Generic required-field validator middleware.
 */
export const requireFields = (fields) => (req, _res, next) => {
  const missing = [];
  for (const field of fields) {
    const value = req.body?.[field];
    if (
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim() === '')
    ) {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    return next(
      new AppError(
        `Missing required field(s): ${missing.join(', ')}`,
        400,
        'VALIDATION_ERROR',
        missing
      )
    );
  }

  return next();
};

export const validateRegister = (req, _res, next) => {
  const { name, email, password, role } = req.body || {};
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('name must be at least 2 characters');
  }
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.push('valid email is required');
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('password must be at least 6 characters');
  }
  if (role !== undefined && !['student', 'instructor'].includes(role)) {
    errors.push('role must be either student or instructor');
  }

  if (errors.length > 0) {
    return next(new AppError(errors.join('; '), 400, 'VALIDATION_ERROR', errors));
  }
  return next();
};

export const validateLogin = requireFields(['email', 'password']);

export const validateProblem = (req, _res, next) => {
  const { title, description, difficulty, testCases } = req.body || {};
  const errors = [];

  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.push('title is required');
  }
  if (!description || typeof description !== 'string' || !description.trim()) {
    errors.push('description is required');
  }
  if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
    errors.push('difficulty must be Easy, Medium, or Hard');
  }
  if (!Array.isArray(testCases) || testCases.length === 0) {
    errors.push('testCases must be a non-empty array');
  } else {
    testCases.forEach((tc, idx) => {
      if (!tc || typeof tc !== 'object') {
        errors.push(`testCases[${idx}] must be an object`);
        return;
      }
      if (tc.input !== undefined && typeof tc.input !== 'string') {
        errors.push(`testCases[${idx}].input must be a string`);
      }
      if (typeof tc.expectedOutput !== 'string' || tc.expectedOutput.length === 0) {
        errors.push(`testCases[${idx}].expectedOutput is required`);
      }
    });
  }

  if (errors.length > 0) {
    return next(new AppError(errors.join('; '), 400, 'VALIDATION_ERROR', errors));
  }
  return next();
};

export const validateSubmission = (req, _res, next) => {
  const { problemId, code, language } = req.body || {};
  const errors = [];

  if (!problemId || !mongoose.Types.ObjectId.isValid(problemId)) {
    errors.push('valid problemId is required');
  }
  if (typeof code !== 'string' || code.trim().length === 0) {
    errors.push('code cannot be empty');
  }
  if (!['python', 'javascript'].includes(language)) {
    errors.push('language must be either python or javascript');
  }

  if (errors.length > 0) {
    return next(new AppError(errors.join('; '), 400, 'VALIDATION_ERROR', errors));
  }
  return next();
};
