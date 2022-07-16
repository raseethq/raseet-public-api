const urlencode = require('urlencode');
const dotenv = require('dotenv')
const fetch=require('node-fetch');
const { verify } = require('jsonwebtoken');
const pool = require('../../dbconn');
const query = require('./smsQuery')
dotenv.config()

let sender = process.env.SMS_SENDER
let gupshupUserId= process.env.GUPSHUP_USER_ID
let gupshupPassword = process.env.GUPSHUP_PASSWORD

exports.sendSMSfinal= async function(pool,req,res,type,payload = {otp:0,number:0,name:""}) {

  var url;

  if(type === "Login OTP"){
    const msg = `${payload.otp} is your OTP to login. Never share your OTP with anyone.`
    var encodedMessage = urlencode(msg);

    url = `https://enterprise.smsgupshup.com/GatewayAPI/rest?method=SendMessage&send_to=${payload.number}&msg=${encodedMessage}&msg_type=TEXT&mask=${sender}&userid=${gupshupUserId}&auth_scheme=plain&password=${gupshupPassword}&v=1.1&format=text`;
  }
  return fetch(url, {
    method: "GET",
  })
  .then(response => response.text())
  .then(async response => {
    console.log(response)
  })
  .catch((e) => {
      console.log(e)
      res.status(400).send(e)
  })
}