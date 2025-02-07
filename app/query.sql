CREATE TABLE messages (
    msg_id INT AUTO_INCREMENT PRIMARY KEY,
    userid INT NOT NULL,
    roomid INT not null,
    message TEXT NOT NULL,
    createdby varchar(50) default null,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userid) REFERENCES users(id),
    FOREIGN KEY (roomid) REFERENCES chat_room(roomid)
);

create table chat_room (
	roomid int AUTO_INCREMENT PRIMARY key,
	room_name text NOT null,
	createdby varchar(50) default null,
	createddt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

create table users (
    id INT auto_increment primary key,
    username VARCHAR(100) default null,
    email VARCHAR(100) default null,
    user_password VARCHAR(255) default null,
    createby VARCHAR(50) default null, 
    createdat TIMESTAMP default CURRENT_TIMESTAMP
);
