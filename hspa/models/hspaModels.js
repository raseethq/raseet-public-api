exports.handleSearch = async function (pool, req, res) {
  const client = await pool.connect()
  try {
    var intentObj = req.body['message']['intent']
    var fulfillmentObj = intentObj['fulfillment']
    var ItemObj = intentObj['item']

    for await (let item of ItemObj) {
      const findItemData = await client.query(`SELECT * from lab_tests where name like '%${item['Descriptor']['name']}%`)

      // {
      //   fulfillment: {
      //     item: [
      //       {
      //         id: 1

      //       }
      //     ]
      //   }
      // }
      if (findItemData.rows.length) {
        res.status(200).send(findItemData.rows)
      } else {
        res.status(400).send([])
      }
    }
    // console.log(fulfillmentObj)
  } catch (err) {
    console.log(err)
  } finally {
    client.release()
  }
}