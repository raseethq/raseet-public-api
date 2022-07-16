exports.postUserSessionQuery=function(){
  const query='insert into user_session(token,user_id,expiry_status) values($1,$2,$3) RETURNING *;'
  return query;
}