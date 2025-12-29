import mongoose from 'mongoose'
export const connectDB = async(req, res) => {
    try {
        await mongoose.connect(process.env.MONGOURL);
        console.log('Database connected.')
    } catch (error) {
        console.log('Error:', error.message);
        process.exit(1)
    }
}