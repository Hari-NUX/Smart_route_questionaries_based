import 'dotenv/config'
import mongoose from 'mongoose'
import app from './app.js'

const port = Number(process.env.PORT) || 5000
const mongoUri = process.env.MONGODB_URI

if (!mongoUri) {
  throw new Error('MONGODB_URI is required')
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must contain at least 32 characters')
}

await mongoose.connect(mongoUri)

app.listen(port, () => {
  console.log(`SmartRoute API listening on port ${port}`)
})
