import { Client, connect } from 'ts-postgres';
import {postgresEnv} from '../config';

export abstract class AbstractDAO {
    protected static client: Client;

    constructor() {
        if(AbstractDAO.client == undefined) {
            this.log('Connecting to Postgres');
            this.createConnection();
        }
    }

    private async createConnection() {
        const client = await connect({
            "user": postgresEnv.user,
            "password": postgresEnv.password
        });

        AbstractDAO.client = client;
    }

    protected log(message: string): void {
        console.debug(new Date().toISOString() + ' [Poker tracker] ' + message);
    }
}