const express = require('express')
// const hspaModels = require('../models/hspaModels')
const pool = require('../../dbconn')
const router = express.Router()
const cors = require('cors')
const bodyParser = require('body-parser')

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

router.post('/on_search', async (req, res, next) => {
  // if (req.body.context.provider_id == 'raseet-com') 
  // console.log(req.body)
  res.send({
    "error": {},
    "message": {
      "ack": {
        "status": "ACK"
      }
    }
  })
})
  
module.exports = router