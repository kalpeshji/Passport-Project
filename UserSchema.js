const mongoose = require('mongoose')
const userSchema = mongoose.Schema({
    username: String,
    email: {
        type: String
    },
    password: String
})
const userModel = mongoose.model('USER', userSchema)
module.exports = { userModel }