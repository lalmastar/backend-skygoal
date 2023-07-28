const mongoose = require('mongoose');
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
    firstname: {
        type: String,
        // required: [true, 'Please enter a first name']
    },
    lastname: {
        type: String,
        // required: [true, 'Please enter a last name']
    },
    email: {
        type: String,
        // unique:true
    },
    mobile: {
        type: String,
        // unique:true
    },
    password: {
        type: String,
        // unique:true
    },
    role: {
      type: String,
      default: "user"
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    address: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
}, 
  { 
    timestamps: true
  }
)


userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
      next();
    }
    const salt = await bcrypt.genSaltSync(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  });

  userSchema.methods.isPasswordMatched = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password); 
  };

  userSchema.methods.createPasswordResetToken = async function () {
    const resettoken = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto
      .createHash("sha256")
      .update(resettoken)
      .digest("hex");
    this.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 10 minutes
    return resettoken;
  };

const User = mongoose.model('User', userSchema);

module.exports = User;