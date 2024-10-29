import { Payment } from "./payment.entity";
import { Player } from "./player.entity";
import { Room } from "./room.entity";
import { User } from "./user.entity";

const entities = [Room, Player, User, Payment];

export {Room, Player, User, Payment};
export default entities;