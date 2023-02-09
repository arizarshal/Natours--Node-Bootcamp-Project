const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator')
// const User = require('./userModel')

const tourSchema = new mongoose.Schema({
    // Schema definitions
    name: {
        type: String, 
        required: [true, 'A tour must have a name'],
        trim: true ,
        unique: true,
        maxlength:[40, 'The tour name cannt be more than 40 characters'], 
        minlength:[4, 'The tour name must be min 4 characters'], 
        // validate: [validator.isAlpha, 'Tour name must only contain characters'], //3rd party validator: validator
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a max group size'],
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty'],
        enum: {
            values: ['easy', 'medium','difficult' ],
            message: 'Difficulty must be easy, medium or hard'
        }
    },
    ratingsAverage: {
        type: Number, 
        default: 4.0,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0'],
        // setter function that rounds Avg ratings
        set: val => Math.round(val * 10) / 10   //4.66666, 46.66666, 47. 4.7
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number, 
        required: [true, 'A tour must have a price']
    },
    prieDiscount: {
        type: Number,
        // custom validators
        validate: {
            validator: function(value) {
                // this only points to current doc on NEW document, this will not work with update/patch
                        return value < this.price
        },
            message: 'Discount price ({VALUE}) should be less then net price'
    }   
    },
    summary: {
        type: String,
        required: [true, 'A tour must have a summary']
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have a image Cover']
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    },
    startLocation: {
        // GeoJson
        type: {
            type: String,
            default: 'Point', //others : Polygon, Lines,
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [
        { 
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
        }
    ],
    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ]
}, 
    // Schema options
{
    toJSON: { virtuals: true}, 
    toObject: { virtuals: true}
})

// single field index
// tourSchema.index({price: 1}) //-1 for decending and vice versa
tourSchema.index({ slug: 1 })
// compound field indexing
tourSchema.index({ price: 1, ratingsAverage: -1 })

//EP-170 Geospatial indexing
tourSchema.index({ startLocation: '2dsphere' })


// Defining virtual properties on the tour schema - 7 days into 1 week, using normal function bcoz arrow function does not support this keyword.
// we cannot use "durationWeeks" as a query in the URL, bcoz its not a part of the database
tourSchema.virtual('durationWeeks').get(function() {
    return this.duration / 7
})


// Virtual Populate
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',              
    localField: '_id'
} )






// MONGODB DOC MIDDLEWARE: runs before .save & .create command, but not .insertMany
tourSchema.pre('save', function(next) {
    this.slug = slugify(this.name, {lower: true})
    next()
})

// implemention embedding in Tours using this pre middleware 
// tourSchema.pre('save', async function(next) {
//     const guidesPromises = this.guides.map(async id => await User.findById(id))
//     this.guides = await Promise.all(guidesPromises)
//     next()
// })

// we can use as may pre/post save hooks
// tourSchema.pre('save', function(next) {
//     console.log('Will save doc ...')
//     next()
// })

// // post-save hooks
// tourSchema.post('save', function(doc, next) {
//     console.log(doc)
//     next()
// })


// QUERY MIDDLEWARE
tourSchema.pre(/^find/, function(next) {       // using regular expression. all the strings that starts wih find - includes findOne
// tourSchema.pre('find', function(next) {
    this.find({ secretTour: {$ne: true}})
    this.start = Date.now()
    next()
})

// Query middleware - Populate
tourSchema.pre(/^find/, function(next) {
    this.populate({ 
        path: 'guides',
        select: '-__v -passwordChangedAt'
    })

    next()
})

tourSchema.post(/^find/, function(docs, next) {
    console.log(`Query took ${Date.now() - this.start} milliseconds`)
    // console.log(docs)
    next()
})


// AGGREGATION MIDDLEWARE: to exclude secret field from query results of aggregation url
// tourSchema.pre('aggregate', function(next) {
//     // a pipeline is a method, and here is an array , and adding a new element (match stage) in an array using unshift()             
//     this.pipeline().unshift({ $match: {secretTour:{ $ne: true}}}) 
//     console.log(this.pipeline())
//     next()
// }) 



const Tour = mongoose.model('Tour', tourSchema)

module.exports = Tour