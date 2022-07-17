const fetch=require('node-fetch');
const uuid = require('uuid')

exports.handleSearch = async function (pool, req, res) {

  const url = process.env.PUBLIC_API_URL+"/hspa/gatewaySearch"
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

  var postUrl = ""
  if (req.body.context.provider_uri) {
    postUrl = req.body.context.consumer_uri + "/on_search"
  } else {
    postUrl = 'http://121.242.73.120:8083/api/v1/on_search'
  }

  context['provider_id'] = process.env.PROVIDER_ID
  context['provider_uri'] = process.env.PROVIDER_URI

  return await fetch(postUrl, {
    method: 'POST',
    body: JSON.stringify({"context": context, "message": resBody}),
    headers: {
      'X-Gateway-Authorization': 'value',
      'Content-Type': 'application/json'
    }
  })
  // .then(response => response.text())
  // .then(res => console.log(res))
  // .catch(err => console.log(err))
  .then(response => response.json())
}