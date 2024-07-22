import * as dotenv from 'dotenv';

dotenv.config();

interface TelegramEnv {
    token: string;
}

interface PostgresEnv {
    user: string;
    password: string;
    db: string;
    port: number;
}

export const telegramEnv: TelegramEnv = {
    token: process.env.TELEGRAM_TOKEN as string
}

export const postgresEnv: PostgresEnv = {
    user: process.env.POSTGRES_USER as string,
    password: process.env.POSTGRES_PASSWORD as string,
    db: process.env.POSTGRES_DB as string,
    port: Number(process.env.POSTGRES_PORT)
}
