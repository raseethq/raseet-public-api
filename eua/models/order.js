
const uuid = require('uuid')
const fetch = require('node-fetch')

exports.startSearch = async function(pool, req, res) {
  const client = await pool.connect()
  try {
    var data = req.body
    var intentObj = await createIntentObj(data)

    var request_id = uuid.v4()
    var transaction_id = uuid.v4()
    var timestamp = new Date().toISOString()

    var context = {
      "domain": "nic2004:85111",
      "country": "IND",
      "city": "std:080",
      "action": "search",
      "timestamp": timestamp,
      "core_version": "0.7.1",
      "consumer_id": "raseet-com",
      "consumer_uri": "http://api.raseet.com/eua",
      "transaction_id": transaction_id
    }

    var searchURL = ""
    var headerObj = {}
    if (data.search_endpoint === "gateway_search") {
      searchURL = 'http://121.242.73.120:8083/api/v1/search'
      headerObj = {
        'X-Gateway-Authorization': 'value',
        'Content-Type': 'application/json'
      }
    } else {
      searchURL = data.search_provider_uri + "/search"
      headerObj = {
        'Content-Type': 'application/json'
      }
      context['provider_id'] = data.search_provider_id
      context['provider_uri'] = data.search_provider_uri
    }
    console.log(context)
    const sendSearch = await fetch(searchURL, {
      method: 'POST',
      body: JSON.stringify({"context": context, "message": {
        "intent": intentObj
      }}),
      headers: headerObj
    }).then(res => res.json())

    const insertEUACallData = await client.query(`INSERT INTO eua_call_logs(request_id, transaction_id, req_type, req_json, res_json) VALUES ('${request_id}', '${transaction_id}', '${data.search_endpoint}', '${JSON.stringify({"context": context, "message": {
      "intent": intentObj
    }})}', '${JSON.stringify(sendSearch)}') RETURNING *`)

    if (sendSearch.message.ack.status === "ACK") {
      res.status(200).send({
        accepted: true,
        request_id: request_id,
        transaction_id: transaction_id
      })
    } else {
      res.status(400).send({
        accepted: false,
        request_id: request_id,
        transaction_id: transaction_id
      })
    }

  } catch (err) {
    console.log(err)
    res.status(400).send(err)
  } finally {
    client.release()
  }
}

exports.pollSearch = async function(pool, req, res) {
  const client = await pool.connect()
  try {
    const request = await await client.query("SELECT * from eua_call_logs where request_id=$1",[req.body.request_id])
    console.log(request.rows[0])
    const results = await client.query("SELECT * from eua_endpoint_logs where transaction_id=$1 and \
    api_endpoint='on_search'",[request.rows[0].transaction_id])
    var tests={}
    if (results.rows.length > 0) {

      for(var i in results.rows)
      {
        if(results.rows[i].endpoint_data.message.catalog){
          console.log("abc")
        temp_items = results.rows[i].endpoint_data.message.catalog.items
        temp_fullfill = results.rows[i].endpoint_data.message.catalog.fulfillments
        if (temp_items.length >0)
        {
          for(var j in temp_items){
            for (var k in temp_fullfill){
              if (temp_items[j].fulfillment_id==temp_fullfill[k].id)
              {
                console.log("abc")
                if(request.rows[0].req_type=='gateway_search'){
                  console.log("def")
                  if (tests.hasOwnProperty(temp_items[j].name)){
                    if(tests[temp_items[j].name].name.providers.hasOwnProperty(temp_fullfill[k].agent.name)){
                      if(tests[temp_items[j].name].name.providers[temp_fullfill[k].agent.name].type)
                      {
                        tests[temp_items[j].name].name.providers[temp_fullfill[k].agent.name].type.push(temp_fullfill[k].type)
                      }else{
                        temp_type = [temp_fullfill[k].type]
                        tests[temp_items[j].name].name.providers[temp_fullfill[k].agent.name]['type']=temp_type
                      }
                        
                    }else{
                      temp_type = [temp_fullfill[k].type]
                      tests[temp_items[j].name].name.providers[temp_fullfill[k].agent.name]={
                        "type":temp_type
                      }
                    }
                  }else{
  
                    temp_type = [temp_fullfill[k].type]
                    temp_agent = {
                      type:[temp_type]
                    }
                   

                      tests[temp_items[j].descriptor.name]={ "providers":{}}
                      tests[temp_items[j].descriptor.name].providers[temp_fullfill[k].agent.name]=temp_agent
                      
                  }

                }else if (request.rows[0].req_type=='hspa_search'){


                }

              }
            }
          }
        }
      }
      }
      res.status(200).send(tests)
    } else {
      res.status(200).send([])
    }
    
  } catch (err) {
    console.log(err)
    res.status(400).send(err)
  } finally {
    client.release()
  }
}

async function createIntentObj(data) {
  
  if (data.query_type === 'LAB') {
    return {
      "fulfillment": {
        "type": "DIAGNOSTIC",
        "agent": {
          "name": data.query_value
        }
      }
    }
    // intentObj['fulfillment']['agent'] = {
    //     "name": data.query_value
    // }
  } else if (data.query_type === 'TEST') {
    return {
      fulfillment: {
        "type": "DIAGNOSTIC"
      },
      "item": {
        "descriptor": {
          "name": data.query_value
        }
      }
    }
    // intentObj['item'] == {
    //   "descriptor": {
    //     "name": data.query_value
    //   }
    // }
  } else if (data.query_type === 'LOCATION') {

  } else if (data.query_type === 'TIME') {

  }
}