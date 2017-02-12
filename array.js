(1, 1, -1);

function cir(arr) {
    var indices = [];
    var i = 0;

    while (true) {
        i = (i + arr[i] + arr.length) % arr.length;
        if (indices.indexOf(i) === -1) {
            indices.push(i);
        } else {
            break;
        }
    };


    return indices.length === arr.length && i === 0; 
}