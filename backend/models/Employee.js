const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: true, trim: true, maxlength: 50 },
    last_name: { type: String, required: true, trim: true, maxlength: 50 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    position: { type: String, required: true, trim: true, maxlength: 100 },
    salary: { type: Number, required: true, min: 0.01 },
    date_of_joining: { type: Date, required: true },
    department: { type: String, required: true, trim: true, maxlength: 100 },
    // Filename of the uploaded picture inside /uploads (null = none)
    profile_picture: { type: String, default: null },
    // Owner of this employee: one User has many Employees
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

employeeSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    ret.profile_picture_url = ret.profile_picture ? `/uploads/${ret.profile_picture}` : null;
    return ret;
  },
});

module.exports = mongoose.model('Employee', employeeSchema);
