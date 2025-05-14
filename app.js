const express = require('express')
const bodyParserErrorHandler = require('./utility/bodyParserErrorHandler')
const routes = require('./routes/routes')

const app = express()

// Middleware for parsing request bodies
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Error handler for JSON parsing
app.use(bodyParserErrorHandler)

const port = 3001

// Middleware for logging requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`)
  next()
})

app.get('/', (req, res) => {
  res.send('hello app.js')
})

// API routes
app.use('/api', routes)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({
    success: false,
    error: 'Server error',
    details: err.message || 'Unknown error'
  })
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})






