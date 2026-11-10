import { execFile } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_ROOT = path.resolve(__dirname, '../temp');
const DEFAULT_TIMEOUT_MS = 3000;
const MAX_OUTPUT_BUFFER = 1024 * 1024; // 1 MB

let cachedPythonPath = null;

const normalizeOutput = (str) => String(str ?? '').replace(/\r\n/g, '\n').trim();

const probePythonBinary = (candidate) =>
  new Promise((resolve) => {
    if (!candidate) return resolve(false);
    execFile(candidate, ['--version'], { timeout: 2000, windowsHide: true }, (err, stdout, stderr) => {
      if (err) return resolve(false);
      const out = `${stdout}${stderr}`.toLowerCase();
      resolve(out.includes('python'));
    });
  });

/**
 * Resolves a working Python 3 executable, avoiding broken WindowsApps store stubs.
 */
export const resolvePythonExecutable = async () => {
  if (cachedPythonPath) return cachedPythonPath;

  const candidates = [];

  if (process.env.PYTHON_PATH) {
    candidates.push(process.env.PYTHON_PATH);
  }

  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA;
    if (localAppData) {
      try {
        const pythonBaseDir = path.join(localAppData, 'Programs', 'Python');
        const entries = await fs.readdir(pythonBaseDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory() && /^Python\d+/i.test(entry.name)) {
            candidates.push(path.join(pythonBaseDir, entry.name, 'python.exe'));
          }
        }
      } catch {
        // Directory does not exist
      }
    }

    const pathDirs = (process.env.PATH || '').split(path.delimiter).filter(Boolean);
    for (const dir of pathDirs) {
      if (!dir.toLowerCase().includes('windowsapps')) {
        candidates.push(path.join(dir, 'python.exe'));
        candidates.push(path.join(dir, 'python3.exe'));
      }
    }
  } else {
    candidates.push('python3', 'python');
  }

  for (const candidate of candidates) {
    // eslint-disable-next-line no-await-in-loop
    const works = await probePythonBinary(candidate);
    if (works) {
      cachedPythonPath = candidate;
      return cachedPythonPath;
    }
  }

  // Last resort fallback
  cachedPythonPath = process.platform === 'win32' ? 'python' : 'python3';
  return cachedPythonPath;
};

const cleanupDir = async (dirPath) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await fs.rm(dirPath, { recursive: true, force: true });
      return;
    } catch {
      // Wait briefly in case Windows still holds a lock right after process termination
      await new Promise((r) => setTimeout(r, 40));
    }
  }
};

/**
 * Executes a single test case inside the sandboxed runDir using child_process.execFile
 * with a strict 3-second timeout safeguard and SIGKILL termination.
 */
const runSingleTestCase = ({ binary, args, cwd, input, expectedOutput, timeoutMs = DEFAULT_TIMEOUT_MS }) =>
  new Promise((resolve) => {
    const startTime = process.hrtime.bigint();
    let settled = false;

    const child = execFile(
      binary,
      args,
      {
        cwd,
        timeout: timeoutMs,
        killSignal: 'SIGKILL',
        maxBuffer: MAX_OUTPUT_BUFFER,
        windowsHide: true,
      },
      (error, stdout, stderr) => {
        if (settled) return;
        settled = true;

        const elapsedMs = Math.max(1, Math.round(Number(process.hrtime.bigint() - startTime) / 1e6));
        const actualOutput = normalizeOutput(stdout);
        const expected = normalizeOutput(expectedOutput);
        const cleanStderr = normalizeOutput(stderr);

        const isTimeout =
          Boolean(error) &&
          (error.killed === true ||
            error.signal === 'SIGTERM' ||
            error.signal === 'SIGKILL' ||
            elapsedMs >= timeoutMs);

        if (isTimeout) {
          return resolve({
            status: 'Time Limit Exceeded',
            passed: false,
            runtimeMs: timeoutMs,
            actualOutput,
            expectedOutput: expected,
            stderr: `Time Limit Exceeded (${timeoutMs} ms limit)`,
          });
        }

        if (error) {
          return resolve({
            status: 'Runtime Error',
            passed: false,
            runtimeMs: elapsedMs,
            actualOutput,
            expectedOutput: expected,
            stderr: cleanStderr || error.message || 'Runtime error occurred',
          });
        }

        const passed = actualOutput === expected;
        return resolve({
          status: passed ? 'Accepted' : 'Wrong Answer',
          passed,
          runtimeMs: elapsedMs,
          actualOutput,
          expectedOutput: expected,
          stderr: cleanStderr,
        });
      }
    );

    if (child.stdin) {
      child.stdin.on('error', () => {
        // Ignore EPIPE when child exits before consuming all stdin
      });
      if (input !== undefined && input !== null && input.length > 0) {
        child.stdin.write(String(input));
      }
      child.stdin.end();
    }
  });

/**
 * Evaluates user code against an array of test cases in an isolated /temp subdirectory.
 * Ensures temporary files are always cleaned up in a finally block.
 */
export const evaluateCode = async ({
  code,
  language,
  testCases = [],
  timeoutMs = DEFAULT_TIMEOUT_MS,
}) => {
  await fs.mkdir(TEMP_ROOT, { recursive: true });
  const runId = crypto.randomUUID();
  const runDir = path.join(TEMP_ROOT, runId);

  try {
    await fs.mkdir(runDir, { recursive: true });

    let binary;
    let args;
    if (language === 'python') {
      const scriptPath = path.join(runDir, 'solution.py');
      await fs.writeFile(scriptPath, code, 'utf8');
      binary = await resolvePythonExecutable();
      args = ['-I', scriptPath];
    } else if (language === 'javascript') {
      await fs.writeFile(path.join(runDir, 'package.json'), '{}', 'utf8');
      const scriptPath = path.join(runDir, 'solution.js');
      await fs.writeFile(scriptPath, code, 'utf8');
      binary = process.execPath;
      args = [scriptPath];
    } else {
      throw new Error(`Unsupported language: ${language}`);
    }

    const results = [];
    let passedTests = 0;
    let totalRuntimeMs = 0;
    let hasRuntimeError = false;
    let hasTimeLimitExceeded = false;

    for (let i = 0; i < testCases.length; i += 1) {
      const tc = testCases[i];
      // eslint-disable-next-line no-await-in-loop
      const result = await runSingleTestCase({
        binary,
        args,
        cwd: runDir,
        input: tc.input ?? '',
        expectedOutput: tc.expectedOutput ?? '',
        timeoutMs,
      });

      totalRuntimeMs += result.runtimeMs;
      if (result.passed) {
        passedTests += 1;
      }
      if (result.status === 'Runtime Error') {
        hasRuntimeError = true;
      }
      if (result.status === 'Time Limit Exceeded') {
        hasTimeLimitExceeded = true;
      }

      results.push({
        testCaseNumber: i + 1,
        isHidden: Boolean(tc.isHidden),
        input: tc.input ?? '',
        ...result,
      });

      if (hasTimeLimitExceeded) {
        break;
      }
    }

    let overallStatus = 'Accepted';
    if (hasTimeLimitExceeded) {
      overallStatus = 'Time Limit Exceeded';
    } else if (hasRuntimeError) {
      overallStatus = 'Runtime Error';
    } else if (passedTests < testCases.length) {
      overallStatus = 'Wrong Answer';
    }

    return {
      status: overallStatus,
      runtimeMs: totalRuntimeMs,
      passedTests,
      totalTests: testCases.length,
      results,
    };
  } finally {
    await cleanupDir(runDir);
  }
};
