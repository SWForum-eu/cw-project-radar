//
// IMPORTS
//
const AppError = require('../utils/AppError')
const { logger } = require('../utils/logger')

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}.`
    return new AppError(message, 400)
}

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message)
    const message = `Invalid input data: ${errors.join('. ')}`
    return new AppError(message, 400)
}

const sendErrorDev = (err, req, res) => {
    // A) API
    if (req.originalUrl.startsWith('/api')) {
        logger.error(`ERROR 💥 ${err}`)
        logger.error(err.stack)
        return res.status(err.statusCode).json({
            status: err.status,
            code: err.statusCode,
            stack: err.stack,
        })
    }

    // B) RENDERED WEBSITE
    logger.error(`ERROR 💥 ${err}`)
    logger.error(err.stack)
    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        err
    })
}

const sendErrorProd = (err, req, res) => {
    // A) API
    if (req.originalUrl.startsWith('/api')) {
        // Operational error from within our app code
        if (err.isOperational) {
            logger.error(`ERROR 💥 ${err.stack}`)
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            })
        }
        // Errors originated from libraries we cannot 'trust' - send generic error
        else {
            logger.error(`ERROR 💥 ${err.stack}`)
            return res.status(500).json({
                status: 'error',
                message: 'Something went very wrong.',
            })
        }
    }

    // B) RENDERED WEBSITE
    // A) Operational, trusted error: send message to client
    if (err.isOperational) {
        logger.error(`ERROR 💥 ${err.stack}`)
        return res.status(err.statusCode).render('error', {
            title: 'Something went wrong!',
            msg: err.message,
        })
    }
    // B) Programming or other unknown error: don't leak error details
    // 1) Log error
    logger.error(`ERROR 💥 ${err.stack}`)
    // 2) Send generic message
    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: 'Please try again later.',
    })
}

const errorHandler = (err, req, res, next) => {
    // ensure some defaults
    err.statusCode = err.statusCode || 500 // internal server error
    err.status = err.status || 'error'

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res)
    } else if (process.env.NODE_ENV === 'production') {
        // capture other specific errors that are NOT operational
        // and turn them into operational errors
        if (err.name === 'CastError') err = handleCastErrorDB(err)
        if (err.name === 'ValidationError') err = handleValidationErrorDB(err)

        sendErrorProd(err, req, res)
    }
}

//
// EXPORTS
//
module.exports = errorHandler
