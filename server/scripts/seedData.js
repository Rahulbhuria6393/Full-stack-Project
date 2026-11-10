import User from '../models/User.js';
import Problem from '../models/Problem.js';
import Submission from '../models/Submission.js';

export const SEED_USERS = [
  {
    name: 'Prof. Ada Lovelace',
    email: 'instructor@evalengine.dev',
    password: 'Instructor123!',
    role: 'instructor',
  },
  {
    name: 'Alex Turing',
    email: 'student@evalengine.dev',
    password: 'Student123!',
    role: 'student',
  },
];

export const buildSeedProblems = (instructorId) => [
  {
    title: 'Two Sum',
    difficulty: 'Easy',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return the **0-based indices** of the two numbers such that they add up to \`target\`.

You may assume that each input has **exactly one solution**, and you may not use the same element twice. Print the two indices separated by a single space in ascending order.

### Input Format
- Line 1: Space-separated integers representing \`nums\`
- Line 2: A single integer \`target\`

### Output Format
- Two space-separated integers \`i j\` where \`i < j\` and \`nums[i] + nums[j] == target\`

### Constraints
- \`2 <= nums.length <= 10^4\`
- \`-10^9 <= nums[i], target <= 10^9\``,
    sampleInput: '2 7 11 15\n9',
    sampleOutput: '0 1',
    starterCode: {
      javascript: `const fs = require('fs');
const lines = fs.readFileSync(0, 'utf8').trim().split(/\\r?\\n/);
const nums = lines[0].trim().split(/\\s+/).map(Number);
const target = Number(lines[1].trim());

function twoSum(nums, target) {
  // Return [i, j]
}

console.log(twoSum(nums, target).join(' '));`,
      python: `import sys

lines = sys.stdin.read().strip().splitlines()
nums = list(map(int, lines[0].split()))
target = int(lines[1].strip())

def two_sum(nums, target):
    # Return [i, j]
    pass

res = two_sum(nums, target)
print(res[0], res[1])`,
    },
    testCases: [
      { input: '2 7 11 15\n9', expectedOutput: '0 1', isHidden: false },
      { input: '3 2 4\n6', expectedOutput: '1 2', isHidden: false },
      { input: '3 3\n6', expectedOutput: '0 1', isHidden: true },
      { input: '-1 -2 -3 -4 -5\n-8', expectedOutput: '2 4', isHidden: true },
    ],
    createdBy: instructorId,
  },
  {
    title: 'Palindrome String',
    difficulty: 'Easy',
    description: `A phrase is a **palindrome** if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.

Given a string \`s\` from standard input, print \`true\` if it is a palindrome, or \`false\` otherwise.

### Input Format
- A single line containing string \`s\`

### Output Format
- \`true\` or \`false\`

### Constraints
- \`1 <= s.length <= 10^5\`
- \`s\` consists only of printable ASCII characters.`,
    sampleInput: 'A man, a plan, a canal: Panama',
    sampleOutput: 'true',
    starterCode: {
      javascript: `const fs = require('fs');
const s = fs.readFileSync(0, 'utf8').trimEnd();

function isPalindrome(s) {
  // Return true or false
}

console.log(isPalindrome(s) ? 'true' : 'false');`,
      python: `import sys

s = sys.stdin.read().rstrip('\\r\\n')

def is_palindrome(s):
    # Return True or False
    pass

print('true' if is_palindrome(s) else 'false')`,
    },
    testCases: [
      { input: 'A man, a plan, a canal: Panama', expectedOutput: 'true', isHidden: false },
      { input: 'race a car', expectedOutput: 'false', isHidden: false },
      { input: 'Was it a car or a cat I saw?', expectedOutput: 'true', isHidden: true },
      { input: 'hello', expectedOutput: 'false', isHidden: true },
    ],
    createdBy: instructorId,
  },
  {
    title: 'Array Reverse',
    difficulty: 'Easy',
    description: `Given an integer \`n\` followed by \`n\` space-separated integers, reverse the array in-place (or construct the reversed sequence) and print the elements separated by spaces.

### Input Format
- Line 1: An integer \`n\`
- Line 2: \`n\` space-separated integers

### Output Format
- The \`n\` integers in reversed order, separated by a single space

### Constraints
- \`1 <= n <= 10^5\`
- \`-10^9 <= arr[i] <= 10^9\``,
    sampleInput: '5\n1 2 3 4 5',
    sampleOutput: '5 4 3 2 1',
    starterCode: {
      javascript: `const fs = require('fs');
const tokens = fs.readFileSync(0, 'utf8').trim().split(/\\s+/);
const n = Number(tokens[0]);
const arr = tokens.slice(1, n + 1).map(Number);

function reverseArray(arr) {
  // Return reversed array
}

console.log(reverseArray(arr).join(' '));`,
      python: `import sys

tokens = sys.stdin.read().strip().split()
n = int(tokens[0])
arr = list(map(int, tokens[1:n + 1]))

def reverse_array(arr):
    # Return reversed list
    pass

print(' '.join(map(str, reverse_array(arr))))`,
    },
    testCases: [
      { input: '5\n1 2 3 4 5', expectedOutput: '5 4 3 2 1', isHidden: false },
      { input: '4\n10 20 30 40', expectedOutput: '40 30 20 10', isHidden: false },
      { input: '1\n42', expectedOutput: '42', isHidden: true },
      { input: '6\n-5 0 3 -2 8 1', expectedOutput: '1 8 -2 3 0 -5', isHidden: true },
    ],
    createdBy: instructorId,
  },
];

export const seedDatabase = async ({ reset = false } = {}) => {
  if (reset) {
    await Submission.deleteMany({});
    await Problem.deleteMany({});
    await User.deleteMany({});
  }

  let instructor = await User.findOne({ email: SEED_USERS[0].email });
  if (!instructor) {
    instructor = await User.create(SEED_USERS[0]);
  }

  let student = await User.findOne({ email: SEED_USERS[1].email });
  if (!student) {
    student = await User.create(SEED_USERS[1]);
  }

  const problemPayloads = buildSeedProblems(instructor._id);
  const createdProblems = [];

  for (const payload of problemPayloads) {
    const existing = await Problem.findOne({ title: payload.title });
    if (!existing) {
      const created = await Problem.create(payload);
      createdProblems.push(created);
    } else {
      createdProblems.push(existing);
    }
  }

  return {
    instructor,
    student,
    problemsCount: createdProblems.length,
  };
};
