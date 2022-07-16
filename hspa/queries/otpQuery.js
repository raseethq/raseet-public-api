exports.getQuery=function(req){
  const query='SELECT id,mobile_number,otp,created_at,updated_at,EXTRACT(epoch from expired_at),last_sent_at,otp_type from uhi_otp where otp='+req.query.otp+' and mobile_number='+req.query.mobile_number+' and otp_type='+req.query.otp_type+';'
  return query;
  
};

exports.postQuery=function(req){
  var otp= Math.random() * (1000000 - 100000) + 100000
  const query='INSERT INTO uhi_otp(otp,otp_type,mobile_number,expired_at,last_sent_at) VALUES('+otp+','+req.body.otp_type+','+req.body.mobile_number+',to_timestamp('+Date.now()/1000.0+') + (10 * interval \'1 minute\'),to_timestamp('+Date.now() / 1000.0+')) RETURNING *;';
  return query;
}

exports.updateQuery=function(req){
  var otp= Math.random() * (1000000 - 100000) + 100000
  const query='UPDATE uhi_otp SET otp='+otp+', expired_at=to_timestamp('+Date.now()/1000.0+') + (10 * interval \'1 minute\'), last_sent_at=to_timestamp('+Date.now() / 1000.0+') where mobile_number='+req.body.mobile_number+' and otp_type='+req.body.otp_type+' RETURNING *;';
  return query;
}
