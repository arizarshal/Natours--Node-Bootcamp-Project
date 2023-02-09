const Review = require('./../model/reviewModel')
// const catchAsync = require('./../utilts/catchAsync')
// const AppError = require('./../utilts/AppError')
const factory = require('./handlerFactory')


// catchAsync( async (req, res, next) => {
//     let filter = {}
//     if(req.params.tourId) filter = {tour: req.params.tourId}

//     const review = await Review.find(filter)

//     res.status(200).json({
//         status: 'success',
//         results: review.length,
//         data: {
//             review
//         }
//     })
// }) 

// let filter = {}
//     if(req.params.tourId) filter = {tour: req.params.tourId}

    // catchAsync( async (req, res, next) => {
        //     const review = await Review.findById(req.params.id)
        
        //     if(!review) {
            //         return next(new AppError('No review found with this ID', 404))
            //     }
            
            //     res.status(200).json({
                //         status: 'success',
                //         data: {
                    //             review
                    //         }
//     })
// })

exports.setTourUserIds = (req, res, next) => {
    // Allow nested routes - letting user manually specify tourid
    if(!req.body.tour) req.body.tour = req.params.tourId;
    if(!req.body.user) req.body.user = req.user.id;
    
    next()
}


exports.getAllReview = factory.getAll(Review)
exports.getReview = factory.getOne(Review)
exports.createReview = factory.createOne(Review)
exports.updateReview = factory.updateOne(Review)
exports.deleteReview = factory.deleteOne(Review)