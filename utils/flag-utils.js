/**
 * @file flag-utils.js
 * @brief Flag race utility functions
 */
const fastcsv = require('fast-csv');
const fs = require( 'fs' );

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
                || (rankStr === 'afk');
    let place = (rankStr === 'afk') ? 0 : parseInt( rankStr );
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

const findUser = ( flagRecords, userId ) => {
    for (const row of flagRecords) {
        if (row.userId === userId) {
            return row;
        }
    }
    return null;
};


/**
 * @brief Writes the flag records out to a file.
 *
 * @param[in] guildId Discord server ID
 * @param[in] userData New flag user data to write
 * @param[in] flagRecordsOut Existing flag records
 */
var headerNames = ['timestamp', 'userId', 'nickname', 'weeklyPoints', 'weeklyPlacements'];
const writeFlagData = ( guildId, userData, flagRecordsOut ) => {
    let filename = "flagrecords_" + guildId + ".csv";

    // Convert JSON to array
    let data = [userData.getLastUpdatedTs(), userData.getUserId(),
                userData.getNickname(), userData.getWeeklyPoints(),
                userData.getWeeklyPlacements()];
    flagRecordsOut.push( data );
    
    if (!fs.existsSync( filename )) {
        fs.writeFile( filename, '', function (err) {
            if (err) throw err;
    
            // Write out record
            const ws = fs.createWriteStream( filename );
            fastcsv.write( flagRecordsOut, 
                    { headers: headerNames } )
                    .pipe( ws );
        } );
    } else {
        // Write out record
        const ws = fs.createWriteStream( filename );
        fastcsv.write( flagRecordsOut, 
                { headers: headerNames } )
                .pipe( ws );
    }
};

/**
 * @brief Parses a flag race records file and sends parsed data to a callback.
 *
 * @param[in] msg Message data
 * @param[in] newData New flag user data to record
 * @param[in] callback Read callback
 */
const parseFlagRecordsFile = ( msg, newData, callback ) => {
    let flagRecords = [];
    let filename = "flagrecords_" + msg.guild.id + ".csv";

    try {
        fastcsv.parseFile( filename, { headers: true } )
            .on( "data", data => {
                flagRecords.push( data );
            } )
            .on( "end", () => {
                callback( flagRecords, msg, newData );
            } );
        return true;
    } catch (e) {
        console.log( 'File probably does not exist: ' + e );
        return false;
    }
};

module.exports = { FlagUser, validFlagTime, findUser, isValidRanking, calculateFlagPoints, writeFlagData, parseFlagRecordsFile };
