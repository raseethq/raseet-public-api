const express = require('express')
const hspaModels = require('../models/hspaModels')
const pool = require('../../dbconn')
const router = express.Router()
const cors = require('cors')
const bodyParser = require('body-parser')
const url = require('url');
const fetch = require('node-fetch')

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
router.get('/getorderstatus', (req, res, next) => {
  order.getOrderstatus(pool,req,res)
});
router.post('/updateorderstatus', (req, res, next) => {
  order.updateOrderStatus(pool,req,res)
});
router.post('/gatewaysearch', (req, res, next) => {
  tests.gatewaySearch(pool,req,res)
});
router.post('/confirmorder', (req, res, next) => {
  order.confirmOrder(pool,req,res)
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
  // next()

  const result = await hspaModels.handleSearch(pool, req)
  console.log(result)
})

router.post('/init', async (req, res, next) => {
  console.log(req.body)
  res.send({
    "error": {},
    "message": {
      "ack": {
        "status": "ACK"
      }
    }
  })
  req.body['order'] = req.body.message.order
  req.body['customer'] = req.body.message.order.customer
  const url = process.env.PUBLIC_API_URL+"/hspa/insertorder"
  const resBody = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(req.body),
    headers: {
      'Content-Type': 'application/json'
    }})
    // .then(res => res.text())
    .then(res => res.json())
    // .catch(err => console.log(err))
  
  let context = req.body.context

  context['provider_id'] = process.env.PROVIDER_ID
  context['provider_uri'] = process.env.PROVIDER_URI

  // const sendOnInit = 
  fetch(`${req.body.context.consumer_uri}/on_init`, {
    method: 'POST',
    body: JSON.stringify({"context": context, "message": resBody})
  }).then(res => res.json()).then(res => console.log(res))
  .catch(err => console.log(err))
})

router.post('/confirm', async (req, res, next) => {
  console.log(req.body)
  res.send({
    "error": {},
    "message": {
      "ack": {
        "status": "ACK"
      }
    }
  })
  req.body['order'] = req.body.message.order
  const url = process.env.PUBLIC_API_URL+"/hspa/confirmorder"
  const resBody = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(req.body),
    headers: {
      'Content-Type': 'application/json'
    }})
    // .then(res => res.text())
    .then(res => res.json())
    // .catch(err => console.log(err))
  
  let context = req.body.context

  context['provider_id'] = process.env.PROVIDER_ID
  context['provider_uri'] = process.env.PROVIDER_URI

  // const sendOnInit = 
  fetch(`${req.body.context.consumer_uri}/on_init`, {
    method: 'POST',
    body: JSON.stringify({"context": context, "message": resBody})
  }).then(res => res.json()).then(res => console.log(res))
  .catch(err => console.log(err))
})

// router.post('/searchCallback', async (req, res, next) => {
//   const result = await hspaModels.handleSearch(pool, req)
// })

module.exports = router