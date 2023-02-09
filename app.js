const path = require('path')
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-Limit');
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')
const cookieParser = require('cookie-parser')

const AppError = require('./utilts/appError')
const globalErrorHandler = require('./controllers/errorController')
const tourRouter = require('./routes/tourRoutes')
const userRouter = require('./routes/userRoutes')
const reviewRouter = require('./routes/reviewRoutes')
const bookingRouter = require('./routes/bookingRoutes')
const viewRouter = require('./routes/viewRoutes')


// Starting express app
const app = express();

app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))

// GLOBAL MIDDLEWARE
// Serving static files
app.use(express.static(path.join(__dirname, 'public')))


// SET Security HTTP headers
// app.use(helmet({ contentSecurityPolicy: {
//     useDefaults: true, 
//     directives: { 
//       'script-src': ["'self'", "https://cdnjs.cloudflare.com/"]  
//     }
//   }
// })
// )
// app.use(helmet.contentSecurityPolicy());
app.use(
    helmet({
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: {
            allowOrigins: ['*']
        },
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ['*'],
                scriptSrc: ["* data: 'unsafe-eval' 'unsafe-inline' blob:"]
            }
        }
    })
)


// DEV logging
if(process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
}

// Limit requests for same IP
const limiter = rateLimit({
    // 100 req/hr
    max: 100,
    windowMs: 60* 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour' 
})
app.use('/api',limiter)

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({extended: true, limit: '10kb'}))
app.use(cookieParser())

// Data sanitization against NoSQL Query Injection 
app.use(mongoSanitize())   //removes all $ sign from req.body

// Data sanitization agains XSS
app.use(xss())

// Prevent parameter pollution
app.use(hpp({
    whiteList: [
        'duration',
        'ratingsQuantity',
        'ratingsAverage',
        'maxGroupSize',
        'difficulty',
        'price'
    ]
}))



// Test middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString()
    // console.log(req.cookies)
    next()
})


// Routes
app.use('/', viewRouter)
app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/review', reviewRouter)
app.use('/api/v1/booking', bookingRouter)

// this default-error route should be below all other routes
app.all('*', (req, res, next) => {
    next(new AppError(`Cant find ${req.originalUrl} on this server`, 404));
})

// by specifying these 4 parameters, express knows that this is a error handling middleware
// app.use((err, req, res, next) => {
//     err.statusCode = err.statusCode || 500
//     err.status = err.status || 'error'

//     res.status(err.statusCode).json({
//         status: err.status,
//         message: err.message,
//         data: 'Sorry'
//     })
//     // next()
// })

app.use(globalErrorHandler)

module.exports = app