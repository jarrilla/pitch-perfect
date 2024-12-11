import mongoose from 'mongoose'

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI!)
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected')
})

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err)
})

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close()
    console.log('MongoDB connection closed through app termination')
    process.exit(0)
  } catch (err) {
    console.error('Error during MongoDB shutdown:', err)
    process.exit(1)
  }
}) 