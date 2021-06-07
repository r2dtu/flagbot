/**
 * @file place.js
 * @brief Placement command configs
 */
const FLAG_RECORD_TIME_LIMIT_MINUTES = 15;

const flagUtils = require( '../utils/flag-utils.js' );

/* Emojis to send for different placements */
const NC_EMOJI = ':NutChamp:848825153793032202';
const AHHA_EMOJI = ':ahha:835357032906227733';
const PT_EMOJI = ':pepethicc:849162363890171975';
const PD_EMOJI = 'a:pandadance:849512040182841384';
const RP_EMOJI = ':RooPoggers:670472103958675456';
const RUN_EMOJI = 'a:run:820429286405963786';
const CHEER_EMOJI = ':cheer:548141806865612823';

let sendReply = (msg, place, pts) => {
    let placeSuffix = "th";
    let emojiStr = `<${CHEER_EMOJI}>`;
    if (place === 0) {
        msg.channel.send( `You did not place and earned ${pts} points. Better luck next time! ${emojiStr}` );
    } else if (place >= 1 && place <= 5) {
        switch (place) {
            case 1:
                placeSuffix = "st";
                emojiStr = `<${NC_EMOJI}>`;
                break;
            case 2:
                placeSuffix = "nd";
                emojiStr = `<${AHHA_EMOJI}>`;
                break;
            case 3:
                placeSuffix = "rd";
                emojiStr = `<${PT_EMOJI}>`;
                break;
            case 4:
                emojiStr = `<${PD_EMOJI}>`;
                break;
            case 5:
                emojiStr = `<${RP_EMOJI}>`;
                break;
        }
        msg.channel.send( `You placed ${place}${placeSuffix} (${pts} pts)! Let\'s gooo!! ${emojiStr}` );
    } else { // Rank 6-20
        emojiStr = `<${RUN_EMOJI}>`;
        msg.channel.send( `You placed ${place}${placeSuffix} (${pts} pts)! Great job!! ${emojiStr}` );
    }
};

module.exports = {
    name: 'place',
    description: 'Records your most recent flag placement (must have finished ' +
                 'the race). Use "afk" if you afk\'d, "out" or "dnf" if you ' +
                 'didn\'t finish the race.',
    aliases: ['p'],
    usage: '[1-20 / afk / out / dnf]',
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

                // Parse current record file
                let place = flagUtils.afkFunc( args[0] ) ? 0 : parseInt( args[0] );
                let newData = new flagUtils.FlagUser( msg.author.id, nickname, now, place, 0, "" );

                let readCb = ( rows ) => {
                    let rowUser = (rows.length > 0) ? rows[0] : null;
                    let error = false;
                    if (rowUser) {
                        // Add existing data
                        newData.addWeeklyPoints( parseInt( rowUser.weeklypoints ) );
                        newData.addWeeklyPlacement( rowUser.weeklyplacements );

                        // Ensure that they didn't already put in a score for this current flag race
                        if (newData.getLastUpdatedTs() - rowUser.lastupdatedts < 
                                (FLAG_RECORD_TIME_LIMIT_MINUTES * 60 * 1000)) {
                            error = true;
                            msg.channel.send( 'You already entered a placement for the most recent flag, you troll.' );
                        } else {
                            // Update score - items stored in CSV are always valid integers
                            newData.addWeeklyPoints( newData.getPlacementPoints() );
                            newData.addWeeklyPlacement( newData.getPlacement() );

                            // Write out data back to database (async)
                            flagUtils.writeFlagData( msg.guild.id, newData );
                        }
                    } else {
                        newData.addWeeklyPoints( newData.getPlacementPoints() );
                        newData.addWeeklyPlacement( newData.getPlacement() );

                        // Write out data back to database (async)
                        flagUtils.writeFlagData( msg.guild.id, newData );
                    }

                    // Send back user feedback
                    if (!error) {
                        let place = newData.getPlacement();
                        let pts = newData.getPlacementPoints();
                        sendReply( msg, place, pts );
                    }
                };

                // Find user and record score
                flagUtils.findUser( newData, readCb );
            } else {
                msg.channel.send( 'Not a valid placement. Please try again.' );
            }
        } else {
            msg.channel.send( 'This command is only usable within the first 15 minutes after a flag race.' )
        }

    },
};

