import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: [true, 'Problem reference is required'],
    },
    code: {
      type: String,
      required: [true, 'Submission code is required'],
    },
    language: {
      type: String,
      enum: {
        values: ['python', 'javascript'],
        message: 'Language must be python or javascript',
      },
      required: [true, 'Language is required'],
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error'],
      default: 'Pending',
    },
    runtimeMs: {
      type: Number,
      default: 0,
      min: 0,
    },
    passedTests: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalTests: {
      type: Number,
      default: 0,
      min: 0,
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

submissionSchema.index({ student: 1, createdAt: -1 });
submissionSchema.index({ problem: 1, createdAt: -1 });

const Submission = mongoose.model('Submission', submissionSchema);
export default Submission;
