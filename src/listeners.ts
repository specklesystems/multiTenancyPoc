import { Knex } from "knex";
import { getDB } from "./db";
import { Regions } from "./regions";
import { upsertResourceView } from "./repositories";


export async function initListeners() {
  for (const region of Regions) {
    const db = getDB(region)
    const connection = await (db.client as Knex.Client).acquireRawConnection()
    connection.query('LISTEN notifications')

    connection.on('notification', async (data: { payload: string }) => {
      console.log(JSON.parse(data.payload))
      await upsertResourceView(region, JSON.parse(data.payload))
    });

    // connection.on('end', (err) => {
    //   reconnectClient(knex);
    // })
    connection.on('error', (err) => {
      console.log(err);
    })
  }
}


