const express = require('express')
const hspaModels = require('../models/hspaModels')
const pool = require('../../dbconn')
const router = express.Router()
const cors = require('cors')
const bodyParser = require('body-parser')

const otp = require('../models/otp')
const users = require('../models/users')
const tests = require('../models/tests')
const order = require('../models/order')

router.use(bodyParser.json())
router.use(
  bodyParser.urlencoded({
    extended: true,
  })
)
const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200,
}
router.use(cors())

router.get('/', (req, res) => {
  res.send({ message: 'endpoint working' });
});
//OTP register
router.post('/createOtp', (req, res, next) => {
  otp.createOtp(pool, req, res)
});

router.post('/createLoginOtp',(req,res,next)=>{
  otp.createLoginOtp(pool,req,res)
});

router.get('/validateOtp',(req, res, next) => {
  otp.validateOtp(pool,req,res)
});

router.post('/otpLogin', (req, res, next) => {
  users.insertUsersUsingOtp(pool,req,res)
});

router.post('/insertAgent', (req, res, next) => {
  users.insertAgent(pool,req,res)
});

router.post('/insertTest', (req, res, next) => {
  tests.insertTest(pool,req,res)
});
router.post('/genrateslots', (req, res, next) => {
  users.genrateSlots(pool,req,res)
});
router.post('/insertorder', (req, res, next) => {
  order.insertOrder(pool,req,res)
});
router.get('/gettests', (req, res, next) => {
  tests.getTests(pool,req,res)
});
router.get('/getorders', (req, res, next) => {
  order.getOrders(pool,req,res)
});
//Next two routes are to be kept together
router.post('/search', async (req, res, next) => {
  console.log(req.body)
  res.send({
    "error": {},
    "message": {
      "ack": {
        "status": "ACK"
      }
    }
  })
  // next()

  const result = await hspaModels.handleSearch(pool, req)
  console.log(result)
})

// router.post('/searchCallback', async (req, res, next) => {
//   const result = await hspaModels.handleSearch(pool, req)
// })

module.exports = router