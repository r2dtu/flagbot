/**
 * @file rank.js
 * @brief Rank command configs
 *
 * Weekly rankings: displays current rank, weekly points, weekly placements
 * Monthly rankings: displays rank across 3-4 weeks of points (based on what 
 *                   month the week begins on)
 * All-Time rankings: displays all-time flagger stats
 */
const Discord = require( 'discord.js' );
const flagUtils = require( '../utils/flag-utils.js' );
const qchart = require( 'quickchart-js' );
const utils = require( '../utils/utils.js' );

/**
 * Generates a donut graph of a user's flag placements.
 */
const createChartUrl = ( placements ) => {

    let rankLabels = [...new Set( placements )].map( Number )
    rankLabels.sort( function (a, b) { return a - b; } );
    rankLabels = utils.arrayRotate( rankLabels );

    // Replace '0' label with 'afk/out' if exists
    if (rankLabels[0] === '0') {
        rankLabels.pop();
        rankLabels.push( 'afk/out' );
    }

    let counts = {};
    placements = placements.map( Number );
    placements.sort(
            function (a, b) {
                return a - b;
            }
    );
    placements.forEach(
            function (x) {
                counts[x] = (counts[x] || 0) + 1;
            }
        );

    let data = [];
    for (const key in counts) {
        data.push( counts[key] );
    }
    data = utils.arrayRotate( data );

    const chart = new qchart();
    chart.setConfig(
        {
          type: 'doughnut',
          data: {
            labels: rankLabels,
            datasets: [{
              data: data,
            }]
          },
          options: {
            plugins: {
              datalabels: {
                display: true,
                backgroundColor: '#ccc',
                borderRadius: 3,
                font: {
                  color: 'red',
                  weight: 'bold',
                }
              },
              doughnutlabel: {
                labels: [{
                  text: data.reduce( (a, b) => a + b, 0 ),
                  font: {
                    size: 20,
                    weight: 'bold'
                  }
                }, {
                  text: 'Total Races'
                }]
              },
            }
          }
        }
    );

    return chart.getUrl();
};

/**
 * @brief Creates a bot response for weekly ranking data.
 *
 * @param[in] flagRecords flag data from database
 * @param[in] userid user ID to get data about
 *
 * @return bot response
 */
const compileWeeklyRankings = ( flagRecords, userid, pfpUrl ) => {

    let resp = [];
    // Grab points and sort to determine rankings (handles ties as well)
    let places = flagRecords.map( p => p.weeklypoints );
    let sorted = places.slice().sort( function (a, b) {
                     return b - a;
                 } );
    let ranks = places.map( function( v ) {
                    return sorted.indexOf( v ) + 1;
                } );

    // Find the user's ranking info
    let found = false;
    let idx = 0;
    for (const row of flagRecords) {
        if (row.userid === userid) {
            let week = flagUtils.getWeekStartDateStr();
            let placeStr = row.weeklyplacements.replace(/\//g, ', ');
            resp.push( `**Weekly Placements:** ${placeStr}` );
            found = true;

            const embed = new Discord.MessageEmbed()
                  .setTitle( `__Week of **${week}** Stats for **${row.nickname}**__` )
                  .setColor( 0x00AE86 )
                  .setThumbnail( pfpUrl )
                  .setTimestamp()
                  .addFields(
                      {
                          name: "Weekly Guild Rank",
                          value: `${ranks[idx]}`,
                          inline: true
                      })
                  .addFields(
                      {
                          name: "Weekly Points",
                          value: `${row.weeklypoints}`,
                          inline: true
                      })
                  .addFields(
                      {
                          name: "Weekly Placements",
                          value: `${placeStr}`
                      });

            resp = { embed: embed };
            break;

        } else {
            // Continue searching
            idx += 1;
        }
    }

    if (!found) {
        resp.push( 'No ranking data found for you.' );
    } else {
        // Already formatted response
    }

    return resp;
};

/**
 * @brief Creates a bot response for monthly ranking data.
 *
 * @param[in] flagRecords flag data from database
 * @param[in] userid user ID to get data about
 *
 * @return bot response
 */
const compileMonthlyRankings = ( flagRecords, userid, pfpUrl ) => {

    let nickname = "";
    let data = [];
    let resp = [];

    // Combine all data into single entity for each flagger
    let found = false;
    for (const row of flagRecords) {
        if (row.userid === userid) {
            found = true;
            data.push( { 
//                         'rank': row.endofweekrank,
                         'pts': row.weeklypoints,
                         'numRaces': row.weeklyplacements.split( "/" ).length,
                         'placements': row.weeklyplacements
                       } );
            nickname = row.nickname;
        }
    }

    if (!found) {
        resp.push( 'No ranking data found for you.' );
    } else {

        // Get current month
        let tmp = flagUtils.getWeekStartDateStr().split( " " );
        let currMonth = tmp[2] + ' ' + tmp[3];

        // Calculate stats
        let totalPts = data.reduce( (a, b) => a + (b['pts'] || 0), 0 );
        let totalRaces = data.reduce( (a, b) => a + (b['numRaces'] || 0), 0 );
        let placements = data.reduce( (a, b) => a + '/' + (b['placements'] || 0), 0 ).split( '/' );
        placements.shift();

        // Can do actual median (handle even length'd array), but lazy
        let medianRank = placements[ Math.floor( placements.length / 2 ) ];
        let avgPpr = (totalPts / totalRaces).toFixed( 2 );

        // Create the chart
        let chartUrl = createChartUrl( placements );

        // color =  14076078 or 0xD6C8AE
        // can also .setDescription(), .setAuthor(), .setFooter(), .setURL()
        const embed = new Discord.MessageEmbed()
                  .setTitle( `__**${currMonth} Ranking Stats for ${nickname}**__` )
                  .setColor( 0x00AE86 )
                  .setThumbnail( pfpUrl )
                  .setImage( chartUrl )
                  .setTimestamp()
                  .addFields(
                      {
                          name: "Total points for this month",
                          value: `${totalPts}`
                      })
                  .addFields(
                      {
                          name: "Number of recorded races",
                          value: `${totalRaces}`
                      })
                  .addFields(
                      {
                          name: "Average points per race",
                          value: `${avgPpr}`,
                          inline: true
                      })
                  .addFields(
                      {
                          name: "Median flag placement",
                          value: `${medianRank}`,
                          inline: true
                      })
                  .addFields(
                      {
                          name: '\u200b',
                          value: '\u200b',
                          inline: true
                      })
                  .addFields(
                      {
                          name: "Best week of flag",
                          value: `TBD`,
                          inline: true
                      })
                  .addFields(
                      {
                          name: "Points earned during best week",
                          value: `TBD`,
                          inline: true
                      });

        resp = { embed: embed };
    }

    return resp;
};

const compileAllTimeRankings = ( flagRecords, userid, pfpUrl ) => {

    let nickname = "";
    let data = [];
    let resp = [];

//    // Combine all data into single entity for each flagger
//    let found = false;
//    for (const row of flagRecords) {
//        if (row.userid === userid) {
//            found = true;
//            data.push( { 
//                         'pts': row.weeklypoints,
//                         'numRaces': row.weeklyplacements.split( "/" ).length
//                       } );
//            nickname = row.nickname;
//        }
//    }
//
//    if (!found) {
//        resp.push( 'No ranking data found for you.' );
//    } else {
//
//        // Calculate stats
//        let totalPts = data.reduce( (a, b) => a + (b['pts'] || 0), 0 );
//        let totalRaces = data.reduce( (a, b) => a + (b['numRaces'] || 0), 0 );
//        let placements = data.reduce( (a, b) => a + '/' + (b['placements'] || 0), 0 ).split( '/' );
//
//        // Can do actual median (handle even length'd array), but lazy
//        let medianRank = placements[ Math.floor( placements.length / 2 ) ];
//        let avgPpr = (totalPts / totalRaces).toFixed( 2 );
//
//        // Create the chart
//        let chartUrl = createChartUrl( placements );
//
//        // color =  14076078 or 0xD6C8AE
//        // can also .setAuthor(), .setFooter(), .setURL()
//        const embed = new Discord.MessageEmbed()
//                  .setTitle( `__**All-time Ranking Stats for ${nickname}**__` )
//                  .setColor( 0x00AE86 )
//                  .setThumbnail( pfpUrl )
//                  .setImage( chartUrl )
//                  .setTimestamp()
//                  .addFields(
//                      {
//                          name: "Total points recorded",
//                          value: `${totalPts}`
//                      })
//                  .addFields(
//                      {
//                          name: "Number of recorded races",
//                          value: `${totalRaces}`
//                      })
//                  .addFields(
//                      {
//                          name: "Average points per race",
//                          value: `${avgPpr}`,
//                          inline: true
//                      })
//                  .addFields(
//                      {
//                          name: "Median rank placement",
//                          value: `${medianRank}`,
//                          inline: true
//                      })
//                  .addFields(
//                      {
//                          name: "Best week of flag",
//                          value: `${avgPpr}`,
//                          inline: true
//                      })
//                  .addFields(
//                      {
//                          name: "Most weekly points earned in flag",
//                          value: `${avgPpr}`,
//                          inline: true
//                      });
//
//        resp = { embed: embed };
//    }
    resp.push( "Not yet implemented" );
    return resp;
};

module.exports = {
    name: 'rank',
    description: 'Returns your current flag rank and points.',
    aliases: ['r'],
    usage: ' [-w | --weekly | -m | --monthly | -a | --all-time]',
    guildOnly: true,
    execute( msg, args ) {

        let recordType = flagUtils.getRecordType( args[0] );
        let readCb = ( flagRecords, msg, newData ) => {

            let data = [];
            switch (recordType) {
                case flagUtils.RecordTypeEnum.WEEKLY:
                    data = compileWeeklyRankings( flagRecords, msg.author.id,
                                                  msg.author.avatarURL() );
                    break;
                case flagUtils.RecordTypeEnum.MONTHLY:
                    data = compileMonthlyRankings( flagRecords, msg.author.id,
                                                   msg.author.avatarURL() );
                    break;
                case flagUtils.RecordTypeEnum.ALLTIME:
                    data = compileAllTimeRankings( flagRecords, msg.author.id,
                                                   msg.author.avatarURL() );
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
