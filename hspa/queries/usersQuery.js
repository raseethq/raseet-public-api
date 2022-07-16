exports.postUserSessionQuery=function(){
  const query='insert into uhiuser_session(token,user_id,expiry_status) values($1,$2,$3) RETURNING *;'
  return query;
}