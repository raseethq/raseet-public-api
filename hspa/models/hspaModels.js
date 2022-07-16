exports.handleSearch = async function (pool, req) {
  const client = await pool.connect()
  try {
    
  } catch (err) {
    console.log(err)
  } finally {
    client.release()
  }
}