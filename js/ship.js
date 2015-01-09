var ships = new Array();

function Ship(domReference, type) {
    this.id = $(domReference).attr('id');
    this.shipType = type;
    this.rotated = false;
    this.x = null;
    this.y = null;
}

function createShipInstances() {
    ship1 = new Ship($('#1'), 2);
    ships.push(ship1);
    ship2 = new Ship($('#2'), 2);
    ships.push(ship2);
    ship3 = new Ship($('#3'), 2);
    ships.push(ship3);
    ship4 = new Ship($('#4'), 3);
    ships.push(ship4);
    ship5 = new Ship($('#5'), 3);
    ships.push(ship5);
    ship6 = new Ship($('#6'), 4);
    ships.push(ship6);
    ship7 = new Ship($('#7'), 5);
    ships.push(ship7);
}

function getShipInstance(id) {
    var parsedId = parseInt(id);
    switch (parsedId) {
        case 1:
            return ship1;
        case 2:
            return ship2;
        case 3:
            return ship3;
        case 4:
            return ship4;
        case 5:
            return ship5;
        case 6:
            return ship6;
        case 7:
            return ship7;
    }
}