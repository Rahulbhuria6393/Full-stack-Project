import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema(
  {
    input: {
      type: String,
      default: '',
    },
    expectedOutput: {
      type: String,
      required: [true, 'Each test case must include an expectedOutput'],
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const problemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Problem title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Problem description is required'],
    },
    difficulty: {
      type: String,
      enum: {
        values: ['Easy', 'Medium', 'Hard'],
        message: 'Difficulty must be Easy, Medium, or Hard',
      },
      required: [true, 'Difficulty is required'],
    },
    sampleInput: {
      type: String,
      default: '',
    },
    sampleOutput: {
      type: String,
      default: '',
    },
    starterCode: {
      python: { type: String, default: '' },
      javascript: { type: String, default: '' },
    },
    testCases: {
      type: [testCaseSchema],
      validate: {
        validator(cases) {
          return Array.isArray(cases) && cases.length > 0;
        },
        message: 'At least one test case is required',
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Problem creator is required'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

problemSchema.index({ title: 1 });
problemSchema.index({ difficulty: 1, createdAt: -1 });

const Problem = mongoose.model('Problem', problemSchema);
export default Problem;
