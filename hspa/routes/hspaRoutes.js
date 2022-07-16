const express = require('express')
const hspaModels = require('../models/hspaModels')
const pool = require('../../dbconn')
const router = express.Router()
const cors = require('cors')
const bodyParser = require('body-parser')

const otp = require('../models/otp')
const users = require('../models/users')

router.use(bodyParser.json())
router.use(
  bodyParser.urlencoded({
    extended: true,
  })
)
router.use(cors())

//OTP register
router.post('/createOtp', (req, res, next) => {
  otp.createOtp(pool, req, res)
})

router.post('/createLoginOtp',(req,res,next)=>{
  otp.createLoginOtp(pool,req,res)
});

router.get('/validateOtp',(req, res, next) => {
  otp.validateOtp(pool,req,res)
});

router.post('/otpLogin', (req, res, next) => {
  users.insertUsersUsingOtp(pool,req,res)
});

//Next two routes are to be kept together
router.post('/search', async (req, res, next) => {
  res.send({
    "error": {},
    "message": {
      "ack": {
        "status": "ACK"
      }
    }
  })
  next()
})

router.post('/searchCallback', async (req, res, next) => {
  const result = await hspaModels.handleSearch(pool, req)
})