const mongoose = require('mongoose');
async function connectDB() {
    try {
        await mongoose.connect('mongodb+srv://deyprotyush_db_user:nDwcg9tgxxokwPAt@sportslytics.ydxuycy.mongodb.net/?appName=Sportslytics', {
           
        });
        console.log("MongoDB connected to:",mongoose.connection.name);
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
}

module.exports = connectDB;