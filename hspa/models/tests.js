const query = require('../queries/usersQuery.js')
const uuid = require('uuid')
var jwt = require('jsonwebtoken');

exports.insertTest = async function (pool, req, res) {
  const client = await pool.connect()
  try {
    client.query('START TRANSACTION')
    if (req.body.code) {
      const deletetest = await client.query('delete FROM tests where code=$1', [req.body.code]);
    }
    const inserttest = await client.query('insert into tests(code,name,price,instruction) \
         Values ($1,$2,$3,$4) RETURNING *', [req.body.code, req.body.name, req.body.price, req.body.instruction]);
    if (inserttest.rows.length > 0) {
      var data = {
        id: inserttest.rows[0].id,
        code: inserttest.rows[0].code,
        name: inserttest.rows[0].name,
        price: inserttest.rows[0].price,
        instruction: inserttest.rows[0].instruction
      }
      res.send(data)
    } else {
      req.status(400).send({ error: 'Could not register user.' })
    }

  } catch (err) {
    client.query('ROLLBACK')
    console.log(err)
    // return err
    res.status(400).send({ error: err.message })
  } finally {
    client.query('COMMIT')
    client.release()
  }
}

exports.getTests = async function (pool, req, res) {
  const client = await pool.connect()
  try {
    console.log(req.query)
    client.query('START TRANSACTION')
    var tests = null
    if (req.query.id) {

      tests = await client.query("select * FROM tests where id = " + req.query.id + " ");
    } else if (req.query.name) {
      tests = await client.query("select * FROM tests where Lower(name) like '%" + req.query.name.toLowerCase() + "%' ");
    }
    else {
      tests = await client.query('select * FROM tests');
    }

    res.send(tests.rows)
  } catch (err) {
    client.query('ROLLBACK')
    console.log(err)
    // return err
    res.status(400).send({ error: err.message })
  } finally {
    client.query('COMMIT')
    client.release()
  }
}

exports.gatewaySearch = async function (pool, req, res) {
  const client = await pool.connect()
  try {
    search_type = req.body.search_type
    str = "shiva path lab"
    agent_name = null
    item_name = null
    pincode = null
    start_time = null
    end_time = null
    if (req.body.message.intent.fulfillment.agent) {
      if (req.body.message.intent.fulfillment.agent.name) {
        agent_name = req.body.message.intent.fulfillment.agent.name.toLowerCase()
      }
    }
    if (req.body.message.intent.fulfillment.start) {
      if (req.body.message.intent.fulfillment.start.time) {
        start_time = req.body.message.intent.fulfillment.start.time.timestamp
      }
    }
    if (req.body.message.intent.fulfillment.end) {
      if (req.body.message.intent.fulfillment.end.time) {
        end_time = req.body.message.intent.fulfillment.end.time.timestamp
      }
    }
    if (!(req.body.message.intent.fulfillment.type == "DIAGNOSTIC" || req.body.message.intent.fulfillment.type == "HOME_DIAGNOSTIC")) {
      // res.status(400).send({error: "type not supported"})
      throw new Error('type not supported')
    }
    if (agent_name) {
      if (str.search(agent_name) === -1) {
        throw new Error('No agent found supported')
      }
    }
    if (req.body.message.intent.item) {
      item_name = req.body.message.intent.item.descriptor.name.toLowerCase()
    }

    var data = {
      "catalog": {
        "descriptor": {
          "name": "Raseet HSPA"
        }
      }
    }
    var items = []
    var fulfillments = []
    var count = 1
    // in case of hspa default search window is 3 days
    if (!start_time || !end_time) {
    if (search_type == "HSPA") {
      start_time = new Date()
      end_time = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    }
  }
    if (start_time && end_time) {
      slots = await client.query("select * FROM agent_slots left join users on users.id = agent_slots.agent_id \
      where start_time > $1 and end_time < $2 \
          and order_id is null", [start_time, end_time]);
      if (slots.rows.length == 0) {
        throw new Error('No slots found')
      }
    }
    if (item_name) {
      tests = await client.query("select * FROM tests left join instructions on tests.instruction=instructions.id \
      where Lower(name) like '%"+ item_name.toLowerCase() + "%'");
    } else {
      tests = await client.query('select * FROM tests left join instructions on tests.instruction=instructions.id');
    }
    if (search_type == "GATEWAY") {
      for (var i in tests.rows) {
        let fulfillment_id = uuid.v4();
        var item = {
          id: tests.rows[i].id,
          "descriptor": {
            "name": tests.rows[i].name
          },
          "fulfillment_id": fulfillment_id,
          "price": {
            "currency": "INR",
            "value": tests.rows[i].price
          }
        }
        var fulfillment = {
          "id": fulfillment_id,
          "type": tests.rows[i].diagnostic_type,
          "agent": {
            "id": "123123",
            "name": "shiva path lab"
          }
        }
        items.push(item)
        fulfillments.push(fulfillment)
      }
    } else if (search_type == "HSPA") {
      console.log(slots)
      for (var i in tests.rows) {
        for (var j in slots.rows) {
          console.log(slots.rows[j])
          if (slots.rows[j].agent_type == tests.rows[i].diagnostic_type) {

            let fulfillment_id = uuid.v4();
            var item = {
              id: count,
              "descriptor": {
                "name": tests.rows[i].name
              },
              "fulfillment_id": fulfillment_id,
              "price": {
                "currency": "INR",
                "value": tests.rows[i].price
              }
            }
            var fulfillment = {
              "id": fulfillment_id,
              "type": tests.rows[i].diagnostic_type,
              "agent": {
                "id": "123123",
                "name": "shiva path lab"
              },
              "start": {
                "time": {
                  "timestamp": slots.rows[j].start_time
                }
              }, "end": {
                "time": {
                  "timestamp": slots.rows[j].end_time
                }
              }
            }
            items.push(item)
            fulfillments.push(fulfillment)
            count = count + 1
          }
        }

      }}
      data.catalog['items'] = items
      data.catalog['fulfillments'] = fulfillments

      res.status(200).send(data)
    } catch (err) {
      console.log(err)
      res.status(400).send({ error: err.message })
    } finally {
      client.release()
    }
  }