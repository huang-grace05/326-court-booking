import mongoose from "mongoose";

const defaultMongoUri = "mongodb://127.0.0.1:27017/court-booking";

export function getMongoUri() {
  return process.env.MONGODB_URI || defaultMongoUri;
}

export async function connectDatabase() {
  await mongoose.connect(getMongoUri());
}
