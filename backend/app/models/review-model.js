const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: {type:String,required:true},
    text: {type:String,required:true},
    rating: {type:Number,required:true}

});

const Review = mongoose.model('Review',reviewSchema);

module.exports = Review;