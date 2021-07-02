/**
 * @file utils.js
 * @brief Common utility functions
 */
const arrayRotate = ( arr, reverse ) => {
    if (reverse) arr.unshift( arr.pop() );
    else arr.push( arr.shift() );
    return arr;
};

const getTopN = ( arr, prop, n ) => {
    // Clone before sorting, to preserve the original array
    var clone = arr.slice( 0 );

    // Sort descending
    clone.sort( function( x, y ) {
        if (x[prop] == y[prop]) return 0;
        else if (parseInt( x[prop] ) < parseInt( y[prop]) ) return 1;
        else return -1;
    } );

    return clone.slice( 0, n || 1 );
};

module.exports = { arrayRotate, getTopN };
