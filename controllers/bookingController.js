const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const Tour = require('./../model/tourModel')
const Booking = require('./../model/bookingModel')
const catchAsync = require('./../utilts/catchAsync')
const factory = require('./handlerFactory')


exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    // 1) Get the currently booked tour
    const tour = await Tour.findById(req.params.tourId)
    console.log(tour)

    // 2) Create checkout session
    const session = await stripe.checkout.sessions.create({
        // Info about the SESSION
        payment_method_types: ['card'],
        success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user={req.user.Id}&price=${tour.price}`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        // this is what we will use to create session after payment
        client_reference_id: req.params.tourId,
        // Info about the product
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    unit_amount:  tour.price * 100,
                    product_data: {
                        name: `${tour.name} Tour`,
                        description: tour.summary,
                        images: [`http://127.0.0.1:3000/img/tours/${tour.imageCover}`],
                    }
                },
                quantity: 1,
            }
        ],
        mode: 'payment'

    })

    // 3) Create session as response
    res.sendStatus(200).json({
        status: 'success',
        message: 'Payment successful',
        session
    })
})


// EP_213  - Redirecting successful booking url 
exports.createBookingCheckout = catchAsync(async (req, res, next) => {
    // Temporary code: unsecure url
    const {tour, user, price} = req.query

    if(!tour && !user && !price) return next()

    await Booking.create({tour, user, price})
    next()

    res.redirect(req.originalUrl.split('?')[0])
})


exports.createBooking = factory.createOne(Booking)
exports.getBooking = factory.getOne(Booking)
exports.getAllBooking = factory.getAll(Booking)
exports.updateBooking = factory.updateOne(Booking)
exports.deleteBooking = factory.deleteOne(Booking)