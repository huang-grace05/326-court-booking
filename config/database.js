import mongoose from "mongoose";

const defaultMongoUri = "mongodb://127.0.0.1:27017/court-booking";

export async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI || defaultMongoUri;
  await mongoose.connect(mongoUri);
}
