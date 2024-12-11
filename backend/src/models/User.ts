import mongoose, { Document, Schema } from 'mongoose'

export interface IUser extends Document {
  googleId: string
  email: string
  displayName: string
  createdOn: Date
  lastLogin: Date
}

const UserSchema = new Schema<IUser>({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  createdOn: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now }
})

export const User = mongoose.model<IUser>('User', UserSchema)