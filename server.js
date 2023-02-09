const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({path: './config.env'})


process.on('uncaughtException', err => {
    console.log('Uncaught exception. Shutting down')
    console.log(err.name, err.message, err)
    process.exit(1)  
})


const app = require('./app')

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.PASSWORD)

mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
}).then(() => {
    // console.log(con.connections)
    console.log('DB connection successfull')
})



const port =  3000 || process.env.PORT 
const server = app.listen(port, () => {
    console.log(`App running on port ${port}...`)
})


process.on('unhandledRejection', err => {
    console.log('Unhandeled rejection.💥 Shutting down')
    console.log(err)
    console.log(err.message)
    server.close(() => {
        process.exit(1)  //0 = success, 1 = uncaught exception
    })
})


