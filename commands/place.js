/**
 * @file place.js
 * @brief Placement command configs
 */
const FLAG_RECORD_TIME_LIMIT_MINUTES = 15;

const fastcsv = require('fast-csv');
const fs = require( 'fs' );

const flagUtils = require( '../utils/flag-utils.js' );

module.exports = {
    name: 'place',
    description: 'Records your most recent flag placement (must have finished the race). Use "afk" if you afk\'d or didn\'t finish the race.',
    aliases: ['p'],
    usage: '[1-20 / afk]',
    guildOnly: true,
    execute( msg, args ) {
        // Only allow command to be run within 15 minutes of flag races
        const now = Date.now();
        const date = new Date( now );

        if (flagUtils.validFlagTime( date.getUTCHours() ) && 
                date.getMinutes() < FLAG_RECORD_TIME_LIMIT_MINUTES) {

            let isNum = (/^\d+$/.test( args[0] ) && parseInt( args[0] ) != 0 ) || (args[0] === 'afk');
            let place = (args[0] === 'afk') ? 0 : parseInt( args[0] );
            let pts = flagUtils.calculateFlagPoints( place );
            if (isNum && pts > 0) {

                // @better Use a database for this record stuff
                let flagRecords = [];
                let flagCsvFilename = "flagrecords_" + msg.guild.id + ".csv";

                // Retrieve updated nickname, esp. if his name is bunz
                let guild = msg.client.guilds.cache.get( msg.guild.id );
                let member = guild.member( msg.author );
                let nickname = member ? member.displayName : null;

                // Create record file if it doesn't exist
                if (!fs.existsSync( flagCsvFilename )) {
                    fs.writeFile( flagCsvFilename, '', function (err) {
                        if (err) throw err;

                        let flagRecordsOut = [];
                        flagRecordsOut.push( [now, msg.author.id, nickname, pts, place] );

                        // Write out record
                        const ws = fs.createWriteStream( flagCsvFilename );
                        fastcsv.write( flagRecordsOut, 
                                { headers: ['timestamp', 'userId', 'nickname', 'weeklyPoints', 'weeklyPlacements'] } )
                                .pipe( ws );
                    } );

                    // Send user feedback
                    if (place > 0) {
                       msg.channel.send( 'You placed ' + place + ' and earned ' + pts + ' points.' );
                    } else {
                       msg.channel.send( 'You did not place and earned ' + pts + ' points.' );
                    }

                } else {

                    // Parse current record file
                    fastcsv.parseFile( flagCsvFilename, { headers: true } )
                        .on( "data", data => {
                            flagRecords.push( data );
                        } )
                        .on( "end", () => {
                            // Search for user ID while appending new data to outdata
                            let found = false;
                            let flagRecordsOut = [];
                            let error = false;

                            for (const row of flagRecords) {
                                if (row.userId === msg.author.id) {
                                    // Ensure that they didn't already put in a score for this current flag race
                                    if (now - row.timestamp < (FLAG_RECORD_TIME_LIMIT_MINUTES * 60 * 1000)) {
                                        error = true;
                                        msg.channel.send( 'You already entered a placement for the most recent flag.' );
                                    } else {
                                        // Update score - items stored in CSV are always valid integers
                                        row.weeklyPoints = '' + (parseInt( row.weeklyPoints ) + pts);
                                        row.nickname = nickname;
    
                                        // Update timestamp data
                                        row.timestamp = now;
    
                                        // Add new placement to record of placements
                                        row.weeklyPlacements += ("/" + place);
    
                                        // Push records to out data
                                        flagRecordsOut.push( row );
                                        found = true;
                                    }
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
    
                            // Send back user feedback
                            if (!error) {
                                if (place > 0) {
                                    msg.channel.send( 'You placed ' + place + ' and earned ' + pts + ' points.' );
                                } else {
                                    msg.channel.send( 'You did not place and earned ' + pts + ' points.' );
                                }
                            }
                        } );
                }
            } else {
                msg.channel.send( 'Not a valid placement. Please try again.' );
            }
        } else {
            msg.channel.send( 'This command is only usable within the first 15 minutes after a flag race.' )
        }

    },
};

