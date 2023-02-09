const Tour = require('./../model/tourModel')
const User = require('./../model/userModel')
const Booking = require('./../model/bookingModel')

const catchAsync = require('./../utilts/catchAsync')
const AppError = require('./../utilts/appError')


exports.getOverview = catchAsync(async (req, res) => {
    // 1) Get tour data from collection
    const tours = await Tour.find()

    // 2) Build template

    // 3)Render that template using tour data from 1)

    res.status(200).render('overview', {
        title: 'All tours',
        tours
    }) 
})

exports.getTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findOne({slug: req.params.slug}).populate({
        path: 'reviews',
        fields: 'review rating user'
    })

    if(!tour) {
        return next(new AppError('There is no tour with that name', 404))
    }

    res.status(200).render('tour', {
        title: `${tour.title} Tour`,
        tour
    }) 
})


exports.getLoginForm = (req, res) => {
   
    res.status(200).render('login', {
        title: 'Log into your account'
    })
}

exports.getAccount = (req, res) => {
    res.status(200).render('account', {
        title: 'Your account'
    })
}

exports.getMyTours = catchAsync(async(req, res, next) => {
    // 1) Find all bookings
    const bookings = await Booking.find({ user: req.user.id })

    // 2) Find tours with returned IDs
    const tourIDs = bookings.map(el => el.tour)

    const tours = await Tour.find({ _id: {$in: tourIDs}})

    res.status(200).render('overview', {
        title: 'My Tours',
        tours
    })
})


exports.uploadUserData = catchAsync(async(req, res, next) => {
    const updatedUser = await User.findByIdAndUpdate(req.user.id, {
        name: req.body.name,
        email: req.body.email
    },
    {
        new: true,
        runValidators: true
    }
    )
    res.status(200).render('account', {
        title: 'Your account',
        user: updatedUser
    }) 
})

// exports.getSignupForm = (req, res) => {

//     res.status(200).render('signup', {
//         title: 'Signup - Create new account'
//     })
// }