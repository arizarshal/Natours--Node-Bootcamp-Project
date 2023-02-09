const AppError = require(`./../utilts/appError`)

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`
    return new AppError(message, 400)
}

const  handleDuplicateErrorDB = err => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0]
    console.log(value)
    const message = `Duplicate field value: ${value}. Please use anotehr value instead`
    return new AppError(message, 400)
}

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message)

    const message = `Validation input data ${errors.join('. ')}`
    return new AppError(message, 400)
}


const handleJWTErrorDB = () => new AppError('Invalid token, please login again.', 401)

const handleJWTExpiredErrorDB = () => new AppError('Your token has expired, please login again', 401)


const sendErrorDev = (err, req, res) => {
    //A) API
    if(req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
    })
    }   //B) RENDER ERROR PAGE
        console.log('Error 💥'. err)
        return res.status(err.statusCode).render('error', {
            title: 'Something went wrong',
            msg: err.message
        })
}



const sendErrorProd = (err, res) => {
    // A) API
    if(req.originalUrl.startsWith('/api')) {
        // Operational error, trusted error -> sent to the cliend
        if(err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message 
            })
            // Programming or other unknown error -> dont sent error details to the cliet
        } 
            // 1)Log error message
            console.log('Error 💥'. err)
    
            // 2) Send general message to the cliet
            return ers.status(500).json({
                status: 'error',
                message: 'Somthing went wrong!'
            })
        
    } 
        // B) RENDERED WEBSITE ERROR 
        // a)Operational error, trusted error -> sent to the cliend

        if(err.isOperational) {
            return res.status(err.statusCode).render('error', {
                title: 'Something went wrong',
                msg: err.message
            })
        }
        // b)Programming or other unknown error -> dont sent error details to the cliet
            // 1)Log error message
            console.log('Error 💥'. err)
    
            // 2) Send general message to the cliet
            return ers.status(500).json({
                status: 'error',
                message: 'Somthing went wrong!'
            })
}

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500
    err.status = err.status || 'error'


    if(process.env.NODE_ENV === 'development') {
       sendErrorDev(err, req, res)
    } else if (process.env.NODE_ENV === 'production') {
        let error = { ...err }
        err.message = error.message

        if (error.name === 'CastError') error = handleCastErrorDB(error)
        if(err.code === 11000) error = handleDuplicateErrorDB(error)
        if (error.name === 'ValidationError') error = handleValidationErrorDB(error)
        if(error.name === 'JsonWebTokenError') error = handleJWTErrorDB()
        if(error.name === 'TokenExpiredError') error = handleJWTExpiredErrorDB()

      sendErrorProd(error, req, res)
    }
} 