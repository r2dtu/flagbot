/**
 * @file place.js
 * @brief Placement command configs
 */
const FLAG_RECORD_TIME_LIMIT_MINUTES = 15;

const flagUtils = require( '../utils/flag-utils.js' );

let readCb = ( flagRecords, msg, newData ) => {
    // Search for user ID while appending new data to outdata
    let rowUser = flagUtils.findUser( flagRecords, msg.author.id );
    let flagRecordsOut = [];
    let error = false;
    if (rowUser) {
        // Ensure that they didn't already put in a score for this current flag race
        if (newData.getLastUpdatedTs() - rowUser.timestamp < 
                    (FLAG_RECORD_TIME_LIMIT_MINUTES * 60 * 1000)) {
            error = true;
            msg.channel.send( 'You already entered a placement for the most recent flag, you troll.' );
        } else {
            // Update score - items stored in CSV are always valid integers
            newData.addWeeklyPoints( parseInt( rowUser.weeklyPoints )
                                        + newData.getPlacementPoints() );
            newData.addWeeklyPlacement( rowUser.weeklyPlacements );
            newData.addWeeklyPlacement( newData.getPlacement() );
        }
    } else {
        newData.addWeeklyPoints( newData.getPlacementPoints() );
        newData.addWeeklyPlacement( newData.getPlacement() );
    }

    // @better when using database, shouldn't need this loop block
    for (const row of flagRecords) {
        if (row.userId === msg.author.id) {
            // Continue pushing the rest of the data - don't break
        } else {
            flagRecordsOut.push( row );
            // Continue searching / pushing data
        }
    }

    // Write out data back to CSV (async)
    flagUtils.writeFlagData( msg.guild.id, newData, flagRecordsOut );

    // Send back user feedback
    if (!error) {
        let place = newData.getPlacement();
        let pts = newData.getPlacementPoints();
        if (place > 0) {
            msg.channel.send( `You placed ${place} and earned ${pts} points. Great job!!` );
        } else {
            msg.channel.send( `You did not place and earned ${pts} points. Better luck next time!` );
        }
    }
};

module.exports = {
    name: 'place',
    description: `Records your most recent flag placement (must have finished 
    the race). Use "afk" if you afk\'d or didn\'t finish the race.`,
    aliases: ['p'],
    usage: '[1-20 / afk]',
    guildOnly: true,
    execute( msg, args ) {
        // Only allow command to be run within 15 minutes of flag races
        const now = Date.now();
        const date = new Date( now );

        if (flagUtils.validFlagTime( date.getUTCHours() ) && 
                date.getMinutes() < FLAG_RECORD_TIME_LIMIT_MINUTES) {
            if (flagUtils.isValidRanking( args[0] )) {
                // Retrieve updated nickname, esp. if his name is bunz
                let guild = msg.client.guilds.cache.get( msg.guild.id );
                let member = guild.member( msg.author );
                let nickname = member ? member.displayName : null;

                // @better Use a database for this record stuff
                // Parse current record file
                let place = (args[0] === 'afk') ? 0 : parseInt( args[0] );
                let newData = new flagUtils.FlagUser( msg.author.id, nickname, now, place, 0, "" );
                if (!flagUtils.parseFlagRecordsFile( msg, newData, readCb )) {
                    flagUtils.writeFlagData( msg.guild.id, newData, [] );

                    // Send user feedback
                    if (place > 0) {
                       msg.channel.send( 'You placed ' + place + ' and earned ' + pts + ' points.' );
                    } else {
                       msg.channel.send( 'You did not place and earned ' + pts + ' points.' );
                    }
                } else {
                    // readCb() will be called
                }

            } else {
                msg.channel.send( 'Not a valid placement. Please try again.' );
            }
        } else {
            msg.channel.send( 'This command is only usable within the first 15 minutes after a flag race.' )
        }

    },
};

