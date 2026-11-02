const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 254 },
    // select:false keeps the hash out of queries unless explicitly requested
    password: { type: String, required: true, select: false },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// Never serialize the password, even if it was selected
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
