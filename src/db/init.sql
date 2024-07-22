create table tbl_player (
    room_id int,
	nickname varchar(100),
    buy_in int,
    winnings int
);

create table tbl_room (
    id int,
    host int,
    exchange int,
    status varchar(20)
);