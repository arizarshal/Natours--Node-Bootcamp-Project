const mongoose = require('mongoose');
const Tour = require('./tourModel')

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'Review can not be empty']
    },
    rating: {
        type: Number,
        default: 4,
        max: 5,
        min: 1
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [false, 'Review must belong to a tour']
    },
    user: {
        type: mongoose.Schema.ObjectId,  
        ref: 'User',
        required: [true, 'Review must belong to a user']
    }

},
{
    // Enabling virtual property whenever there is a change in the DB
    toJSON: { virtuals: true}, 
    toObject: { virtuals: true}
}) 

// One user can only review once per tour
reviewSchema.index({ tour: 1, user: 1}, { unique: true})



reviewSchema.pre(/^find/, function(next) {
    // this.populate({
    //     path: 'tour',
    //     select: 'name'
    // }).populate({
    //     path: 'user',
    //     select: 'name photo'
    // })

    this.populate({
        path: 'user',
        select: 'name photo'
    })
    next();
})

// EP- 167 - calculating avg rating using "Static" method
reviewSchema.statics.calcAverageRatings = async function(tourId) {
    // aggregate showld always be calleddirectly on the model
    const stats = await this.aggregate([
        {
            $match: { tour: tourId }
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1},
                avgRating: {$avg: '$rating'}
            }
        }
    ])
    // console.log(stats)

    if(stats.length) {
    await Tour.findByIdAndUpdate(tourId, {
        ratingsQuantity: stats[0].nRating,
        ratingsAverage: stats[0].avgRating
    })
 } else {
    await Tour.findByIdAndUpdate(tourId, {
        ratingsQuantity: 0,
        ratingsAverage: 4.5
    })
    }
}

// EP - 168
reviewSchema.post('save', function() {
    // this.constructor points to current model i.e. reviews 
    this.constructor.calcAverageRatings(this.tour)
})

reviewSchema.pre(/^findOneAnd/, async function(next) {
    // using this.r, thats how we can have access to "r" variable from pre to post middleware 
    this.r = await this.findOne()
    // console.log(this.r)
    next()
})

reviewSchema.post(/^findOneAnd/, async function() {
    // using above mentioned this.r variable
    // await this.findOne(); would NOT work here,bcause query has already executed
    await this.r.constructor.calcAverageRatings(this.r.tour)
})


const Review = mongoose.model('Review', reviewSchema)

module.exports =  Review