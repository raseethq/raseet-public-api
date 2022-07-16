const fetch=require('node-fetch');

exports.handleSearch = async function (pool, req, res) {

  return await fetch('http://121.242.73.120:8083/api/v1/on_search', {
    method: 'POST',
    body: JSON.stringify(jsonResponse2),
    headers: {
      'X-Gateway-Authorization': 'value',
      'Content-Type': 'application/json'
    }
  })
  // .then(response => response.text()).then(res => console.log(res))
  // .catch(err => console.log(err))
  .then(response => response.json())
  const client = await pool.connect()
  try {
    var intentObj = req.body['message']['intent']
    var fulfillmentObj = intentObj['fulfillment']
    var ItemObj = intentObj['item']

    for await (let item of ItemObj) {
      const findItemData = await client.query(`SELECT * from lab_tests where name like '%${item['Descriptor']['name']}%`)

      // {
      //   fulfillment: {
      //     item: [
      //       {
      //         id: 1

      //       }
      //     ]
      //   }
      // }
      if (findItemData.rows.length) {
        res.status(200).send(findItemData.rows)
      } else {
        res.status(400).send([])
      }
    }
    // console.log(fulfillmentObj)
  } catch (err) {
    console.log(err)
  } finally {
    client.release()
  }
}

const jsonResponse2 = {
  "context": {
    "domain": "Health",
    "country": "IND",
    "city": "Noida",
    "action": "on_search",
    "timestamp": "2022-07-14T09:58:16.837097Z",
    "core_version": "0.7.1",
    "consumer_id": "raseet-com",
    "consumer_uri": "http://api.raseet.com/eua",
    "provider_id": "raseet-com",
    "provider_uri": "http://api.raseet.com/hspa",
    "transaction_id": "13a5db98-e0cd-4959-a85d-d850d0bbc892",
    "message_id": "04a9790b-e346-4037-bcf6-cb8c5e809583"
  },
  "message": {
    "catalog": {
      "descriptor": {
        "name": "Raseet HSPA"
      },
      "items": [
        {
          "id": "1",
          "descriptor": {
            "name": "Haemoglobin"
          },
          "fulfillment_id": 0,
          "price": {
            "currency": "INR",
            "value": "100"
          }
        },
        {
          "id": "2",
          "descriptor": {
            "name": "H1bca"
          },
          "fulfillment_id": 1,
          "price": {
            "currency": "INR",
            "value": "200"
          }
        }
      ],
      "fulfillments": [
        {
          "id": 0,
          "type": "DIAGNOSTIC",
          "agent": {
            "id": "123123",
            "name": "shiva path lab"
          },
          "tags": {
            "@abdm/gov.in/pincode": "201014"
          }
        },
        {
          "id": 1,
          "type": "DIAGNOSTIC",
          "agent": {
            "id": "123123",
            "name": "shiva path lab"
          },
          "tags ": {
            "@abdm/gov.in/pincode": "201014"
          }
        }
      ]
    }
  }
}

const jsonResponse = {
  "context": {
    "domain": "nic2004:85111",
    "country": "IND",
    "city": "std:080",
    "action": "on_search",
    "core_version": "0.7.1",
    "consumer_id": "raseet-com",
    "consumer_uri": "http://api.raseet.com/eua",
    "provider_id": "raseet-com",
    "provider_uri": "http://api.raseet.com/hspa",
    "transaction_id": "645994a2-a4f5-469f-99a1-df35fd0e4ccc",
    "message_id":  "959dfc5f-c905-45ff-a861-5080380502fe"
  },
  "message": {
    "catalog": {
      "descriptor": {
        "name": "Raseet HSPA"
      },
      "items": [
        {
          "id": "1",
          "descriptor": {
            "name": "Haemoglobin"
          },
          "fulfillment_id": "815a0394-1fd4-4466-b95e-7ebbe1fb3da4",
          "price": {
            "currency": "INR",
            "value": "100.0"
          },
          "tags ": {
            "@abdm/gov.in/description": "12 hours of fasting is required"
          }
        },
        {
          "id": "1",
          "descriptor": {
            "name": "H1bca"
          },
          "fulfillment_id": "815a0394-1fd4-4466-b95e-7ebbe1fb3da4",
          "price": {
            "currency": "INR",
            "value": "200.0"
          },
          "category_id": 1,
          "tags ": {
            "@abdm/gov.in/description": "No food or drink 8 hours before test"
          }
        }
      ],
      "fulfillments": [
        {
          "id": "815a0394-1fd4-4466-b95e-7ebbe1fb3da4",
          "type": "DIAGNOSTIC",
          "provider_id": "1",
          "agent": {
            "id": "123123",
            "name": "shiva path lab"
          },
          "tags ": {
            "@abdm/gov.in/description": "201014"
          }
        },
        {
          "id": "815a0394-1fd4-4466-b95e-7ebbe1fb3da4",
          "type": "DIAGNOSTIC",
          "provider_id": "1",
          "agent": {
            "id": "123123",
            "name": "shiva path lab"
          },
          "tags ": {
            "@abdm/gov.in/description": "201014"
          }
        }
      ]
    }
  }
}