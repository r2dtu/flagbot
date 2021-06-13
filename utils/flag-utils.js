/**
 * @file flag-utils.js
 * @brief Flag race utility functions
 */
const RecordTypeEnum = {
    "WEEKLY" : 1,
    "MONTHLY" : 2,
    "ALLTIME" : 3
};
Object.freeze( RecordTypeEnum );

// Connect to Postgres
const pg = require( 'pg' ).Client;
const pgClient = new pg({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});
pgClient.connect();

/**
 * @brief String comparison functions.
 * @{
 */
let ciEquals = (a, b) => {
    return typeof a === 'string' && typeof b === 'string'
        ? a.localeCompare(b, undefined, { sensitivity: 'accent' }) === 0
        : a === b;
};

let afkFunc = (afkStr) => {
    return ciEquals( afkStr, 'afk' )
              || ciEquals( afkStr, 'out' )
              || ciEquals( afkStr, 'dnf' );
};
/** @} */

/**
 * @brief Class to hold flag user data.
 */
class FlagUser {
    constructor(id, nickname, lastUpdatedTs, placement, points, weeklyPlacements) {
        this.id = id;
        this.nickname = nickname;
        this.lastUpdatedTs = lastUpdatedTs;
        this.placement = placement;
        this.points = points;
        this.weeklyPlacements = weeklyPlacements;
    }

    getUserId() { return this.id; }
    getNickname() { return this.nickname; }
    getLastUpdatedTs() { return this.lastUpdatedTs; }
    getPlacement() { return this.placement; }
    getPlacementPoints() { return calculateFlagPoints( this.placement ); }
    getWeeklyPoints() { return this.points; }
    getWeeklyPlacements() { return this.weeklyPlacements; }

    addWeeklyPoints( pts ) { this.points += pts; }
    addWeeklyPlacement( placement ) {
        if (this.weeklyPlacements === "") {
            this.weeklyPlacements = placement;
        } else {
            this.weeklyPlacements += ("/" + placement);
        }
    }
}

/**
 * @brief Checks that current time is a flag race hour.
 *
 * @param[in] flagHr hour to check if there's a flag race
 */
var flagUTCTimes = [12, 19, 21, 22, 23];
const validFlagTime = ( flagHr ) => {
    return flagUTCTimes.includes( flagHr );
};

/**
 * @brief Determines whether the user inputted rank is valid
 *
 * @param[in] rankStr user inputted rank string
 */
const isValidRanking = ( rankStr ) => {
    let isNum = (/^\d+$/.test( rankStr ) && parseInt( rankStr ) != 0)
                || afkFunc( rankStr );
    let place = afkFunc( rankStr ) ? 0 : parseInt( rankStr );
    let pts = calculateFlagPoints( place );

    return (isNum && pts > 0);
}

/**
 * @brief Returns the amount of points earned from flag placement.
 *
 * @param[in] rank Rank earned in flag race
 */
const calculateFlagPoints = ( rank ) => {
    let pts = 0;
    if (rank == 0) {
        pts = 10;
    } else if (rank == 1) {
        pts = 100;
    } else if (rank == 2) {
        pts = 50;
    } else if (rank == 3) {
        pts = 40;
    } else if (rank == 4) {
        pts = 35;
    } else if (rank == 5) {
        pts = 30;
    } else if (rank > 5 && rank < 21) {
        pts = 20;
    } else {
        console.log( "Invalid flag placement!" );
    }

    return pts;
};

/**
 * @brief Returns the adjusted day value (due to weeks starting on Monday
 *        instead of Sunday).
 */
const getAdjustedDay = (day) => {
    if (day == 0) {
        return 7; // Sunday needs to be 7 instead of 0
    }
    return day;
};

/**
 * @brief Returns the weekly start date in UTC.
 */
const getWeekStartDateStr = () => {
    let now = Date.now();
    let curr = new Date( now );

    // Get the "first" day of the weekly reset, which is Monday UTC
    let first = curr.getDate() - getAdjustedDay( curr.getDay() ) + 1;

    console.log( curr.getDate() );
    console.log( curr.getDay() );
    let firstDay = new Date( curr.setDate( first ) ).toUTCString();

    console.log( firstDay );

    return firstDay.split( " " ).slice( 0, 4 ).join( " " );
};

/**
 * @brief Returns the user's flag records if exists, null otherwise
 *
 * @param[in] userId user discord ID
 */
const findUser = ( userData, cb ) => {
    let dateStr = getWeekStartDateStr();
    try {
        // userid is a unique field (primary key), will only be one
        pgClient.query( "SELECT * FROM flag_records.delight_flag " +
                        "WHERE userid = $1 AND week = $2",
                        [userData.getUserId(), dateStr])
            .then( (res) => {
                console.log( res );
                cb( res.rows );
            } );
    } catch (e) {
        console.log( "Failed to retrieve data from database. Error: " + e );
    }
    return null;
};


/**
 * @brief Writes the flag records out to a file.
 *
 * @param[in] guildId Discord server ID
 * @param[in] userData New flag user data to write
 */
var headerNames = ['timestamp', 'userId', 'nickname', 'weeklyPoints', 'weeklyPlacements'];
const writeFlagData = ( guildId, userData ) => {
    let writeCb = (rows) => {
        let dateStr = getWeekStartDateStr();
        if (rows.length > 0) {
            pgClient.query( 
                "UPDATE flag_records.delight_flag SET " +
                "lastUpdatedTs = $1, nickname = $2, weeklyPoints = $3, " +
                "weeklyPlacements = $4 " +
                "WHERE userId = $5 AND week = $6",
                [userData.getLastUpdatedTs(), userData.getNickname(), 
                 userData.getWeeklyPoints(), userData.getWeeklyPlacements(), 
                 userData.getUserId(), dateStr] )
                .then( () => { } );
        } else {
            pgClient.query( 
                "INSERT INTO flag_records.delight_flag " +
                "(userId, lastUpdatedTs, nickname, weeklyPoints, weeklyPlacements, week) VALUES " +
                "($1, $2, $3, $4, $5, $6)",
                [userData.getUserId(), userData.getLastUpdatedTs(),
                 userData.getNickname(), userData.getWeeklyPoints(),
                 userData.getWeeklyPlacements(), dateStr] )
                .then( () => { } );
        }
    };
    findUser( userData, writeCb );
};

/**
 * @brief Parses a flag race records file and sends parsed data to a callback.
 *
 * @param[in] msg Message data
 * @param[in] newData New flag user data to record
 * @param[in] callback Read callback
 */
const parseFlagRecordsFile = ( recordType, msg, newData, callback ) => {
    let flagRecords = [];

    try {
        if (recordType == RecordTypeEnum.WEEKLY) {
            let dateStr = getWeekStartDateStr();
            pgClient.query(
                "SELECT * FROM flag_records.delight_flag WHERE week = $1",
                [dateStr], (err, res) => {
                    if (err) throw err;
                    for (let row of res.rows) {
                        flagRecords.push( row );
                    }
                    callback( flagRecords, msg, newData );
                } );
        }
        else {
            console.log( "Non-weekly rankings not yet implemented." );
        }

        return true;
    } catch (e) {
        console.log( 'File probably does not exist: ' + e );
        return false;
    }
};

module.exports = { FlagUser, validFlagTime, findUser, isValidRanking,
                   calculateFlagPoints, writeFlagData, parseFlagRecordsFile,
                   afkFunc, RecordTypeEnum };
