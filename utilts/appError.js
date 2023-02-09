class AppError extends Error {
    constructor(message, statusCode) {
        super(message)

        this.statusCode = statusCode
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
        this.isOperational = true

        // including stacktrace in this error class
        Error.captureStackTrace(this, this.constructor)
    }
}

// const AppError1 = new AppError(message, statusCode)

module.exports = AppError