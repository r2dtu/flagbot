/**
 * @file edit-rank.js
 * @brief Edit most recent rank command configs
 */
const EDIT_FLAG_RECORD_TIME_LIMIT_MINUTES = 5;

const fastcsv = require( 'fast-csv' );
const fs = require( 'fs' );

const flagUtils = require( '../utils/flag-utils.js' );

let readCb = ( flagRecords, msg, newData ) => {
    let flagRecordsOut = [];
    let rowUser = flagUtils.findUser( flagRecords, msg.author.id );

    if (rowUser) {
        // Check that the timestamp is within the 15min
        if (newData.getLastUpdatedTs() - rowUser.timestamp >
                (EDIT_FLAG_RECORD_TIME_LIMIT_MINUTES * 60 * 1000))
        {
            msg.channel.send( `You cannot edit your rankings anytime after ` +
            `${EDIT_FLAG_RECORD_TIME_LIMIT_MINUTES} minutes since your last ` +
            `ranking placement input.` );
            return;
        }
    
        // Retrieve the most recent score, and edit points
        let sp = rowUser.weeklyPlacements.split('/');
        let latestRank = parseInt( sp.pop() );

        newData.addWeeklyPoints( parseInt( rowUser.weeklyPoints ) );
        newData.addWeeklyPoints( -flagUtils.calculateFlagPoints( latestRank ) );
        newData.addWeeklyPoints( newData.getPlacementPoints() );
    
        // Add new placement to record of placements
        newData.addWeeklyPlacement( sp.join( '/' ) );
        newData.addWeeklyPlacement( newData.getPlacement() );
    
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
        msg.channel.send( `Successfully updated your latest flag placement to ` +
                          `${newData.getPlacement()}.` );

    } else {
        msg.channel.send( 'There are no rankings for you to edit.' );
    }

};

module.exports = {
    name: 'edit-rank',
    description: `Replaces the most recent rank recorded with a new ` +
    `placement. Only usable within ${EDIT_FLAG_RECORD_TIME_LIMIT_MINUTES} ` +
    `minutes after using the !place command.`,
    aliases: ['e', 'edit'],
    usage: '[1-20]',
    guildOnly: true,
    execute( msg, args ) {
        const now = Date.now();
        if (flagUtils.isValidRanking( args[0] )) {
            // Retrieve updated nickname, esp. if his name is bunz
            let guild = msg.client.guilds.cache.get( msg.guild.id );
            let member = guild.member( msg.author );
            let nickname = member ? member.displayName : null;

            let place = (args[0] === 'afk') ? 0 : parseInt( args[0] );
            let newData = new flagUtils.FlagUser( msg.author.id, nickname,
                                                  now, place, 0, "" );

            // Parse current record file
            if (!flagUtils.parseFlagRecordsFile( msg, newData, readCb )) {
                msg.channel.send( 'There are currently no rankings to edit.' );
            } else {
                // readCb will be called
            }
        } else {
            msg.channel.send( 'Not a valid placement. Please try again.' );
        }
    },
};

