/**
 * @file place.js
 * @brief Placement command configs
 */
const FLAG_RECORD_TIME_LIMIT_MINUTES = 15;

const fastcsv = require('fast-csv');
const fs = require( 'fs' );

/**
 * @brief Checks that current time is a flag race hour.
 */
var flagUTCTimes = [12, 19, 21, 22, 23];
function validFlagTime( flagHr ) {
    return flagUTCTimes.includes( flagHr );
}

/**
 * @brief Returns the amount of points earned from flag placement.
 */
function calculateFlagPoints( rank ) {
    var pts = 0;
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
}

module.exports = {
    name: 'place',
    aliases: ['p'],
    description: 'Records your most recent flag placement.',
    guildOnly: true,
    execute( msg, args ) {

        // Only allow command to be run within 15 minutes of flag races
        const now = Date.now();
        const date = new Date( now );
        if (true) {
//        if (validFlagTime( date.getUTCHours() ) && date.getMinutes() < FLAG_RECORD_TIME_LIMIT_MINUTES) {
            var place = parseInt( args[0] );
            var pts = calculateFlagPoints( place );
            if (pts > 0) {

                // @better Use a database for this record stuff
                var flagRecords = [];
                var flagCsvFilename = "flagrecords_" + msg.guild.id + ".csv";

                // Retrieve updated nickname, esp. if his name is bunz
                let guild = msg.client.guilds.cache.get( msg.guild.id );
                let member = guild.member( msg.author );
                let nickname = member ? member.displayName : null;

                // Create record file if it doesn't exist
                if (!fs.existsSync( flagCsvFilename )) {
                    fs.writeFile( flagCsvFilename, '', function (err) {
                        if (err) throw err;

                        var flagRecordsOut = [];
                        flagRecordsOut.push( [now, msg.author.id, nickname, pts, place] );

                        // Write out record
                        const ws = fs.createWriteStream( flagCsvFilename );
                        fastcsv.write( flagRecordsOut, 
                                { headers: ['timestamp', 'userId', 'nickname', 'weeklyPoints', 'weeklyPlacements'] } )
                                .pipe( ws );
                    } );

                } else {

                    // Parse current record file
                    fastcsv.parseFile( flagCsvFilename, { headers: true } )
                        .on( "data", data => {
                            flagRecords.push( data );
                        } )
                        .on( "end", () => {
                            // Search for user ID while appending new data to outdata
                            var found = false;
                            var flagRecordsOut = [];

                            for (const row of flagRecords) {
                                if (row.userId === msg.author.id) {
                                    // Update score - items stored in CSV are always valid integers
                                    row.weeklyPoints = '' + (parseInt( row.weeklyPoints ) + pts);
                                    row.nickname = nickname;

                                    // Update timestamp data
                                    row.timestamp = now;

                                    // Add new placement to record of placements
                                    row.weeklyPlacements += ("/" + args[0]);

                                    // Push records to out data
                                    flagRecordsOut.push( row );
                                    found = true;

                                    // Continue pushing the rest of the data - don't break
                                } else {
                                    flagRecordsOut.push( row );
                                    // Continue searching / pushing data
                                }
                            }

                            // New entry
                            if (!found) {
                                flagRecordsOut.push( [now, msg.author.id, nickname, pts, place] );
                            } else {
                                // Already done
                            }
    
                            // Write out data back to CSV
                            const ws = fs.createWriteStream( flagCsvFilename );
                            fastcsv.write( flagRecordsOut, 
                                    { headers: ['timestamp', 'userId', 'nickname', 'weeklyPoints', 'weeklyPlacements'] } )
                                    .pipe( ws );
    
                        } );
                }

                // Send back user feedback
                if (place > 0) {
                    msg.channel.send( 'You placed ' + place + ' and earned ' + pts + ' points.' );
                } else {
                    msg.channel.send( 'You did not place and earned ' + pts + ' points.' );
                }
            } else {
                msg.channel.send( 'Not a valid placement. Please try again.' );
            }
        } else {
            msg.channel.send( 'This command is only usable within the first 15 minutes after a flag race.' )
        }

    },
};

