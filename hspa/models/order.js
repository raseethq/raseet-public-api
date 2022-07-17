const uuid = require('uuid')
const query = require('../queries/usersQuery.js')

var jwt = require('jsonwebtoken');

exports.insertOrder = async function (pool, req, res) {
  const client = await pool.connect()
  try {
    data=req.body
    client.query('START TRANSACTION')
    var customer_order_id = req.body.order.id
    console.log(req.body.order)
    var items = req.body.order.items
    var customer_id = req.body.customer.id
    var customer_cred= req.body.customer.cred
    var customer_name = req.body.order.billing.name
    var billing_address = req.body.order.billing
    var status = "PROVISIONAL"
    var order_amount =0
    var breakup=[]
    ordercheck = await client.query('select * FROM orders where customer_order_id = $1',[customer_order_id]);
    if(ordercheck.roes.length>0){
      res.send(data) 
    }
    for (var i in items)
    {
      console.log(items[i])
        order_amount = order_amount+items[i].price.value
        var item_breakup = {
          title: items[i].descriptor.name,
          price:{
            value:items[i].price.value
          }
        }
        breakup.push(item_breakup)

    }
    const insertorder= await client.query('insert into orders (customer_id,customer_cred,customer_name,billing_address, \
      order_amount,customer_order_id,agent_id,status) \
         Values ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', [customer_id,customer_cred,customer_name,billing_address,order_amount,
          customer_order_id,1,"PROVISIONAL"]);
         console.log(insertorder)
         if (insertorder.rows.length > 0) {    
            for (var i in items){
                await client.query('insert into order_items(order_id,tests_name,amount) \
                 Values ($1,$2,$3) RETURNING *', [insertorder.rows[0].id,items[i].descriptor.name,items[i].price.value]);

            }    
         } 
         let trnsactionId = uuid.v4();

         insertPayment= await client.query('insert into payment (transaction_id,amount,order_id,status) \
         Values ($1,$2,$3,$4) RETURNING *', [trnsactionId,order_amount,insertorder.rows[0].id,"PAYMENT_PENDING"]);


            var price = {
              "currency": "INR",
               "value": order_amount
            }
            
            var quote={
              price:price,
              breakup:breakup,
            }
            var payment = {
              uri: "https://api.bpp.com/pay?amt=100&txn_id=ksh87yriuro34iyr3p4&mode=upi&vpa=doctor@upi",
              type: "ON-ORDER",
              status: "NOT-PAID",
              tl_method: null,
              params: null
          }
          data['quote']=quote
          data['payment']=payment
          res.send(data)   
        }catch (err) {
            client.query('ROLLBACK')
            console.log(err)
            // return err
            res.status(400).send({error: err.message})
          } finally {
            client.query('COMMIT')
            client.release()
          }
        }

        exports.getOrders = async function (pool, req, res) {
          const client = await pool.connect()
          try {
            client.query('START TRANSACTION')
            var tests=null
            orders=[]
            if(req.query.id){

              order = await client.query('select * FROM orders where id = $1',[req.query.id]);
            } else if(req.query.agent_id){

              order = await client.query('select * FROM orders where agent_id = $1',[req.query.agent_id]);
            }else{
              order= await client.query('select * FROM orders');
            }
            console.log(order.rows)
            for (var i in order.rows)
            {
              agent=await client.query('select * FROM users where id = $1',[order.rows[i].agent_id]);
              items = await client.query('select * FROM order_items where order_id = $1',[order.rows[i].id]);
              payment =  await client.query('select * FROM payment where order_id = $1',[order.rows[i].id]);
              order.rows[i].agent=null
              order.rows[i].items=null
              order.rows[i].payment=null
              order.rows[i].agent=agent.rows[0]
              order.rows[i].items=items.rows
              order.rows[i].payment=payment[0]

            }
                
                res.send(order.rows)
                }catch (err) {
                    client.query('ROLLBACK')
                    console.log(err)
                    // return err
                    res.status(400).send({error: err.message})
                  } finally {
                    client.query('COMMIT')
                    client.release()
                  }
                }

exports.getOrderstatus = async function (pool, req, res) {
    data=[
      {
        previous_status:"PROVISIONAL",
        current_status:"CONFIRMED"

      },{
        previous_status:"CONFIRMED",
        current_status:"SAMPLE_COLLECTED"
      },{
        previous_status:"SAMPLE_COLLECTED",
        current_status:"REPORTS_GENRATED"
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

      order = await client.query('update orders set status=$1 where id=$2',[order_status,order_id]);
      res.status(200).send({"msg":"updated"})
        }catch (err) {
            client.query('ROLLBACK')
            console.log(err)
            // return err
            res.status(400).send({error: err.message})
          } finally {
            client.query('COMMIT')
            client.release()
          }
        }

exports.confirmOrder = async function (pool, req, res) {
  const client = await pool.connect()
    try {
        data=req.body
        client.query('START TRANSACTION')
        var customer_order_id = req.body.order.id
        order = await client.query('select * FROM orders where customer_order_id = $1',[customer_order_id]);
        if (order.rows[0].status!='PROVISIONAL')
        {
          payment = await client.query('select * FROM payment where order_id = $1',[order.rows[0].id]);
          var payment = {
            uri: "https://api.bpp.com/pay?amt=100&txn_id=ksh87yriuro34iyr3p4&mode=upi&vpa=doctor@upi",
            type: "ON-ORDER",
            status: payment.rows[0].status,
            tl_method: null,
            params: {
              "transaction_id": "abc128-riocn83920",
              "amount": payment.rows[0].amount,
              "mode": "UPI",
              "vpa": "sana.bhatt@upi"
          }
          }
            data['payment']=payment
            data['state']="CONFIRMED"
        }else{
          payment = await client.query('select * FROM payment where order_id = $1',[order.rows[0].id]);
          var payment = {
            uri: "https://api.bpp.com/pay?amt=100&txn_id=ksh87yriuro34iyr3p4&mode=upi&vpa=doctor@upi",
            type: "ON-ORDER",
            status: payment.rows[0].status,
            tl_method: null,
            params: {
              "transaction_id": "abc128-riocn83920",
              "amount": payment.rows[0].amount,
              "mode": "UPI",
              "vpa": "sana.bhatt@upi"
          }
          }
            data['payment']=payment
            data['state']="PROVISIONAL"


        }
        
       res.send(data)
      }catch (err) {
          client.query('ROLLBACK')
          console.log(err)
          // return err
          res.status(400).send({error: err.message})
          } finally {
            client.query('COMMIT')
            client.release()
             }
           }
        
