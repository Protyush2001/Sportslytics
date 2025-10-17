const mongoose = require('mongoose');
async function connectDB() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/sports', {
           
        });
        console.log("MongoDB connected to:",mongoose.connection.name);
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
}

module.exports = connectDB;