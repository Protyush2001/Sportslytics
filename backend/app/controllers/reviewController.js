const mongoose = require('mongoose');

const Review = require('../models/review-model');
const reviewValidationSchema = require('../validations/review-validation');
const reviewCtlr = {};

reviewCtlr.createReview = async (req, res) => {
    try {
        const { error,value } = reviewValidationSchema.validate(req.body, { abortEarly: false });
        if (error) return res.status(400).json({ error: error.details[0].message });
        

        const review = new Review({
            user: req.user._id,
            name: value.name,
            text: value.text,
            rating: value.rating
        }); 
    
        await review.save();
        res.status(201).json(review);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = reviewCtlr;
