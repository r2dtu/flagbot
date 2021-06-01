/**
 * @brief Checks that current time is a flag race hour.
 */
var flagUTCTimes = [12, 19, 21, 22, 23];
function validFlagTime( flagHr ) {
    return flagUTCTimes.includes( flagHr );
}

/**
 * @brief Returns the amount of points earned from flag placement.
 */
function calculateFlagPoints( rank ) {
    let pts = 0;
    if (rank == 0) {
        pts = 10;
    } else if (rank == 1) {
        pts = 100;
    } else if (rank == 2) {
        pts = 50;
    } else if (rank == 3) {
        pts = 40;
    } else if (rank == 4) {
        pts = 35;
    } else if (rank == 5) {
        pts = 30;
    } else if (rank > 5 && rank < 21) {
        pts = 20;
    } else {
        console.log( "Invalid flag placement!" );
    }

    return pts;
}

module.exports = { validFlagTime, calculateFlagPoints };
