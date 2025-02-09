import mongoose, { Document, Schema, Model, CallbackError } from 'mongoose';
import bcrypt from 'bcrypt';
import uniqueValidator from "mongoose-unique-validator";

interface IUser extends Document {
  username: string;
  email: string;
  emailConfirmed: boolean;
  confirmationToken: string | undefined;
  password: string;
  skills: string[];
  role: 'user' | 'admin';
  registrationDate: Date;
  lastConnected: Date;
  appliedOffers: string[];
  savedOffers: string[];
  offersHistory: string[];
}

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: [true, "The username field is required"],
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: [true, "The email field is required"],
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function (email:string):boolean {
        const regex = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
        return regex.test(email);
      },
      message: "Please fill in a valid email adress",
    },
  },
  emailConfirmed: {
    type: Boolean,
    default: false
  },
  confirmationToken: String,
  password: {
    type: String,
    required: [true, "The password field is required"],
    validate: {
      validator: function (password:string):boolean {
        const regex =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?\/\\~\-]).{8,}$/;
        return regex.test(password);
      },
      message:
        "Please fill in a valid password, which must contain at least an uppercase letter, a lowercase letter, a number, a special character and be at least 8 characters long",
    },
  },
  skills: {
    type: [String],
    required: [true, "The skills field is required"],
    default: [],
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
    required: [true, "The role field is required"],
  },
  registrationDate: {
    type: Date,
    required: [true, "The registration date is required"],
    default: Date.now(),
  },
  lastConnected: {
    type: Date,
    required: [true, "The last connected date is required"],
    default: Date.now(),
  },
  appliedOffers: {
    type: [String],
    required: [true, "The applied offers field is required"],
    default: [],
  },
  savedOffers: {
    type: [String],
    required: [true, "The saved offers field is required"],
    default: [],
  },
  offersHistory: {
    type: [String],
    required: [true, "The offers history field is required"],
    default: [],
  },
});

userSchema.plugin(uniqueValidator);

userSchema.path('username').validate(async function (value: string) {
  const user = await mongoose.model('User').findOne({ username: value });
  if (user) {
    throw new Error("This username is already taken. Please choose a different one.");
  }
}, 'This username is already taken. Please choose a different one.');

userSchema.pre<IUser>("save", async function (next) {
  try {
    if (this.isModified("password")) {
      const hashedPassword = await bcrypt.hash(this.password, 10);
      this.password = hashedPassword;
    }
    next();
  } catch (error) {
    next(error as CallbackError);
  }
});

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

module.exports = User;

export default User;