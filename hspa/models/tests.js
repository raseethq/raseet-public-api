const query = require('../queries/usersQuery.js')

var jwt = require('jsonwebtoken');

exports.insertTest = async function (pool, req, res) {
  const client = await pool.connect()
  try {
    client.query('START TRANSACTION')
        if (req.body.code){
            const deletetest= await client.query('delete FROM tests where code=$1', [req.body.code]);
        }
        const inserttest= await client.query('insert into tests(code,name,price,instruction) \
         Values ($1,$2,$3,$4) RETURNING *', [req.body.code,req.body.name,req.body.price,req.body.instruction]);
         if (inserttest.rows.length > 0) {            
            var data={
              id:inserttest.rows[0].id,
              code:inserttest.rows[0].code,
              name:inserttest.rows[0].name,
              price:inserttest.rows[0].price,
              instruction:inserttest.rows[0].instruction
            }
            res.send(data)
          } else {
            req.status(400).send({error: 'Could not register user.'})
          }
    
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

        exports.getTests = async function (pool, req, res) {
          const client = await pool.connect()
          try {
            console.log(req.query)
            client.query('START TRANSACTION')
            var tests=null
            if(req.query.id){

              tests = await client.query("select * FROM tests where id = "+req.query.id+" ");
            } else if(req.query.name) {
              tests = await client.query("select * FROM tests where Lower(name) like '%"+req.query.name.toLowerCase()+"%' ");
            }           
            else{
              tests= await client.query('select * FROM tests');
            }
                
                res.send(tests.rows)
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

