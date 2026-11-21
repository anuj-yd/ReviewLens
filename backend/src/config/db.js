import mongoose from 'mongoose'

export const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is required.')
    }

    const connection = await mongoose.connect(
      process.env.MONGODB_URI
    )

    console.log(
      `MongoDB Connected: ${connection.connection.host}`
    )

  } catch (error) {
    console.error('MongoDB connection failed:', error.message)
    throw error
  }
}
