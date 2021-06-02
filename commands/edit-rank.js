/**
 * @file edit-rank.js
 * @brief Edit most recent rank command configs
 */
const EDIT_FLAG_RECORD_TIME_LIMIT_MINUTES = 10;

const fastcsv = require( 'fast-csv' );
const fs = require( 'fs' );

const flagUtils = require( '../utils/flag-utils.js' );

module.exports = {
    name: 'edit-rank',
    description: 'Replaces the most recent rank recorded with a new placement. Only usable within ' + EDIT_FLAG_RECORD_TIME_LIMIT_MINUTES + ' minutes after using the !place command',
    aliases: ['e', 'edit'],
    usage: '[1-20]',
    guildOnly: true,
    execute( msg, args ) {

        // Calculate new updated score
        let isNum = /^\d+$/.test( args[0] );
        let newPlace = parseInt( args[0] );
        let newPts = flagUtils.calculateFlagPoints( newPlace );

        if (isNum && newPts > 0) {
            try {
                // Parse current record file
                let flagRecords = [];
                let flagCsvFilename = "flagrecords_" + msg.guild.id + ".csv";

                fastcsv.parseFile( flagCsvFilename, { headers: true } )
                    .on( "data", data => {
                        flagRecords.push( data );
                    } )
                    .on( "end", () => {
                        let flagRecordsOut = [];

                        for (const row of flagRecords) {
                            if (row.userId === msg.author.id) {
                                // Check that the timestamp is within the 15min
                                var now = Date.now();
                                if (now - row.timestamp >
                                        (EDIT_FLAG_RECORD_TIME_LIMIT_MINUTES * 60 * 1000))
                                {
                                    msg.channel.send( 'You cannot edit your rankings anytime after ' + EDIT_FLAG_RECORD_TIME_LIMIT_MINUTES + ' minutes since your ranking placement input.' );
                                    return;
                                }

                                // Retrieve the most recent score, and edit points
                                let sp = row.weeklyPlacements.split('/');
                                let latestRank = parseInt( sp.pop() );
                                row.weeklyPoints = '' + (parseInt( row.weeklyPoints ) - flagUtils.calculateFlagPoints( latestRank ));
                                row.weeklyPoints = '' + (parseInt( row.weeklyPoints ) + newPts);

                                // Update timestamp data
                                row.timestamp = now;

                                // Add new placement to record of placements
                                sp.push( args[0] );
                                row.weeklyPlacements = sp.join("/");

                                // Push records to out data
                                flagRecordsOut.push( row );

                                // Continue pushing the rest of the data - don't break
                            } else {
                                flagRecordsOut.push( row );
                                // Continue searching / pushing data
                            }
                        }

                        // Write out data back to CSV
                        const ws = fs.createWriteStream( flagCsvFilename );
                        fastcsv.write( flagRecordsOut, 
                                { headers: ['timestamp', 'userId', 'nickname', 'weeklyPoints', 'weeklyPlacements'] } )
                                .pipe( ws );

                        msg.channel.send( 'Successfully updated your latest flag placement.' );
                    } );
            } catch (e) {
                console.log( 'File does not exist.' + e );
                msg.channel.send( 'There are currently no rankings to display.' );
            }
        } else {
            msg.channel.send( 'Not a valid placement. Please try again.' );
        }

    },
};

