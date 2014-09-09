var response = undefined;
var done;

var test = setInterval(function () {
    if (response !== undefined) {
        done = true;
    }
});

require('redis').createClient().smembers( "test:test#test", function ( err, result ) {
    if ( result.length === 0 ) {
        result = null;
    }
    console.log("inside", result);
    response = result;
});

while ( done !== true ) {};

console.log("done");
console.log(response);
