/**
 * @file flag-utils.js
 * @brief Flag race utility functions
 */

/**
 * @brief Checks that current time is a flag race hour.
 *
 * @param[in] flagHr hour to check if there's a flag race
 */
var flagUTCTimes = [12, 19, 21, 22, 23];
const validFlagTime = ( flagHr ) => {
    return flagUTCTimes.includes( flagHr );
}

/**
 * @brief Returns the amount of points earned from flag placement.
 *
 * @param[in] rank Rank earned in flag race
 */
const calculateFlagPoints = ( rank ) => {
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
