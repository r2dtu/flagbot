/**
 * @file utils.js
 * @brief Common utility functions
 */
const arrayRotate = ( arr, reverse ) => {
    if (reverse) arr.unshift( arr.pop() );
    else arr.push( arr.shift() );
    return arr;
};

module.exports = { arrayRotate };
