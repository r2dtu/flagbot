/**
 * @file edit-rank.js
 * @brief Edit most recent rank command configs
 */
const EDIT_FLAG_RECORD_TIME_LIMIT_MINUTES = 5;

const flagUtils = require( '../utils/flag-utils.js' );

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

            let readCb = ( rows ) => {
                let rowUser = (rows.length > 0) ? rows[0] : null;
                if (rowUser) {
                    if (false) { // TODO
                    // Check that the timestamp is within the 15min
//                    if (newData.getLastUpdatedTs() - rowUser.lastupdatedts >
//                            (EDIT_FLAG_RECORD_TIME_LIMIT_MINUTES * 60 * 1000))
                    {
                        msg.channel.send( `You cannot edit your rankings anytime after ` +
                        `${EDIT_FLAG_RECORD_TIME_LIMIT_MINUTES} minutes since your last ` +
                        `ranking placement input.` );
                        return;
                    }
                
                    // Retrieve the most recent score, and edit points
                    let sp = rowUser.weeklyplacements.split('/');
                    let latestRank = parseInt( sp.pop() );

                    newData.addWeeklyPoints( parseInt( rowUser.weeklypoints ) );
                    newData.addWeeklyPoints( -flagUtils.calculateFlagPoints( latestRank ) );
                    newData.addWeeklyPoints( newData.getPlacementPoints() );
                
                    // Add new placement to record of placements
                    newData.addWeeklyPlacement( sp.join( '/' ) );
                    newData.addWeeklyPlacement( newData.getPlacement() );
                
                    // Write out data back to CSV (async)
                    flagUtils.writeFlagData( msg.guild.id, newData );

                    // Send back user feedback
                    msg.channel.send( `Successfully updated your latest flag placement to ` +
                                      `${newData.getPlacement()}.` );

                } else {
                    msg.channel.send( 'There are no rankings for you to edit.' );
                }

            };

            // Find user and record score
            flagUtils.findUser( newData, readCb );
        } else {
            msg.channel.send( 'Not a valid placement. Please try again.' );
        }
    },
};

