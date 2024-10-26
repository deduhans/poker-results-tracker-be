import { createExpressServer } from 'routing-controllers';
import { RoomController } from './bot/roomController';
import { Client, connect } from 'ts-postgres';
import { postgresEnv } from './config';

const app = createExpressServer({
  controllers: [RoomController],
});

// class Posgres {
//   public static client: Client = ;

//   private async createConnection() {
//     const client = await connect({
//       "user": postgresEnv.user,
//       "password": postgresEnv.password
//     });
//   }
// }


app.listen(3000);

//export const postgress = new Posgres().client;

