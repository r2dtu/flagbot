/**
 * @file leaderboard.js
 * @brief Leaderboard command configs
 */
const Discord = require( 'discord.js' );
const flagUtils = require( '../utils/flag-utils.js' );
const utils = require( '../utils/utils.js' );

const TOP_X_RANKINGS_DISPLAY = 15;
const TOP_X_RANKINGS_DISPLAY_ALLTIME = 15;

const compileWeeklyRankings = ( flagRecords, guildIcon ) => {
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
        leaderboardStr += `${ranks[i]}. ${row.nickname} - ${row.weeklypoints} points\n`;
        ++i;
    }

    // Get current week
    let currWeek = flagUtils.getWeekStartDateStr();
    if (0 === leaderboardStr.length) {
        leaderboardStr = "No data to display. Use -prevw for previous week's rankings.";
    } else {
        currWeek = flagRecords[0].week;
    }

    const embed = new Discord.MessageEmbed()
          .setTitle( `__**Week of ${currWeek} Delight Flaggers Leaderboard**__` )
          .setColor( 16329785 )
          .setDescription( `**Total** (recorded) Guild Weekly Flag Points: ${totalPoints}\n` +
                           `Total # of flaggers (recorded) this week: ${ranks.length}` )
          .setTimestamp()
          .setThumbnail( guildIcon )
          .addFields(
              {
                  name: "Rank. Name(IGN) - Weekly Points",
                  value: leaderboardStr,
              });

    resp = { embed: embed };

    return resp;
}

const compileMonthlyRankings = ( flagRecords, guildIcon ) => {

    // Combine all data into objects for each flagger
    const combinedData = flagRecords.reduce( (r, e) => {
	if (!r[e.userid]) r[e.userid] = e;
        else r[e.userid].weeklypoints = r[e.userid].weeklypoints + e.weeklypoints;
        return r;
    }, {} );

    // Convert JSON into array of flagger objects
    let data = Object.values( combinedData );

    // Get top N
    let topN = utils.getTopN( data, 'weeklypoints', TOP_X_RANKINGS_DISPLAY_ALLTIME );

    // Grab points and sort to determine rankings (handles ties as well)
    let places = topN.map( p => p.weeklypoints );
    let sorted = places.slice().sort( function (a, b) {
                     return b - a;
                 } );
    let ranks = places.map( function( v ) {
                    return sorted.indexOf( v ) + 1;
                } );
    ranks.sort( function (a, b) { return a - b; } );

    let totalPoints = places.reduce((a, b) => a + b, 0);
    let leaderboardStr = "";

    let i = 0;
    for (const row of topN) {
        leaderboardStr += `${ranks[i]}. ${row.nickname} - ${row.weeklypoints} points\n`;
        ++i;
    }

    // Get current month
    let tmp = flagUtils.getWeekStartDateStr().split( " " );
    let currMonth = tmp[2] + ' ' + tmp[3];
    if (0 === leaderboardStr.length) {
        leaderboardStr = "No data to display. Use -prevm for previous month's rankings.";
    } else {
        tmp = topN[0].week.split( " " );
        currMonth = tmp[2] + ' ' + tmp[3];
    }

    const embed = new Discord.MessageEmbed()
          .setTitle( `__**${currMonth} Leaderboard for Top ${TOP_X_RANKINGS_DISPLAY_ALLTIME} Flaggers!**__` )
          .setColor( 16329785 )
          .setDescription( `**Total** (recorded) Guild Flag Points: ${totalPoints}\n` +
                           `Total # of flaggers (recorded) this month: ${data.length}` )
          .setTimestamp()
          .setThumbnail( guildIcon )
          .setFooter( "Note: The current month is given by the month of the start date of the current week.", "" )
          .addFields(
              {
                  name: `Rank. Name(IGN) - Points Earned in ${currMonth}`,
                  value: leaderboardStr,
              });

    let resp = { embed: embed };
    return resp;
};

const compileAllTimeRankings = ( flagRecords, guildIcon ) => {
    let data = [];
    data.push( "Not yet implemented..." );
    return data;
};

module.exports = {
    name: 'leaderboard',
    description: `Returns the current top ${TOP_X_RANKINGS_DISPLAY} flag leaderboard.` + 
                 ` Note that monthly/all-time leaderboards will take much longer` +
                 ` to calculate.`,
    aliases: ['rankings', 'l', 'leader'],
    usage: ' [-w | --weekly | -prevw | -m | --monthly | -prevm | -a | --all-time]',
    guildOnly: true,
    execute( msg, args ) {

        let recordType = flagUtils.getRecordType( args[0] );
        let readCb = ( flagRecords, msg, userData ) => {

            let data = [];
            switch (recordType) {
                case flagUtils.RecordTypeEnum.WEEKLY:
                    data = compileWeeklyRankings( flagRecords, msg.guild.iconURL() );
                    break;
                case flagUtils.RecordTypeEnum.MONTHLY:
                    data = compileMonthlyRankings( flagRecords, msg.guild.iconURL() );
                    break;
                case flagUtils.RecordTypeEnum.ALLTIME:
                    data = compileAllTimeRankings( flagRecords, msg.guild.iconURL() );
                    break;
                default:
                    // Should not have gotten here
                    break;
            }

            msg.channel.send( data );
        };

        let prev = (args[0] === "-prevw" || args[0] === "-prevm");

        if (recordType === flagUtils.RecordTypeEnum.INVALID) {
            msg.channel.send( 'Valid ranking types are: weekly (-w), ' +
                              'monthly (-m), all-time (-a), previous week (-prevw), ' +
                              'or previous month (-prevm).' );
        } else if (!flagUtils.getFlagRecords( recordType, msg, 
                                              null, readCb, prev )) {
            msg.channel.send( 'There are currently no rankings to display.' );
        } else {
            // readCb will be called
        }

    },
};
