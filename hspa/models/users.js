const query = require('../queries/usersQuery.js')

var jwt = require('jsonwebtoken');

exports.insertUsersUsingOtp = async function (pool, req, res) {
  const client = await pool.connect()
  try {
    client.query('START TRANSACTION')
    let primary_mobile_number = req.body.mobile_number.trim()
        if (primary_mobile_number.length !== 10) {
            throw new Error({message: 'mobile_number must be 10 digits', error: 'invalid mobile_number', data: {}})
        } else {
            let users_name = req.body.name.trim()
            const userExist= await client.query('SELECT * FROM users where mobile_number=$1', [primary_mobile_number]);
            if(userExist.rows.length==0){
              const insertUserData = await client.query('INSERT INTO users(mobile_number, name, user_type, user_status) VALUES($1,$2,$3,$4) RETURNING *', [primary_mobile_number, users_name, req.body.user_type, 'Active'])
              if (insertUserData.rows.length > 0) {
                // return { auth: true, data: insertUserData.rows[0] }
                var token = jwt.sign({ id: insertUserData.rows[0].id }, process.env.TOKEN_SECRET
                );
                const insertSessionData = await client.query(query.postUserSessionQuery(), [token, insertUserData.rows[0].id, 'Not Expired'])
                
                var data={
                  auth:true,
                  token:token,
                  user_id:insertUserData.rows[0].id,
                  user_type:insertUserData.rows[0].user_type,
                  user_name:insertUserData.rows[0].name,
                  mobile_number:insertUserData.rows[0].mobile_number
                }
                res.send(data)
              } else {
                req.status(400).send({error: 'Could not register user.'})
              }
            } else {
              // return { auth: true, data: userExist.rows[0]}
              var token = jwt.sign({ id: userExist.rows[0].id }, process.env.TOKEN_SECRET
                );
                const insertSessionData = await client.query(query.postUserSessionQuery(), [token, userExist.rows[0].id, 'Not Expired'])
                
                var data={
                  auth:true,
                  token:token,
                  user_id:userExist.rows[0].id,
                  user_type:userExist.rows[0].user_type,
                  user_name:userExist.rows[0].name,
                  mobile_number:userExist.rows[0].mobile_number
                }
                res.send(data)
            }
        }
  } catch (err) {
    client.query('ROLLBACK')
    console.log(err)
    // return err
    res.status(400).send({error: err})
  } finally {
    client.query('COMMIT')
    client.release()
  }
}

exports.insertAgent = async function(pool, req, res) {
  const client = await pool.connect()
  try {
    client.query('START TRANSACTION')
    let primary_mobile_number = req.body.mobile_number.trim()
    if (primary_mobile_number.length !== 10) {
        throw new Error({message: 'mobile_number must be 10 digits', error: 'invalid mobile_number', data: {}})
    } else {
      const checkAgentData = await client.query(`SELECT * from users where mobile_number='${primary_mobile_number}'`)
      if (checkAgentData.rows.length > 0) {
        throw new Error('User with this mobile number already exists.')
      } else {
        const insertUserData = await client.query('INSERT INTO users(mobile_number, name, user_type, user_status) VALUES($1,$2,$3,$4) RETURNING *', [primary_mobile_number, req.body.name.trim(), 'Agent', 'Active'])
        if (insertUserData.rows.length > 0) {
          res.status(200).send(insertUserData.rows[0])
        } else {
          throw new Error('Could not add agent, try again later.')
        }
      }
    }
  } catch (err) {
    client.query('ROLLBACK')
    console.log(err)
    // return err
    res.status(400).send({error: err.message})
  } finally {
    client.query('COMMIT')
    client.release()
  }
}

exports.genrateSlots = async function(pool, req, res) {
  const client = await pool.connect()
  try {
    client.query('START TRANSACTION')
    user_id = req.body.user_id
    start_time = new Date(req.body.start_time)
    end_time = new Date(req.body.end_time)
    intverval = 30
    slots = []
    console.log(start_time)
    console.log(end_time)
    start_time = addMinutes(start_time,(30-start_time.getMinutes()%30))
    while(start_time < end_time){
      slots.push(start_time)
      start_time = addMinutes(start_time,intverval);
    }
    for(i in slots){
      const insertslots = await client.query('INSERT INTO agent_slots(agent_id, start_time, end_time) VALUES($1,$2,$3) \
        RETURNING *', [user_id,slots[i], addMinutes(slots[i],intverval)])
    }
    res.status(200).send({"msg": "slots added"})
  } catch (err) {
    client.query('ROLLBACK')
    console.log(err)
    // return err
    res.status(400).send({error: err.message})
  } finally {
    client.query('COMMIT')
    client.release()
  }
}
function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes*60000);
}


exports.insertAgent = async function(pool, req, res) {
  const client = await pool.connect()
  try {
    client.query('START TRANSACTION')
    let primary_mobile_number = req.body.mobile_number.trim()
    if (primary_mobile_number.length !== 10) {
        throw new Error({message: 'mobile_number must be 10 digits', error: 'invalid mobile_number', data: {}})
    } else {
      const checkAgentData = await client.query(`SELECT * from users where mobile_number='${primary_mobile_number}'`)
      if (checkAgentData.rows.length > 0) {
        throw new Error('User with this mobile number already exists.')
      } else {
        const insertUserData = await client.query('INSERT INTO users(mobile_number, name, user_type, user_status) VALUES($1,$2,$3,$4) RETURNING *', [primary_mobile_number, req.body.name.trim(), 'Agent', 'Active'])
        if (insertUserData.rows.length > 0) {
          res.status(200).send(insertUserData.rows[0])
        } else {
          throw new Error('Could not add agent, try again later.')
        }
      }
    }
  } catch (err) {
    client.query('ROLLBACK')
    console.log(err)
    // return err
    res.status(400).send({error: err.message})
  } finally {
    client.query('COMMIT')
    client.release()
  }
}

exports.getSlots = async function(pool, req, res) {
  const client = await pool.connect()
  try {
    client.query('START TRANSACTION')
    user_id = req.query.agent_id
    const slots_date= await client.query("select *,TO_CHAR(start_time, 'DD/MM/YYYY') as date from agent_slots \
    where agent_id = $1", [user_id])
    res.status(200).send(slots_date.rows)

  } catch (err) {
    client.query('ROLLBACK')
    console.log(err)
    // return err
    res.status(400).send({error: err.message})
  } finally {
    client.query('COMMIT')
    client.release()
  }
}
function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes*60000);
}