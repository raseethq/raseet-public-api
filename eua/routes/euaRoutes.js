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

  insertIntoDB('on_search', req.body, req.body.context.transaction_id)
})

router.post('/on_init', async (req, res, next) => {
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

  insertIntoDB('on_init', req.body, req.body.context.transaction_id)
  
})

router.post('/on_confirm', async (req, res, next) => {
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

  insertIntoDB('on_confirm', req.body, req.body.context.transaction_id)

})

router.get('/viewLogs', async (req, res, next) => {
  if (req.query.transaction_id) {
    const result = await viewLogs(req.query.transaction_id)
    res.send(result)
  } else {
    const result = await viewLogs(0)
    res.send(result)
  }
})

const insertIntoDB = async function(api_endpoint, endpoint_data, transaction_id) {
  const client = await pool.connect()
  try {
    const insertData = await client.query('INSERT INTO eua_endpoint_logs(api_endpoint,endpoint_data, transaction_id) VALUES ($1, $2,$3) RETURNING *', [api_endpoint, endpoint_data, transaction_id])
  } catch (err) {
    console.log(err)
  } finally {
    client.release()
  }
}

const viewLogs = async function(transaction_id) {
  const client = await pool.connect()
  try {
    var viewData
    if (transaction_id) {
      viewData = await client.query(`SELECT * from eua_endpoint_logs where transaction_id='${transaction_id}' order by created_at desc`)
      return viewData.rows
    } else {
      viewData = await client.query('SELECT * from eua_endpoint_logs order by created_at desc')
      return viewData.rows
    }
  } catch (err) {
    console.log(err)
  } finally {
    client.release()
  }
}
  
module.exports = router