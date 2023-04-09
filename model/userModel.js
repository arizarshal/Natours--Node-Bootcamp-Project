const crypto = require('crypto'); //built-in with npm -> generated random passowrd
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A user nmust have a name'],
        trim: true ,
        unique: true,
        maxlength:[40, 'The user name must be at max 40 characters'], 
        minlength:[3, 'The user name must be min 3 characters'], 
        // validate: [validator.isAlpha, 'Tour name must only contain characters'], //3rd party validator: validator
    },
    email: {
        type: String,
        required: [true, 'The user name must have a email address'],
        trim: true ,
        unique: true,
        lowercase: true,
        validator: [validator.isEmail, 'Pelase enter a valid email']
    },
    role: {
        type: String,
        enum: ['admin', 'user', 'guide', 'lead-guide'],
        required: [true, 'role is required'],
        default: 'guide'
    },
    photo: {type: String, default: 'default.jpeg'},
    password: {
        type: String,
        required: [true, 'The user must have a password'],
        min: [8, 'Password must be at least 8 characters'],
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm password'],
        validate: {
            // this only works on CREATE & SAVE
            validator: function(el) {
                return el === this.password
            },
            message: 'Both password must be same'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        dafault: true,
        select: false
    }
})

// Mongoose middleware : password encrypting/hashing 
//comment out these two middleware to upload new Tour, User & review data
// userSchema.pre('save', async function(next) {
//     // Only run if password is modified
//     if (!this.isModified('password')) return next();

//     //hash the password with cost of 12
//     this.password = await bcrypt.hash(this.password, 12)  //.hash is a async operation. we need to await this method

//     this.passwordConfirm = undefined; //not saving this field in DB
//     next()
// })

// userSchema.pre('save', function(next) {
//     if(!this.isModified('password') || this.isNew ) return next()

//     this.passwordChangedAt = Date.now() - 1000 //waiting 1sec to let the signToken generated : in "authController" - resetPassword
//     next()
// })

// Query Middleware 
userSchema.pre(/^find/, function(next) {    //every query that statrts with find. eg: findById, etc
    // this points to the current query
    this.find({ active: { $ne: false } })
    next()
})


// INSTANCE METHOD - availabe on all docs ina collection
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword)
}

userSchema.methods.changePasswordAfter = function(JWTTimestamp) {
    if(this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10)

         return JWTTimestamp < changedTimestamp // 100 < 200
    }
// false means not changed
    return false
}

// Instance Method - creationg a random token
userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex')

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex')

        console.log({resetToken}, this.passwordResetToken)

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000

    return resetToken
}


const User = mongoose.model('User', userSchema)

module.exports = User