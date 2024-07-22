import { AbstractDAO } from "./abstractDAO";

export class RoomDAO extends AbstractDAO {
    private room_table = 'tbl_room';

    public async createRoom(host: number){
        const query = `insert into ${this.room_table} (host, status) values (${host}, 'opened');`;
        return AbstractDAO.client.query(query);
    }

    public async getOpenedRoom(host: string){
        const query = `select * from ${this.room_table} where host = ${host} and status = opened`;
        return AbstractDAO.client.query(query);
    }

    public async setExchangeValue(roomId: number, exchangeValue: number){
        const query = `update ${this.room_table} set exchange = '${exchangeValue}' where room_id = ${roomId};`;
        return AbstractDAO.client.query(query);
    }
}