/**
 * @file leaderboard.js
 * @brief Leaderboard command configs
 */
const flagUtils = require( '../utils/flag-utils.js' );
const TOP_X_RANKINGS_DISPLAY = 15;

const compileWeeklyRankings = ( flagRecords ) => {
    // Grab points and sort to determine rankings (handles ties as well)
    let places = flagRecords.map( p => p.weeklypoints );
    let sorted = places.slice().sort( function (a, b) {
                     return b - a;
                 } );
    let ranks = places.map( function( v ) {
                    return sorted.indexOf( v ) + 1;
                } );
    ranks.sort( function (a, b) { return a - b; } );

    // Sort flag records
    flagRecords.sort( function (a, b) {
        let x = parseInt( a.weeklypoints );
        let y = parseInt( b.weeklypoints );
        return y - x;
    } );

    let totalPoints = places.reduce((a, b) => a + b, 0);
    let leaderboardStr = "";

    let i = 0;
    for (const row of flagRecords) {
        // Display top rankings only
        if (i >= TOP_X_RANKINGS_DISPLAY) {
            break;
        }

        // Handle ties
        leaderboardStr += `${ranks[i]}. ${row.nickname} - ${row.weeklypoints} points\n` );
        ++i;
    }

    const embed = new Discord.MessageEmbed()
          .setTitle( `__**Ranking Data for Top ${TOP_X_RANKINGS_DISPLAY} Delight Flaggers!**__` )
          .setColor( 16329785 )
          .setDescription( `**Total** (recorded) Guild Weekly Flag Points: ${totalPoints}\n` +
                           `Total # of flaggers (recorded) this week: ${ranks.length}` )
          .setTimestamp()
          .addFields(
              {
                  name: "Rank. Name(IGN) - Weekly Points",
                  value: leaderboardStr,
              });

    resp = { embed: embed };

    return resp;
}

const compileMonthlyRankings = ( flagRecords ) => {
    let data = [];
    data.push( "Implementation in progress..." );
    return data;
};

const compileAllTimeRankings = ( flagRecords ) => {
    let data = [];
    data.push( "Implementation in progress..." );
    return data;
};

module.exports = {
    name: 'leaderboard',
    description: `Returns the current top ${TOP_X_RANKINGS_DISPLAY} flag leaderboard.`,
    aliases: ['rankings', 'l', 'leader'],
    usage: ' [-w | -m | -a]',
    guildOnly: true,
    execute( msg, args ) {

        let recordType = flagUtils.getRecordType( args[0] );
        let readCb = ( flagRecords, msg, userData ) => {

            let data = [];
            switch (recordType) {
                case flagUtils.RecordTypeEnum.WEEKLY:
                    data = compileWeeklyRankings( flagRecords );
                    break;
                case flagUtils.RecordTypeEnum.MONTHLY:
                    data = compileMonthlyRankings( flagRecords );
                    break;
                case flagUtils.RecordTypeEnum.ALLTIME:
                    data = compileAllTimeRankings( flagRecords );
                    break;
                default:
                    // Should not have gotten here
                    break;
            }

            msg.channel.send( data );
        };

        if (recordType === flagUtils.RecordTypeEnum.INVALID) {
            msg.channel.send( 'Valid ranking types are: weekly (-w), ' +
                              ' monthly (-m), or all-time (-a)' );
        } else if (!flagUtils.getFlagRecords( recordType, msg, 
                                              null, readCb )) {
            msg.channel.send( 'There are currently no rankings to display.' );
        } else {
            // readCb will be called
        }

    },
};
