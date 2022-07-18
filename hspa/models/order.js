const uuid = require('uuid')
const query = require('../queries/usersQuery.js')

var jwt = require('jsonwebtoken');
const { genrateSlots } = require('./users.js');
function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes*60000);
}
exports.insertOrder = async function (pool, req, res) {
  const client = await pool.connect()
  try {
    data = req.body
    client.query('START TRANSACTION')
    var customer_order_id = req.body.order.id
    console.log(req.body.order)
    var items = req.body.order.items
    var fulfillments = req.body.order.fulfillments
    var customer_id = req.body.order.customer.id
    var customer_cred = req.body.order.customer.cred
    var customer_name = req.body.order.billing.name
    var billing_address = req.body.order.billing
    var status = "PROVISIONAL"
    var order_amount = 0
    var breakup = []
    var available_items=[]
    var agent_fulfilment = null
    var aloted_agent =1
    console.log(fulfillments)
    ordercheck = await client.query('select * FROM orders where customer_order_id = $1', [customer_order_id]);
    if (ordercheck.rows.length > 0) {
      res.send([])
    } else {
      for (var i in items) {
        for (var j in fulfillments){
          if(items[i].fulfillment_id=fulfillments[j].id){
              test_item = await client.query('select * from tests  order_items where name = $1 and diagnostic_type = \
              $2', [items[i].descriptor.name,fulfillments[j].type]);
              if(test_item.rows.length>0){
                order_amount = order_amount + test_item.rows[0].price
                var item_breakup = {
                  title: items[i].descriptor.name,
                  price: {
                    value: test_item.rows[0].price
                  }
                }
                breakup.push(item_breakup)
                available_items.push(test_item.rows[0])
                agent_fulfilment = fulfillments[j]
              }
             
        }
       }
      }
      console.log(agent_fulfilment)
      console.log(agent_fulfilment.end.time.timestamp)
      console.log(agent_fulfilment.type)
      start_time =  new Date(agent_fulfilment.start.time.timestamp)
      start_time = addMinutes(start_time,330)
      end_time= new Date(agent_fulfilment.end.time.timestamp)
      end_time = addMinutes(end_time,330)
      const slots = await client.query('select agent_slots.* from agent_slots left join users on users.id=agent_slots.agent_id where agent_slots.start_time = \
      $1 and agent_slots.end_time = $2 and users.agent_type = $3', [start_time,end_time, agent_fulfilment.type]);
      if(slots.rows.length>0){
        aloted_agent=slots.rows[0].agent_id
      }
      console.log(slots.rows)
      const insertorder = await client.query('insert into orders (customer_id,customer_cred,customer_name,billing_address, \
        order_amount,customer_order_id,agent_id,status) \
           Values ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', [customer_id, customer_cred, customer_name, billing_address, order_amount,
        customer_order_id, aloted_agent, "PROVISIONAL"]);
      if (insertorder.rows.length > 0) {
        console.log(insertorder.rows)
        console.log(slots.rows)
        await client.query('update agent_slots set order_id = $1 where id = $2', [insertorder.rows[0].id,slots.rows[0].id]);
        
        for (var i in available_items) {
          await client.query('insert into order_items(order_id,tests_name,amount) \
                   Values ($1,$2,$3) RETURNING *', [insertorder.rows[0].id, available_items[i].name, available_items[i].price]);

        }
      }
      let trnsactionId = uuid.v4();
      let payment_link = "http://hspa.raseet.com/payment/order?transaction_id=" + trnsactionId + "&amt=" + order_amount + "mode=upi&vpa=doctor@upi"

      insertPayment = await client.query('insert into payment (transaction_id,amount,order_id,status,payment_link) \
           Values ($1,$2,$3,$4,$5) RETURNING *', [trnsactionId, order_amount, insertorder.rows[0].id, "PAYMENT_PENDING", payment_link]);


      var price = {
        "currency": "INR",
        "value": order_amount
      }

      var quote = {
        price: price,
        breakup: breakup,
      }
      var payment = {
        uri: payment_link,
        type: "ON-ORDER",
        status: "NOT-PAID",
        tl_method: null,
        params: null
      }
      data.order['quote'] = quote
      data.order['payment'] = payment
      res.send(data)
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

exports.getOrders = async function (pool, req, res) {
  const client = await pool.connect()
  try {
    client.query('START TRANSACTION')
    var tests = null
    orders = []
    if (req.query.id) {

      order = await client.query('select * FROM orders where id = $1', [req.query.id]);
    } else if (req.query.agent_id) {

      order = await client.query('select * FROM orders where agent_id = $1', [req.query.agent_id]);
    } else {
      order = await client.query('select * FROM orders');
    }
    console.log(order.rows)
    for (var i in order.rows) {
      agent = await client.query('select * FROM users where id = $1', [order.rows[i].agent_id]);
      items = await client.query('select * FROM order_items where order_id = $1', [order.rows[i].id]);
      payment = await client.query('select * FROM payment where order_id = $1', [order.rows[i].id]);
      slot = await client.query('select * FROM agent_slots where order_id = $1', [order.rows[i].id]);
      order.rows[i].agent = null
      order.rows[i].items = null
      order.rows[i].payment = null
      order.rows[i].agent = agent.rows[0]
      order.rows[i].items = items.rows
      order.rows[i].payment = payment[0]
      order.rows[i].slot = slot.rows[0]

    }

    res.send(order.rows)
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

exports.getOrderstatus = async function (pool, req, res) {
  data = [
    {
      previous_status: "PROVISIONAL",
      current_status: "CONFIRMED"

    }, {
      previous_status: "CONFIRMED",
      current_status: "SAMPLE_COLLECTED"
    }, {
      previous_status: "SAMPLE_COLLECTED",
      current_status: "REPORTS_GENRATED"
    }

  ]
  res.status(200).send(data)


}

exports.updateOrderStatus = async function (pool, req, res) {
  const client = await pool.connect()
  try {
    order_id = req.body.order_id
    order_status = req.body.order_status
    client.query('START TRANSACTION')

    order = await client.query('update orders set status=$1 where id=$2', [order_status, order_id]);
    res.status(200).send({ "msg": "updated" })
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

exports.confirmOrder = async function (pool, req, res) {
  const client = await pool.connect()
  try {
    data = req.body
    client.query('START TRANSACTION')
    var customer_order_id = req.body.order.id
    order = await client.query('select * FROM orders where customer_order_id = $1', [customer_order_id]);
    if (order.rows[0].status != 'PROVISIONAL') {
      payment = await client.query('select * FROM payment where order_id = $1', [order.rows[0].id]);
      var payment = {
        uri: payment.rows[0].payment_link,
        type: "ON-ORDER",
        status: payment.rows[0].status,
        tl_method: null,
        params: {
          "transaction_id": payment.rows[0].transaction_id,
          "amount": payment.rows[0].amount,
          "mode": "UPI",
          "vpa": payment.rows[0].customer_upi_id
        }
      }
      data.order['payment'] = payment
      data.order['state'] = "CONFIRMED"
    } else {
      payment = await client.query('select * FROM payment where order_id = $1', [order.rows[0].id]);
      var payment = {
        uri: payment.rows[0].payment_link,
        type: "ON-ORDER",
        status: payment.rows[0].status,
        tl_method: null,
        params: {
          "transaction_id": payment.rows[0].transaction_id,
          "amount": payment.rows[0].amount,
          "mode": "UPI",
          "vpa": payment.rows[0].customer_upi_id
        }
      }
      data.order['payment'] = payment
      data.order['state'] = "PROVISIONAL"


    }

    res.send(data)
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


exports.orderPayment = async function (pool, req, res) {
  let transaction_id = req.body.transaction_id
  let customer_upi_id = req.body.customer_upi_id
  let status = req.body.status // PENDING,PAID,AWAITED,FAILED
  const client = await pool.connect()
  try {
    client.query('START TRANSACTION')
    payment = await client.query('update payment set status=$1,customer_upi_id=$2 where  \
    transaction_id=$3 RETURNING *', [status,customer_upi_id,transaction_id]);
    if (status=="PAID")
    {
      order = await client.query("update orders set status='CONFIRMED' where  \
    id=$1 RETURNING *", [payment.rows[0].order_id]);
    }
    res.status(200).send({ "msg": "sucess" })
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
