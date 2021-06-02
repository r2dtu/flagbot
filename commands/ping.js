/**
 * @file ping.js
 * @brief Ping Pong
 */
module.exports = {
    name: 'ping',
    description: 'Ping!',
    execute( msg, args ) {
        msg.channel.send( 'Pong.' );
    },
};
