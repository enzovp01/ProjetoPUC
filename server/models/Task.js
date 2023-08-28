const mongoose = require('mongoose')

const Task = mongoose.model('Task', {
  title: String,
  description: String,
  conclusion: Date,
  status: String,
  userId: String,
})

module.exports = Task