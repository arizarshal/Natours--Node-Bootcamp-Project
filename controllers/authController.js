const crypto = require('crypto')
const {promisify} = require('util');   //built in promisying 
const jwt = require('jsonwebtoken')
const User = require('./../model/userModel')
const catchAsync = require('./../utilts/catchAsync')
const AppError = require('./../utilts/appError')
const Email = require('./../utilts/email')

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET,{ expiresIn: process.env.JWT_EXPIRES_IN
    })
}

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id)
    const cookieOptions = { 
        expiresIn: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        // secure: true,    //checks if its HTTPS 
        httpOnly: true       //receive the cookie store in browser and send back all possible responses
    }
    if(process.env.NODE_ENV === 'production') cookieOptions.secure = true

    res.cookie('jwt', token, cookieOptions)

    // Remove passowrd from oputput of any query url
    user.password = undefined

    res.status(statusCode).json({
        status: 'success', 
        token, 
        data: { user }
    })
}

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create(req.body
        // name: req.body.name,
        // email: req.body.email,
        // password: req.body.password, 
        // passwordConfirm: req.body.passwordConfirm
    )
    const url = `${req.protocol}://${req.get('host')}/me`
    console.log(url)
    await new Email(newUser, url).sendWelcome()

    createSendToken(newUser, 201, res)
})

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body

    // 1)Check if email & password exists
    if(!email || !password) {
        return next(new AppError('Please provide email and password!', 400))
    }

    // 2)Check if user exists & password is correct
    const user = await User.findOne({ email }).select('+password') //explicitly selecting passwod field once, that is selected to false in model

    if(!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password! Sorry', 400))
    }

    // 3)If everythis ok, send token to client
    createSendToken(user, 200, res)
})

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    })
    res.status(200).json({status: 'success'})
}


exports.protect = catchAsync(async (req, res, next) => {
    // 1)Getting token & check if its there
    let token
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer '))
    {
        token = req.headers.authorization.split(' ')[1]
    }  
    // able to authenticate users based on cookies
    else if (req.cookies.jwt) {
        token = req.cookies.jwt
    }
    
 
    if(!token) {
        return next(new AppError('You are not logged in! Login to get access', 401))
    }
    // 2) Verification token - check if the token has not been compromised
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)

    // 3)Check if user still exists
    const currentUser = await User.findById(decoded.id)
    if(!currentUser) {
        return next(new AppError('The user belonging to the token does not exixts'))
    }

    // 4)Check if user changed password after token was issued
    if (currentUser.changePasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed password. Please log in again', 401))
    }

    // Grant access to protected route
    req.user = currentUser;
    res.locals.user = currentUser
    next()
})

// Only to render pages , no error
exports.isLoggedIn = async (req, res, next) => {
    if(req.cookies.jwt) {
        try{
    // 1) Verify token - 
    const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET)

    // 2)Check if user still exists
    const currentUser = await User.findById(decoded.id)
    if(!currentUser) {
        return next()
    }

    // 4)Check if user changed password after token was issued
    if (currentUser.changePasswordAfter(decoded.iat)) {
        return next()
    }

    // There is a logged in user 
    res.locals.user = currentUser   // res.locals gives access to .users in pug template
    return next()
} catch (err) {
    return next()
}
    }
    next() 
}


exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles ['admin', 'lead-guide'] role='user'
        
        if(!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403))
        }

        next()
    }
}


exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) get user based on POSTed email
    const user = await User.findOne({ email: req.body.email})
    // Verifi if user exists
    if(!user) {
        return next(new AppError('there is no user with this email', 404))
    }

    // 2) Generate a random reset token
    const resetToken = user.createPasswordResetToken()
    await user.save({ validateBeforeSave: false })  //this devalidates all the validation of Schema


    // 3)Send it to user's email
    try {
        const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${resetToken}`
        await new Email(user, resetURL).sendPasswordReset()
    
        res.status(200).json({
            status: 'success',
            message: 'Token send to email'
        })
    } catch(err) {
        user.passwordResetToken = undefined
        user.passwordResetExpires = undefined
        await user.save({ validateBeforeSave: false })  //this devalidates all the validation of Schema

    return next(new AppError('There was an error sending the email. Try again later.', 500))

    }

})


exports.resetPassword = catchAsync( async(req, res, next) => {
    // 1) Get user based on the token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token) //token = :token in Routes URL
        .digest('hex')

    // Querying the DB with the user having the above generated token
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gte: Date.now()}
    })

    // 2) If token has not expired, and there is a user, set the new password
    if(!user) {
        return next(new AppError('Token is invalid or has expired', 400))
    }

    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    // these just modifies the documnet and not update
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined

    await user.save()

    // 3) Update changePasswordAt property for the user
    
    // 4) Log the user in, send JWT
    createSendToken(user, 200, res)
})



exports.updatePassword = catchAsync( async (req, res, next) => {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password')
   

    // 2)Check if POSTed current password is correct
    if(!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Incorrect current password!', 401))
    } 

    // 3) if so, update the password
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    await user.save()   
    // User.findByIdAndUpdate will override & not use some defined authentications and validations

    // 4) Log user in, send JWT
    createSendToken(user, 200, res)
})