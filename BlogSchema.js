const mongoose = require('mongoose')
const blogSchema = mongoose.Schema({
    title: String,
    blogImage: String,
    description: String,
    createdAt: { type: Date, default: Date.now },
    createdBy: String 
    
})
const blogModel = mongoose.model('BLOG', blogSchema)
module.exports = { blogModel }