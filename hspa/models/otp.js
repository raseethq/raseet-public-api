const query = require('../queries/otpQuery')
const usersQuery = require('../queries/usersQuery')
const { sendSMSfinal } = require('../helpers/sms')

const { insertUsersUsingOtp } = require('../models/users')

var jwt = require('jsonwebtoken');

exports.createOtp = async function (pool, req, res) {
  pool.connect(async function (err, client, done) {
    if (err) {
        console.log("Can not connect to the DB" + err);
        res.status(400).send({error: err})
    } else {
      if (req.body.mobile_number && req.body.otp_type) {
        if (req.body.otp_type === "'Registration'") {
            const currentTime = Date.now()/1000
            const userExist= await client.query('SELECT * FROM users where mobile_number=\''+ req.body.mobile_number.trim()+'\';');
            if (userExist.rows.length==0 || userExist.rows[0].user_status === "New") {
                const otpExists= await client.query('SELECT id,mobile_number,otp,created_at,updated_at,expired_at,EXTRACT(epoch from last_sent_at),otp_type from otp where mobile_number='+req.body.mobile_number+' and otp_type='+req.body.otp_type+';');
                if (otpExists.rows.length === 0) {
                client.query(query.postQuery(req), function (err, result) {
                    done();
                    if (err) {
                        console.log(err);
                        res.status(400).send(err);
                    } else {
                    // mobileNumber = "7042046838"
                    // sendRegistrationOtpSMS(result.rows[0].otp, result.rows[0].mobile_number)
                    sendSMSfinal(pool,req,res,'Registration OTP',{otp:result.rows[0].otp,number:result.rows[0].mobile_number})
                    res.status(200).send({status: "success", message: "OTP has been been sent to your phone."});
                    }
                })
                } else if (currentTime - otpExists.rows[otpExists.rows.length-1].date_part > 10){
                    client.query(query.updateQuery(req), function (err, result) {
                        done();
                        if (err) {
                            console.log(err);
                            res.status(400).send(err);
                        } else {
                        // mobileNumber = "7042046838"
                        // sendRegistrationOtpSMS(result.rows[0].otp, result.rows[0].mobile_number)
                        sendSMSfinal(pool,req,res,'Registration OTP',{otp:result.rows[0].otp,number:result.rows[0].mobile_number})
                        res.status(200).send({status: "success", message: "A new OTP has been sent to your phone."});
                        }
                    })
                } else {
                    done();
                    res.status(200).send({status: "failure", error: "Please wait for 10 seconds."});
                }
            }  else {
                done();
                res.status(200).send({status: "failure", error: "You are already registered."});
            }
        } else if (req.body.otp_type === "'Forgot Password'") {
            const userExist= await client.query('SELECT * FROM users where mobile_number=\''+ req.body.mobile_number+'\';');
            if (userExist.rows.length == 0) {
                done();
                res.status(200).send({status: "failure", error: "Sorry, looks like you aren't registered with us yet. Please register first."});
            } 
            // else if (userExist.rows[0].status === "New") {
            //     done();
            //     res.status(200).send({status: "failure", error: "Please activate your account by registering first."});
            // } 
            else {
                const currentTime = Date.now()/1000
                const otpExists= await client.query('SELECT id,mobile_number,otp,created_at,updated_at,expired_at,EXTRACT(epoch from last_sent_at),otp_type from otp where mobile_number='+req.body.mobile_number+' and otp_type='+req.body.otp_type+';');
                if (otpExists.rows.length === 0) {
                    client.query(query.postQuery(req), function (err, result) {
                        done();
                        if (err) {
                            console.log(err);
                            res.status(400).send(err);
                        }
                        // mobileNumber = "7042046838"
                        // sendRegistrationOtpSMS(otpExists.rows[0].otp, otpExists.rows[0].mobile_number)
                        sendSMSfinal(pool,req,res,'Registration OTP',{otp:otpExists.rows[0].otp,number:otpExists.rows[0].mobile_number})
                        res.status(200).send({status: "success", message: "OTP has been been sent to your phone.", value: {user_id: userExist.rows[0].id}});
                    })
                } else if (currentTime - otpExists.rows[otpExists.rows.length-1].date_part > 10){
                    client.query(query.updateQuery(req), function (err, result) {
                        done();
                        if (err) {
                            console.log(err);
                            res.status(400).send(err);
                        }
                        // mobileNumber = "7042046838"
                        // sendRegistrationOtpSMS(result.rows[0].otp, result.rows[0].mobile_number)
                        sendSMSfinal(pool,req,res,'Registration OTP',{otp:result.rows[0].otp,number:result.rows[0].mobile_number})
                        res.status(200).send({status: "success", message: "A new OTP has been sent to your phone.", value: {user_id: userExist.rows[0].id}});
                    })
                } else {
                    done();
                    res.status(200).send({status: "failure", error: "Please wait for 10 seconds.", value: {user_id: 0}});
                }
            }
        } else {
            done();
            res.status(400).send({status: "failure", error: "Wrong OTP Type.", value: {user_id: 0}});
        }
      } else {
          done();
          res.status(400).send({status: "failure", error: "Please enter a phone number.", value: {user_id: 0}}); // user Exist
      }
    }
  })
}

exports.validateOtp=function(pool,req,res){
  pool.connect( async function (err, client, done) {
      if (err) {
          console.log("Can not connect to the DB" + err);
          res.status(400).send({error: err})
      } else {
        // const currentTime = Date.now()/1000
        // client.query(query.getQuery(req), async function (err, result) {
        //      done();
        //      if (err) {
        //          console.log(err);
        //          res.status(400).send(err);
        //      }
        //      if (result.rows.length !== 0) {
        //         if (currentTime-result.rows[result.rows.length-1].date_part > 0) {
        //             res.status(400).send({auth: false, error: "OTP Expired"});
        //         } else {
        //             // const userData = await insertUsersUsingOtp({ body: {
        //             //   mobile_number: req.query.mobile_number,
        //             //   name: req.body.name
        //             // }})
        //             const userExist= await client.query(`SELECT * FROM users where mobile_number='${req.query.mobile_number}'`);
        //             console.log(userExist.rows)
        //             var token = jwt.sign({ id: userExist.rows[0].id }, process.env.TOKEN_SECRET
        //                 );
        //                 const insertSessionData = await client.query(usersQuery.postUserSessionQuery(), [token, userExist.rows[0].id, 'Not Expired'])
                        
        //                 var data={
        //                   auth:true,
        //                   token:token,
        //                   user_id:userExist.rows[0].id,
        //                   user_type:userExist.rows[0].user_type,
        //                   user_name:userExist.rows[0].name,
        //                   mobile_number:userExist.rows[0].mobile_number
        //                 }
        //                 // res.send(data)
        //             res.status(200).send({auth: true, message: "OTP verified.", data: data});
        //         }
        //      } else {
        //         //res.status(400).send({auth: false, error: "Wrong OTP"}) 
        //         res.status(200).send({auth: true, message: "OTP verified.", data: data});
        //      }
        // })
        const userExist= await client.query(`SELECT * FROM users where mobile_number='${req.query.mobile_number}'`);
        // console.log(userExist.rows)
        var token = jwt.sign({ id: userExist.rows[0].id }, process.env.TOKEN_SECRET
            );
            const insertSessionData = await client.query(usersQuery.postUserSessionQuery(), [token, userExist.rows[0].id, 'Not Expired'])
            
            var data={
                auth:true,
                token:token,
                user_id:userExist.rows[0].id,
                user_type:userExist.rows[0].user_type,
                user_name:userExist.rows[0].name,
                mobile_number:userExist.rows[0].mobile_number
            }
            // res.send(data)
        res.status(200).send({auth: true, message: "OTP verified.", data: data});
      }
  })
}

exports.createLoginOtp=async function(pool,req,res){
  pool.connect(async function (err, client, done) {
      if (err) {
          console.log("Can not connect to the DB" + err);
          res.status(400).send({error: err})
      }
      // console.log(req)
      if (req.body.mobile_number && req.body.otp_type) {

        try {
            const currentTime = Date.now()/1000
            var userExist
            var user_query
            // var continueOtp = false;
            // if (req.body.user_type) {
            //     if (req.body.user_type === "RETAILER") {
            //         var retailer_query = `SELECT * from retail_stores where primary_mobile_number='${req.body.mobile_number}'`
            //         var retailerExists = await client.query(retailer_query);
            //         if (retailerExists.rows.length === 0) {
            //             continueOtp = false;
            //             done();
            //             res.status(200).send({status: "failure", error: "User does not exist. RETAILER"});
            //         } else {
            //             user_query='SELECT * FROM users where mobile_number=\''+ req.body.mobile_number+'\';'
            //             userExist= await client.query(user_query);
            //             continueOtp = true;
            //         }
            //     } else if (req.body.user_type === "CUSTOMER") {
            //         var customer_query = `SELECT * from customers where phone_no=${req.body.mobile_number}`
            //         var customerExists = await client.query(customer_query);
            //         if (customerExists.rows.length === 0) {
            //             continueOtp = false;
            //             done();
            //             res.status(200).send({status: "failure", error: "User does not exist. CUSTOMER"});
            //         } else {
            //             user_query='SELECT * FROM users where mobile_number=\''+ req.body.mobile_number+'\';'
            //             userExist= await client.query(user_query);
            //             continueOtp = true;
            //         }
            //     } else {
            //         continueOtp = false;
            //         done();
            //         res.status(400).send({status: "failure", error: "Invalid user_type"})
            //     }
            // } else {
                user_query='SELECT * FROM users where mobile_number=\''+ req.body.mobile_number+'\';'
                userExist= await client.query(user_query);
                if (userExist.rows.length===0) {
                    continueOtp = false;
                    done();
                    res.status(200).send({status: "failure", error: "This phone number is not registered with us. Kindly register first."});
                } else {

                // continueOtp = true;
            // }
            // if (continueOtp) {
                const otpQuery =`SELECT o.id,o.mobile_number,o.otp,o.created_at,o.updated_at,o.expired_at,EXTRACT(epoch from last_sent_at),o.otp_type,u.name from otp o inner join users u on u.mobile_number = o.mobile_number::varchar where o.mobile_number='${req.body.mobile_number}' and o.otp_type='${req.body.otp_type}';`
                const otpExists= await client.query(otpQuery);
                if (otpExists.rows.length === 0) {
                  client.query(query.postQuery(req), function (err, result) {
                      done();
                      if (err) {
                          console.log(err);
                          res.status(400).send(err);
                      }
                      // mobileNumber = "7042046838"
          
                      
                      // sendLoginOtpSMS(result.rows[0].otp, result.rows[0].mobile_number,userExist.rows[0].name)
                      sendSMSfinal(pool,req,res,"Login OTP",{otp:result.rows[0].otp, number:result.rows[0].mobile_number,name:userExist.rows[0].name})
                      res.status(200).send({status: "success", message: "OTP has been been sent to your phone."});
                  })
                } else if (currentTime - otpExists.rows[otpExists.rows.length-1].date_part > 10){
                    client.query(query.updateQuery(req), function (err, result) {
                        done();
                        if (err) {
                            console.log(err);
                            res.status(400).send(err);
                        }
                        // mobileNumber = "7042046838"
      
                        // sendLoginOtpSMS(result.rows[0].otp, result.rows[0].mobile_number,userExist.rows[0].name)
                        sendSMSfinal(pool,req,res,"Login OTP",{otp:result.rows[0].otp, number:result.rows[0].mobile_number,name:userExist.rows[0].name})
      
                        res.status(200).send({status: "success", message: "OTP has been been sent to your phone."});
                    })
                    } else if (currentTime - otpExists.rows[otpExists.rows.length-1].date_part > 10){
                        client.query(query.updateQuery(req), function (err, result) {
                            done();
                            if (err) {
                                console.log(err);
                                res.status(400).send(err);
                            }
                            // mobileNumber = "7042046838"
                            // sendLoginOtpSMS(
                            //     result.rows[0].otp,
                            //     result.rows[0].mobile_number,
                            //     userExist.rows[0].name
                            // )
                            sendSMSfinal(pool,req,res,"Login OTP",{otp:result.rows[0].otp, number:result.rows[0].mobile_number,name:userExist.rows[0].name})
      
                            res.status(200).send({status: "success", message: "A new OTP has been sent to your phone."});
                        })
                    } else {
                        done();
                        res.status(200).send({status: "failure", error: "Please wait for 10 seconds."});
                    }
                }

                // } 

        } catch (err) {
            res.status(400).send({error: err})
        }
      } else {
          done();
          res.status(400).send({status: "failure", error: "Please enter a phone number."}); // user Exist
      }
  })
}

exports.createSampleCollectionOtp=async function(pool,req,res) {
    pool.connect(async function (err, client, done) {
        if (err) {
            console.log("Can not connect to the DB" + err);
            res.status(400).send({error: err})
        } else {
            if (req.body.mobile_number && req.body.otp_type) {
                try {
                    const currentTime = Date.now()/1000
                    const otpQuery =`SELECT o.id,o.mobile_number,o.otp,o.created_at,o.updated_at,o.expired_at,EXTRACT(epoch from last_sent_at),o.otp_type from otp o where o.mobile_number='${req.body.mobile_number}' and o.otp_type='${req.body.otp_type}';`
                    const otpExists= await client.query(otpQuery);
                    if (otpExists.rows.length === 0) {
                        client.query(query.postQuery(req), function (err, result) {
                            done();
                            if (err) {
                                console.log(err);
                                res.status(400).send(err);
                            }
                            // mobileNumber = "7042046838"
                
                            
                            // sendLoginOtpSMS(result.rows[0].otp, result.rows[0].mobile_number,userExist.rows[0].name)
                            sendSMSfinal(pool,req,res,"Sample Collection OTP",{otp:result.rows[0].otp, number:result.rows[0].mobile_number,name: ' '})
                            res.status(200).send({status: "success", message: "OTP has been been sent to your phone."});
                        })
                    } else if (currentTime - otpExists.rows[otpExists.rows.length-1].date_part > 10){
                        client.query(query.updateQuery(req), function (err, result) {
                            done();
                            if (err) {
                                console.log(err);
                                res.status(400).send(err);
                            }
                            // mobileNumber = "7042046838"
            
                            // sendLoginOtpSMS(result.rows[0].otp, result.rows[0].mobile_number,userExist.rows[0].name)
                            sendSMSfinal(pool,req,res,"Sample Collection OTP",{otp:result.rows[0].otp, number:result.rows[0].mobile_number,name: ' '})
            
                            res.status(200).send({status: "success", message: "OTP has been been sent to your phone."});
                        })
                    } else if (currentTime - otpExists.rows[otpExists.rows.length-1].date_part > 10){
                        client.query(query.updateQuery(req), function (err, result) {
                            done();
                            if (err) {
                                console.log(err);
                                res.status(400).send(err);
                            }
                            // mobileNumber = "7042046838"
                            // sendLoginOtpSMS(
                            //     result.rows[0].otp,
                            //     result.rows[0].mobile_number,
                            //     userExist.rows[0].name
                            // )
                            sendSMSfinal(pool,req,res,"Sample Collection OTP",{otp:result.rows[0].otp, number:result.rows[0].mobile_number,name: ' '})
      
                            res.status(200).send({status: "success", message: "A new OTP has been sent to your phone."});
                        })
                    } else {
                        done();
                        res.status(200).send({status: "failure", error: "Please wait for 10 seconds."});
                    }
                } catch (err) {
                    res.status(400).send({error: err})
                }
            } else {
                done();
                res.status(400).send({status: "failure", error: "Please enter a phone number."}); // user Exist
            } 
        }
    })
}

exports.validateSampleCollectionOtp=async function(pool,req,res) {
    const client = await pool.connect()
    try {
        pool.connect(function (err, client, done) {
            if (err) {
                console.log("Can not connect to the DB" + err);
                throw new Error("Can not connect to the DB" + err)
            } else {
            client.query(query.getQuery(req), async function (err, result) {
                if (err) {
                    console.log(err)
                    throw new Error(err)
                } else {
                    if (result.rows.length) {
                        res.status(200).send({auth: true, message: "OTP verified.", data: result.rows[0]})
                    } else {
                        res.status(400).send({auth: false, error: "Wrong OTP"}) 
                    }
                }
            })
            }
        })
    } catch (err) {
        console.log(err)
        res.status(400).send({error: err.message})
    } finally {
        client.release()
    }
}
