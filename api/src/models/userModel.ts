import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import JWT from "jsonwebtoken";
import { UserInterface } from "../typings/models/user";
const { Schema } = mongoose;

const DEFAULT_AVATAR = process.env.DEFAULT_AVATAR;

const userSchema = new Schema<UserInterface>(
  {
    firstName: { type: String, required: true, minlength: 2, maxlength: 128 },
    lastName: { type: String, required: true, minlength: 2, maxlength: 128 },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
    },
    password: {
      type: String,
      trim: true,
      required: true,
    },
    role: { type: String, required: true, default: "user" },
    username: {
      type: String,
      required: [true, "Please provide a username"],
      unique: true,
      minlength: 3,
      maxlength: 256,
    },
    avatar: {
      type: String,
      public_id: String,
      default: DEFAULT_AVATAR,
      set: (value: string | null | undefined) => {
        if (!value || value.trim() === "") {
          return DEFAULT_AVATAR;
        }
        return value;
      },
    },
    verificationToken: { type: String },
    website: { type: String },
    title: { type: String },
    bio: { type: String },
    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    passwordVerificationToken: { type: String, default: "" },
    passwordTokenExpirationDate: { type: Date, default: null },
    topicsOfInterest: {
      type: [{ type: mongoose.Types.ObjectId, ref: "Topic" }],
    },
    technologies: {
      type: [{ type: mongoose.Types.ObjectId, ref: "Category" }],
    },
    socialMediaProfiles: {
      x: String,
      linkedIn: String,
      github: String,
      facebook: String,
      instagram: String,
      dribble: String,
    },
    isOnboarded: { type: Boolean, default: false },
    locale: { type: String, default: "en" },
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// Encrypt password before saving
userSchema.pre("save", async function (this: UserInterface, next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(`${this.password}`, salt);
});

// Create default notification preferences after user is created
userSchema.post("save", async function (user) {
  if (user.isNew) {
    const NotificationPreferences = mongoose.model("NotificationPreferences");
    await NotificationPreferences.create({
      userId: user._id,
      preferences: {
        mentions: { inApp: true, email: true },
        comments: { inApp: true, email: true },
        replies: { inApp: true, email: true },
        bookmarks: { inApp: true, email: false },
        likes: { inApp: true, email: false },
      },
    });
  }
});

// Compare password with passwordHash
userSchema.methods.comparePassword = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

// return JWT token
userSchema.methods.getJWT = function () {
  const token = JWT.sign(
    { userId: this._id, role: this.role },
    process.env.JWT_SECRET as string,
    { expiresIn: (process.env.JWT_LIFETIME || "7d") as any }
  );

  return token;
};

const User = mongoose.model("User", userSchema);

export default User;
