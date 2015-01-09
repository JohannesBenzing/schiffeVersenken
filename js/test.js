//Startwerte für Statistik
statHits = 0;
statEnemyHits = 0;
statMissed = 0;
statEnemyMissed = 0;
statSurvivingShips = 7;
statEnemySurvivingShips = 7;
arrHitsOverTime = [];
arrEnemyHitsOverTime = [];
arrMissedOverTime = [];
arrEnemyMissedOverTime = [];
arrShipsOverTime = [];
arrEnemyShipsOverTime = [];

arrCheckRo = [];
for (var i = 0; i < 100; i++) {
    arrCheckRo[i] = [];
    for (var j = 0; j < 100; j++) {
        arrCheckRo[i][j] = [];
    }
}

//wird getriggered sobald website zur manipulation bereit ist
$(document).ready(function () {
    createField(10, 10, "assets/img/water.png", "assets/img/beach.png");
    createFieldOpponent(10, 10, "assets/img/water.png", "assets/img/beach.png");
    $('#mapOpponent').hide();
    $('#statistics').hide();
    $('#statistics2').hide();
    createShipInstances();
    $("#btnFertig").prop("disabled", true);
    $("#mapOpponent img").click(function () {
        if ($(this).hasClass('alreadyShot')) {
            return;
        }
        if (fieldClickDisabled) {
            alert("Warten bis Gegner fertig ist");
            $('#notLoadedSound')[0].play();
            return;
        }
        $('#shotSound')[0].play();
        sendShot($(this).attr('x'), $(this).attr('y'));
        fieldClickDisabled = true;
    });

    //wird gebraucht für "einrasten" in das Spielfeldgitter
    $(".image").draggable();
    $(".image").draggable("disable");

    //Feldern lassen sich mit Schiffsteilen belegen
    $(".field").droppable({
        accept: function (draggable) {
            return true;
        },
        hoverClass: "drop-hover",
        tolerance: "pointer"
        //drop: function( event, ui ){ //getriggert wenn auf class gedroppt-> problem: triggert nicht immer ka wieso
        //}
        //over: function( event, ui ) { //getriggert wenn maus über feld -> -> problem: triggert nicht immer ka wieso
        //	console.log(ui.position);
        //}
    });
    activateDraggable();
    setTimeout('arrangeShips()', 300);
});

function arrangeShips(lastRotatedShip) {
    $.each(ships, function (key, ship) {
        var s = "#" + ship.id;
        if (!ship.x) { //true wenn ship.x null ist (also das schiff noch nie gedroppt wurde)
            if (ship.x != 0) { // der integer 0 ist in javascript auch true
                // 123
                // $(s).offset({ top: (550 - 75*ship.id), left: (1150 - 75*ship.id) });
                $(s).offset({ top: (550 - 75 * ship.id), left: (1270 - 75 * ship.id) });
            }
        }
        else { //an gleich position zurücksetzen, für den Fall, dass Schiff durch die Rotation verschoben wurde
            $(s).offset({ top: (ship.y * 50), left: (ship.x * 50) });
        }
    });
    if (typeof lastRotatedShip != 'undefined') { //check ob parameter uebergeben wurde
        var s = "#" + lastRotatedShip.id;
        //ship aus rotation array entfernen
        for (i = 0; i < 100; i++) {
            for (j = 0; j < 100; j++) {
                if (arrCheckRo[i][j] == lastRotatedShip.id) {
                    arrCheckRo[i][j] = 0;
                }
            }
        }
        var ship = getShipInstance(lastRotatedShip.id);
        //if ship.x null
        if (ship.rotated) {
            var x = ship.x;
            var y = ship.y
        }
        else {
            var y = ship.x;
            var x = ship.y
        }
        //var xstart = x;
        var ystart = y;
        var bFree = true;
        y++; //obere linke ecke duerfen andere schiffe paltziert werden
        for (var i = 0; i < ship.shipType; i++) {
            if (arrCheckRo[x][y] > 0) {
                bFree = false;
                break;
            }
            y++;
        }
        y = ystart; //untere linke weglassen
        x++;
        for (var i = 0; i < (ship.shipType + 2); i++) {
            if (arrCheckRo[x][y] > 0) {
                bFree = false;
                break;
            }
            y++;
        }
        y = 1 + ystart; //obere rechte
        x++;
        for (var i = 0; i < ship.shipType; i++) {
            if (arrCheckRo[x][y] > 0) {
                bFree = false;
                break;
            }
            y++;
        }
        if (bFree) {
            console.log(bFree);
        }

        //lastRotatedShip.x = null;
        //lastRotatedShip.y = null;

        // $(s).offset({ top: (550 - 75*lastRotatedShip.id), left: (1150 - 75*lastRotatedShip.id) });

        //$(s).offset({ top: (550 - 75*lastRotatedShip.id), left: (1270 - 75*lastRotatedShip.id) });
        //$("#btnFertig").prop("disabled",true);
    }
    if (!ship7.x) {	//das große schiff wird sonst komischerweise nicht verschoben. wahrscheinlich gibt es wegen der größe fehler
        if (ship7.x != 0) {
            // $("#7").offset({ top: 60, left: 650 });
            $("#7").offset({ top: 60, left: 750 });
        }
    }
    $(".coreship").css("zIndex", 100); //verhindert, dass man das coreship nicht mehr anklicken kann, weil eine ecke von einer div eines anderen schiffes das schiff verdeckt
    $(".rotate_button").css("zIndex", 200);
}

function activateDraggable() {
    $(".ship").draggable({
        //grid: [ 50, 50 ], //Snaps the dragging helper to a grid, every x and y pixels. The array must be of the form [ x, y ].
        //funktioniert nicht richtig->fuehrt eher dazu, dass man schiffe zwischen 2 felder platziert werden können
        handle: ".coreship", //nur elemente mit dieser class können gedragt werden(also keine crashzones)
        opacity: 0.35,
        snap: true,
        snapMode: "inner",
        snapTolerance: 50,
        start: function (event, ui) {	//Triggered when dragging starts
            $(".ship").children().addClass("obstacle");	//coreship und crashzones blocken nun
            $(this).children().removeClass("obstacle");
        },
        stop: function (event, ui) {	//Triggered when dragging stops und man die maustaste loslässt  	,
            $(".coreship").css("zIndex", 100); //verhindert, dass man das coreship nicht mehr anklicken kann, weil eine ecke von einer div eines anderen schiffes das schiff verdeckt
            $(".rotate_button").css("zIndex", 200);
            // da die ganzen droppable events wie z.b. drop nicht zuverlässig funktionieren ->pixel umrechnen
            var ship = getShipInstance($(ui.helper.context).attr("id"));
            //$(this).offset() gibt object mit {top: Xpx left: Ypx}
            ship.x = ( Math.round(($(this).offset().left) / 50) )
            ship.y = ( Math.round(($(this).offset().top) / 50) )
            if (!( ( $(this).offset().top % 50 == 0 ) && ( $(this).offset().left % 50 == 0 ) )) { //falls schiff nicht ganz genau passend zum gitter gesetzt->passend setzen
                console.log("Schiff nicht passend zum gitter gesetzt");
                var s = "#" + ship.id;
                $(s).offset({ top: (ship.y * 50), left: (ship.x * 50) });
            }
            var b = false;
            $.each(ships, function (key, ship) {
                // if( (ship.x === null) || (ship.x > 9) ){
                if ((b) || (ship.x === null) || (ship.x > 12) || (ship.y > 12) || (ship.x < 3) || (ship.y < 3)) {
                    b = true;
                    return false; //in .each() wie break;
                }
            });
            $("#btnFertig").prop("disabled", b);

            if (ship.rotated) {
                var x = ship.x;
                var y = ship.y
            }
            else {
                var y = ship.x;
                var x = ship.y
            }
            //var xstart = x;
            var ystart = y;
            y++; //obere linke ecke duerfen andere schiffe paltziert werden
            for (var i = 0; i < ship.shipType; i++) {
                arrCheckRo[x][y] = ship.id;
                y++;
            }
            y = ystart; //untere linke weglassen
            x++;
            for (var i = 0; i < (ship.shipType + 2); i++) {
                arrCheckRo[x][y] = ship.id;
                y++;
            }
            y = 1 + ystart; //obere rechte
            x++;
            for (var i = 0; i < ship.shipType; i++) {
                arrCheckRo[x][y] = ship.id;
                y++;
            }
        },
        containment: [ 0, 0, 950, 850 ],  //lässt draggable objekte nicht aus diesem rechteck bestehnt aus den 4 eckpunkten raus
        obstacle: ".obstacle",	//diese klasse blockt draggable elemente
        collider: ".collider", //Elemente die geblockt werden können
        preventCollision: true
    });
}

function rotationButtonClicked(objClickedButton) {
    var $objDraggableDiv = $(objClickedButton).parent().parent();
    var ship = getShipInstance($objDraggableDiv.attr('id'));
    ship.rotated = !ship.rotated;
    $objDraggableDiv.remove();
    if ($objDraggableDiv.hasClass("ship_2")) {	//schreibe html für neues gedrehtes schiff
        jQuery('<div class="ship ship_2ro rotated" id="' + ship.id + '">   <div class="crashzone" style="left:  50px;top:  0px; width:  50px; height:  50px;"></div>   <div class="crashzone" style="left: 0px;top: 50px; width: 50px; height: 50px;"></div>   <div class="crashzone" style="left: 0px;top: 100px; width: 50px; height: 50px;"></div>   <div class="coreship collider" style="left: 50px;top: 50px; width: 50px; height: 100px;">   <img class="rotate_button" onClick="rotationButtonClicked(this);" src="assets/img/rotate.png"></div>   <div class="crashzone" style="left: 100px;top: 50px; width: 50px; height: 50px;"></div>   <div class="crashzone" style="left: 100px;top: 100px; width: 50px; height: 50px;"></div>   <div class="crashzone" style="left:	50px;top: 150px; width: 50px; height: 50px;"></div></div>').appendTo('body');
    }
    else if ($objDraggableDiv.hasClass("ship_2ro")) {
        jQuery('<div class="ship ship_2" id="' + ship.id + '">   <div class="crashzone" style="left: 50px;	top:  0px; 	width:  50px; height:  50px;"></div>   <div class="crashzone" style="left: 100px;	top:  0px; 	width:  50px; height:  50px;"></div>   <div class="crashzone" style="left:	 0px;	top: 50px;	width:	50px; height:  50px;"></div>   <div class="coreship collider" style="left: 50px;top: 50px; width: 100px; height: 50px;">   <img class="rotate_button" onClick="rotationButtonClicked(this);" src="assets/img/rotate.png"></div>   <div class="crashzone" style="left: 150px;top: 50px; width:	50px; height:	50px;"></div>   <div class="crashzone" style="left:	50px;top:  100px; width:  50px; height:  50px;"></div>   <div class="crashzone" style="left: 100px;top:  100px; width:  50px; height:  50px;"></div></div>').appendTo('body');
    }
    else if ($objDraggableDiv.hasClass("ship_3")) {
        jQuery('<div class="ship ship_3ro rotated" id="' + ship.id + '"><div class="crashzone" style="left:  50px;top:  0px; width:  50px; height:  50px;"></div>   <div class="crashzone" style="left: 0px;top: 50px; width: 50px; height: 50px;"></div>   <div class="crashzone" style="left: 0px;top: 100px; width: 50px; height: 50px;"></div>   <div class="crashzone" style="left: 0px;top: 150px; width: 50px; height: 50px;"></div>   <div class="coreship collider" style="left: 50px;top: 50px; width: 50px; height: 150px;">   <img class="rotate_button" onClick="rotationButtonClicked(this);" src="assets/img/rotate.png"></div>   <div class="crashzone" style="left: 100px;top: 50px; width: 50px; height: 50px;"></div>   <div class="crashzone" style="left: 100px;top: 100px; width: 50px; height: 50px;"></div>   <div class="crashzone" style="left: 100px;top: 150px; width: 50px; height: 50px;"></div>   <div class="crashzone" style="left:	50px;top: 200px; width: 50px; height: 50px;"></div></div>').appendTo('body');
    }
    else if ($objDraggableDiv.hasClass("ship_3ro")) {
        jQuery('<div class="ship ship_3" id="' + ship.id + '"><div class="crashzone" style="left: 50px;top:0px;width:50px;height:50px;"></div><div class="crashzone" style="left: 100px;top: 0px;	width:  50px; height:  50px;"></div>   <div class="crashzone" style="left: 150px;	top:  0px; 	width:  50px; height:  50px;"></div>   <div class="crashzone" style="left:	 0px;	top: 50px;	width:	50px; height:  50px;"></div>   <div class="coreship collider" style="left: 50px;top: 50px; width: 150px; height: 50px;">   <img class="rotate_button" onClick="rotationButtonClicked(this);" src="assets/img/rotate.png"></div>   <div class="crashzone" style="left: 200px;top: 50px; width:	50px; height:	50px;"></div>   <div class="crashzone" style="left:	50px;top:  100px; width:  50px; height:  50px;"></div>   <div class="crashzone" style="left: 100px;top:  100px; width:  50px; height:  50px;"></div>   <div class="crashzone" style="left:	150px;top: 100px; width:  50px; height:  50px;"></div></div>').appendTo('body');
    }
    else if ($objDraggableDiv.hasClass("ship_4")) {
        jQuery('<div class="ship ship_4ro rotated" id="' + ship.id + '">   <div class="crashzone" style="left:  50px;top:  0px; width:  50px; height:  50px;"></div>   <div class="crashzone" style="left: 0px;top: 50px; width: 50px; height: 50px;"></div>   <div class="crashzone" style="left: 0px;top: 100px; width: 50px; height: 50px;"></div>   <div class="crashzone" style="left: 0px;top: 150px; width: 50px; height: 50px;"></div>   <div class="crashzone" style="left: 0px;top: 200px; width: 50px; height: 50px;"></div>   <div class="coreship collider" style="left: 50px;top: 50px; width: 50px; height: 200px;">   <img class="rotate_button" onClick="rotationButtonClicked(this);" src="assets/img/rotate.png"></div>   <div class="crashzone" style="left: 100px;top: 50px; width: 50px; height: 50px;"></div>   <div class="crashzone" style="left: 100px;top: 100px; width: 50px; height: 50px;"></div>   <div class="crashzone" style="left: 100px;top: 150px; width: 50px; height: 50px;"></div>   <div class="crashzone" style="left: 100px;top: 200px; width: 50px; height: 50px;"></div>   <div class="crashzone" style="left:	50px;top: 250px; width: 50px; height: 50px;"></div></div>').appendTo('body');
    }
    else if ($objDraggableDiv.hasClass("ship_4ro")) {
        jQuery('<div class="ship ship_4" id="' + ship.id + '">   <div class="crashzone" style="left: 50px;	top:  0px; 	width:  50px; height:  50px;"></div>   <div class="crashzone" style="left: 100px;	top:  0px; 	width:  50px; height:  50px;"></div>   <div class="crashzone" style="left: 150px;	top:  0px; 	width:  50px; height:  50px;"></div>   <div class="crashzone" style="left: 200px;	top:  0px; 	width:  50px; height:  50px;"></div>   <div class="crashzone" style="left:	 0px;	top: 50px;	width:	50px; height:  50px;"></div>   <div class="coreship collider" style="left: 50px;top: 50px; width: 200px; height: 50px;">   <img class="rotate_button" onClick="rotationButtonClicked(this);" src="assets/img/rotate.png"></div>   <div class="crashzone" style="left: 250px;top: 50px; width:	50px; height:	50px;"></div>   <div class="crashzone" style="left:	50px;top:  100px; width:  50px; height:  50px;"></div>   <div class="crashzone" style="left: 100px;top:  100px; width:  50px; height:  50px;"></div>   <div class="crashzone" style="left:	150px;top: 100px; width:  50px; height:  50px;"></div>   <div class="crashzone" style="left:	200px;top: 100px; width:  50px; height:  50px;"></div></div>').appendTo('body');
    }
    else if ($objDraggableDiv.hasClass("ship_5")) {
        jQuery('<div class="ship ship_5ro rotated" id="' + ship.id + '">   <div class="crashzone" style="left:  50px;top:  0px; width:  50px; height:  50px;"></div>   <div class="crashzone" style="left: 0px;top: 50px; width: 50px; height: 50px;"></div>   <div class="crashzone" style="left: 0px;top: 100px; width: 50px; height: 50px;"></div>   <div class="crashzone" style="left: 0px;top: 150px; width: 50px; height: 50px;"></div>   <div class="crashzone" style="left: 0px;top: 200px; width: 50px; height: 50px;"></div>   <div class="crashzone" style="left: 0px;top: 250px; width: 50px; height: 50px;"></div>   <div class="coreship collider" style="left: 50px;top: 50px; width: 50px; height: 250px;">   <img class="rotate_button" onClick="rotationButtonClicked(this);" src="assets/img/rotate.png"></div>   <div class="crashzone" style="left: 100px;top: 50px; width: 50px; height: 50px;"></div>   <div class="crashzone" style="left: 100px;top: 100px; width: 50px; height: 50px;"></div>   <div class="crashzone" style="left: 100px;top: 150px; width: 50px; height: 50px;"></div>   <div class="crashzone" style="left: 100px;top: 200px; width: 50px; height: 50px;"></div>   <div class="crashzone" style="left: 100px;top: 250px; width: 50px; height: 50px;"></div>   <div class="crashzone" style="left:	50px;top: 300px; width: 50px; height: 50px;"></div></div>').appendTo('body');
    }
    else if ($objDraggableDiv.hasClass("ship_5ro")) {
        jQuery('<div class="ship ship_5" id="' + ship.id + '">   <div class="crashzone" style="left: 50px;	top:  0px; 	width:  50px; height:  50px;"></div>   <div class="crashzone" style="left: 100px;	top:  0px; 	width:  50px; height:  50px;"></div>   <div class="crashzone" style="left: 150px;	top:  0px; 	width:  50px; height:  50px;"></div>   <div class="crashzone" style="left: 200px;	top:  0px; 	width:  50px; height:  50px;"></div>   <div class="crashzone" style="left: 250px;	top:  0px; 	width:  50px; height:  50px;"></div>   <div class="crashzone" style="left:	 0px;	top: 50px;	width:	50px; height:  50px;"></div>   <div class="coreship collider" style="left: 50px;top: 50px; width: 250px; height: 50px;">   <img class="rotate_button" onClick="rotationButtonClicked(this);" src="assets/img/rotate.png"></div>   <div class="crashzone" style="left: 300px;top: 50px; width:	50px; height:	50px;"></div>   <div class="crashzone" style="left:	50px;top:  100px; width:  50px; height:  50px;"></div>   <div class="crashzone" style="left: 100px;top:  100px; width:  50px; height:  50px;"></div>   <div class="crashzone" style="left:	150px;top: 100px; width:  50px; height:  50px;"></div>   <div class="crashzone" style="left:	200px;top: 100px; width:  50px; height:  50px;"></div>   <div class="crashzone" style="left:	250px;top: 100px; width:  50px; height:  50px;"></div></div>').appendTo('body');
    }
    activateDraggable();
    arrangeShips(ship); //manchmal verschieben sich schiffe, wenn man ein neues per html-code einbaut->schiffe werden an gespeicherte pos zurückgesetzt
}


function createField(dimX, dimY, waterImage, beachImage) {
    fieldDimX = dimX;
    for (var y = 0; y < dimY; y++) {
        addRow({imagePath: waterImage});
    }
    addRowfilled({side: 'north', imagePath: beachImage });
    addRowfilled({side: 'south', imagePath: beachImage });
    addColumnfilled({side: 'west', imagePath: beachImage });
    addColumnfilled({side: 'east', imagePath: beachImage });
}

function createFieldOpponent(dimX, dimY, waterImage, beachImage) {
    fieldDimXOpponent = dimX;
    for (var y = 0; y < dimY; y++) {
        addRowOpponent({imagePath: waterImage});
    }
    addRowfilledOpponent({side: 'north', imagePath: beachImage });
    addRowfilledOpponent({side: 'south', imagePath: beachImage });
    addColumnfilledOpponent({side: 'west', imagePath: beachImage });
    addColumnfilledOpponent({side: 'east', imagePath: beachImage });
}

function addRow(params) {
    fieldDimY++;
    var row = '<tr>';
    for (var x = 0; x < fieldDimX; x++) {
        row = row + '<td><img x=' + x + ' y=' + (fieldDimY - 1) + ' coords="' + x + '.' + (fieldDimY - 1) + '" class="empty image field" src="' + params.imagePath + '"></td>';
    }
    row = row + '</tr>';
    $('#map').append(row);
}

//Fügt der Map eine Zeile voller Strand hinzu
function addRowfilled(params) {
    var row = '<tr>';
    for (var x = 0; x < fieldDimX; x++) {
        row = row + '<td><img class="filled image field obstacle" src="' + params.imagePath + '"></td>';
    }
    row = row + '</tr>';
    if (params !== undefined && params.side !== undefined && params.side == 'north') {
        $('#map').prepend(row);
    } else {
        $('#map').append(row);
    }
}

function addColumnfilled(params) {
    $('#map tr').each(function (index) {
        if (params !== undefined && params.side !== undefined && params.side == 'west') {
            $(this).prepend('<td><img class="filled image field obstacle" src="' + params.imagePath + '"></td>');
        } else {
            $(this).append('<td><img class="filled image field obstacle" src="' + params.imagePath + '"></td>');
        }
    });
}

function addRowOpponent(params) {
    fieldDimYOpponent++;
    var row = '<tr>';
    for (var x = 0; x < fieldDimXOpponent; x++) {
        row = row + '<td><img x=' + x + ' y=' + (fieldDimYOpponent - 1) + ' coords="' + x + '.' + (fieldDimYOpponent - 1) + '" class="empty image field" src="' + params.imagePath + '"></td>';
    }
    row = row + '</tr>';
    $('#mapOpponent').append(row);
}

function addRowfilledOpponent(params) {
    var row = '<tr>';
    for (var x = 0; x < fieldDimXOpponent; x++) {
        row = row + '<td><img class="filled image field" src="' + params.imagePath + '"></td>';
    }
    row = row + '</tr>';
    if (params !== undefined && params.side !== undefined && params.side == 'north') {
        $('#mapOpponent').prepend(row);
    } else {
        $('#mapOpponent').append(row);
    }
}

function addColumnfilledOpponent(params) {
    $('#mapOpponent tr').each(function (index) {
        if (params !== undefined && params.side !== undefined && params.side == 'west') {
            $(this).prepend('<td><img class="filled image field" src="' + params.imagePath + '"></td>');
        } else {
            $(this).append('<td><img class="filled image field" src="' + params.imagePath + '"></td>');
        }
    });
}

//erweitert ein Array um eine 2.Dimension
function expandArray(array) {
    // 123
    for (i = 0; i < 10; i++) {
        array[i] = new Array(10);
    }
    return array;
}

//Erstellt den JSON String des eigenen Spielfeldes für die Datenbank
function stringifyMap() {
    var shipparts = 0;
    var array = [];
    var array = expandArray(array);
    //Belege ein 10x10 array mit lauter leeren Federn  //das Feld ganz links oben hat die x=0 y=0
    // 123
    for (var x = 0; x < 10; x++) {
        for (var y = 0; y < 10; y++) {
            array[x][y] = {type: EMPTY};
        }
    }
    $.each(ships, function (key, ship) {
        //schiffelder anhand von x und y-koordinate berechnen(obere linke ecke des umgebenden divs)

        /////////in dieser version sind 1x1 große schiffe deaktiviert, weil es zu lang dauert sie zu finden beim spielen
        // if(ship.shipType == 1){ //1x1 großes schiff
        // //Setze anhand der Koordinaten die Schifsteile ins array und speicher zusätzlich noch die SchiffsID ( für spätere Prüfung ob Schiff komplett Zerstört ist)
        // array[ship.x][ship.y] = {type: SHIP_PART, id: ship.id};
        // shipparts++;
        // }
        // else{ //alle anderen schiffslängen

        if (ship.rotated) { //vertikal
            for (var i = 0; i < ship.shipType; i++) {
                array[(ship.x - 3)][(ship.y - 3)] = {type: SHIP_PART, id: ship.id}; // -3 weil das spielfeld um 150px(=3+50px) verschoben ist
                shipparts++;
                ship.y += 1;
            }
        }
        else {
            for (var i = 0; i < ship.shipType; i++) {
                array[(ship.x - 3)][(ship.y - 3)] = {type: SHIP_PART, id: ship.id};
                shipparts++;
                ship.x += 1;
            }
        }

        //}

    });
    if (shipparts == 21) {
        alert("Erfolgreich schiffe platziert, warte auf Gegner!");
    }
    return JSON.stringify(array);  // Prüfe ob alle Schiffe im Spielfeld
}

function sendShot(x, y) {
    $.post("server/controller.php", { action: "checkHit", x: x, y: y, gameId: $.session.get("gameId"), player: $.session.get("player")
    })
        .done(function (json) {
            var data = $.parseJSON(json);
            field = $('#mapOpponent').find("img[coords='" + x + "." + y + "']");
            $(field).addClass('alreadyShot');
            if (data.hitType == HIT) {
                statHits++;
                $('#hitSound')[0].play();
                $(field).attr('src', 'assets/img/hit.png');
                $(field).css("zIndex", 999);
            } else {
                statMissed++;
                $('#missedSound')[0].play();
                $(field).attr('src', 'assets/img/missed.png');
                $(field).css("zIndex", 999);
            }
            if (data.completeHit != null) {
                statEnemySurvivingShips--;
                var length = 0;
                switch (data.completeHit) {
                    case 1:
                        length = 2;
                        break;
                    case 2:
                        length = 2;
                        break;
                    case 3:
                        length = 2;
                        break;
                    case 4:
                        length = 3;
                        break;
                    case 5:
                        length = 3;
                        break;
                    case 6:
                        length = 4;
                        break;
                    case 7:
                        length = 5;
                        break;
                }
                alert('Gegnerisches Schiff der Laenge ' + length + ' wurde versenkt!');

                //bestimme oberstes oder linkestes feld des abgeschossenen schiffes
                $shippos = null;
                var bRotated = false;
                for (var i = 1; ;) {
                    var $leftfield = $('#mapOpponent').find("img[coords='" + (parseInt(x) - i) + "." + y + "']");
                    if ($leftfield.attr('src') == 'assets/img/hit.png') {
                        i++;
                        $shippos = $leftfield;
                    }
                    else {
                        break;
                    }
                }
                if ($shippos === null) {	 //check ob man das "linkste" element des schiffs getroffen hat
                    var $rightfield = $('#mapOpponent').find("img[coords='" + (parseInt(x) + 1) + "." + y + "']");
                    if ($rightfield.attr('src') == 'assets/img/hit.png') {
                        $shippos = $('#mapOpponent').find("img[coords='" + x + "." + y + "']");
                    }
                }
                if ($shippos === null) {
                    bRotated = true;
                    for (var i = 1; ;) {
                        var $topfield = $('#mapOpponent').find("img[coords='" + x + "." + (parseInt(y) - i) + "']");
                        if ($topfield.attr('src') == 'assets/img/hit.png') {
                            i++;
                            $shippos = $topfield;
                        }
                        else {
                            break;
                        }
                    }
                    if ($shippos === null) {
                        var $ufield = $('#mapOpponent').find("img[coords='" + x + "." + (parseInt(y) + 1) + "']");
                        if ($ufield.attr('src') == 'assets/img/hit.png') {
                            $shippos = $('#mapOpponent').find("img[coords='" + x + "." + y + "']");
                        }
                    }
                }
                if (bRotated) {
                    var s = '<img class="sunkenships" src="assets/img/ship_' + length + '_sunken_rotated.png" style="position:absolute;">';
                }
                else {
                    var s = '<img class="sunkenships" src="assets/img/ship_' + length + '_sunken.png" style="position:absolute;">';
                }
                var position = $shippos.offset();
                var $n = jQuery(s).appendTo('body');
                $n.css(position).css("zIndex", 9999);
            }
            arrEnemyShipsOverTime.push(statEnemySurvivingShips);
            arrHitsOverTime.push(statHits);
            arrMissedOverTime.push(statMissed);
            if (data.winner != null) {
                alert('Du hast gewonnen!');
                showEnd();
            }
            else {
                checkTurnIntervalId = setInterval(function () {
                    checkMyTurn();
                }, checkTurnIntervalTime);
            }
        });
}

function checkMyTurn() {
    $.post("server/controller.php", { action: "checkMyTurn", gameId: $.session.get("gameId"), player: $.session.get("player")
    })
        .done(function (json) { //der Parameter json ist der returnte Wert der Php-funktion "checkMyTurn"
            var data = $.parseJSON(json); //JSON string wird umgewandelt und returnt ihn als JavaScript object
            if (data.myTurn) {
                if (data.lastShot != null) {
                    field = $('#map').find("img[coords='" + data.lastShot.x + "." + data.lastShot.y + "']");
                    if (data.lastShot.hitType == HIT) {
                        $('#hitSound')[0].play();
                        statEnemyHits++;
                        $(field).attr('src', 'assets/img/hit.png');
                        $(field).css("zIndex", 999);
                    } else {
                        $('#missedSound')[0].play();
                        statEnemyMissed++;
                        $(field).attr('src', 'assets/img/missed.png');
                        $(field).css("zIndex", 999);
                    }
                    if (data.lastShot.completeHit != null) {
                        statSurvivingShips--;
                        alert('Schiff wurde versenkt!');
                    }
                    arrShipsOverTime.push(statSurvivingShips);
                    arrEnemyHitsOverTime.push(statEnemyHits);
                    arrEnemyMissedOverTime.push(statEnemyMissed);
                    if (data.winner != null) {
                        alert('Du hast verloren!');
                        showEnd();
                    }
                }
                clearInterval(checkTurnIntervalId);
                fieldClickDisabled = false;
                alert("Du bist dran!");
            }
        });
}

function sendMap() {
    var map = stringifyMap();
    if (!map) return;
    $(".ship").draggable("disable");
    $(".rotate_button").remove();
    $("#btnFertig").remove();
    $('#mapOpponent').show();
    $.post("server/controller.php", { action: "sendMap", map: map, gameId: $.session.get("gameId"), player: $.session.get("player") })
        .done(function (json) {
            checkTurnIntervalId = setInterval(function () {
                checkMyTurn();
            }, checkTurnIntervalTime);
        });
}

function showEnd() {
    $('.ship').hide();
    $('.sunkenships').hide();
    $('#mapOpponent').hide();
    $('#map').hide();
    $('#statistics').show();
    $('#statistics').highcharts({
        chart: {
            type: 'bar'
        },
        title: {
            text: 'Game Statistics'
        },
        xAxis: {
            categories: ['Hits', 'Missed', 'Ships']
        },
        yAxis: {
            allowDecimals: false
        },
        series: [
            {
                name: 'You',
                data: [statHits, statMissed, statSurvivingShips]
            },
            {
                name: 'Enemy',
                data: [statEnemyHits, statEnemyMissed, statEnemySurvivingShips]
            }
        ]
    });
    $('#statistics2').show();
    $('#statistics2').highcharts({
        title: {
            text: 'Game Statistics over Time'
        },
        xAxis: {
            allowDecimals: false
        },
        yAxis: {
            allowDecimals: false,
            min: 0
        },
        series: [
            {
                data: arrShipsOverTime,
                step: 'left',
                name: 'Your Ships'
            },
            {
                data: arrHitsOverTime,
                step: 'left',
                name: 'Your Hits'
            },
            {
                data: arrEnemyShipsOverTime,
                step: 'left',
                name: 'Enemy Ships'
            },
            {
                data: arrEnemyHitsOverTime,
                step: 'left',
                name: 'Enemy Hits'

            },
            {
                data: arrMissedOverTime,
                step: 'left',
                name: 'You didnt hit'
            },
            {
                data: arrEnemyMissedOverTime,
                step: 'left',
                name: 'Enemy didnt hit'
            }
        ]
    });
}