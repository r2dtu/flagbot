# flagbot
Records flag rankings for Delight guildies :) and also sends reminders for flag races 5 minutes before each race.

## Setup
First, install node.js / npm. 
```
$ git clone https://github.com/r2dtu/flagbot.git
$ cd flagbot/
$ npm install
```

You will also need to install Postgres. Downloading and installing it from https://www.postgresql.org/ should give you everything you need.
```
CREATE SCHEMA IF NOT EXISTS flag_records;
CREATE TABLE IF NOT EXISTS flag_records.delight_flag (
  USERID NUMERIC NOT NULL,
  LASTUPDATETS NUMERIC NOT NULL,
  NICKNAME VARCHAR(33) NOT NULL,
  WEEKLYPOINTS INT NOT NULL,
  WEEKLYPLACEMENTS VARCHAR(128),
  PRIMARY KEY (USERID)
);

SELECT * FROM flag_records.delight_flag;
```

## Other environment variables
You will need to set PREFIX, TOKEN, flagChannelId, flagRoleId in your environment. Running
```
export PREFIX="!"
```
and similarly with the others will be enough. **TOKEN** is the app's token (found in the Discord Developers UI). **flagChannelId** is the channel you want the bot to send/receive messages in. **flagRoleId** is the ID of the role to ping for flag reminders.

## Running
You will need to edit **utils/flag-utils.js** to match your Postgres DB credentials. Use the keys "host", "port", "database", and get rid of SSL if it still complains. Run the following in the top directory:

```
node flagbot.js
```
