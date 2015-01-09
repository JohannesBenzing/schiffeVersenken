$(document).ready(function () {
    $('#metastatistics').hide();
    $('#metastatisticstime').hide();

    $.post("server/controller.php", { action: "listOpenMatches"})
        .done(function (json) {
            var matches = $.parseJSON(json);
            if (matches.warning !== undefined) {
                $('#gamesList').append('<li>' + matches.warning + '</li>');

            } else {
                $.each(matches, function (key, match) {
                    if (match.password) {
                        $('#gamesList').append('<li matchId="' + match.id + '">' + match.name + '<input class="passwordField" type="password" placeHolder="Passwort" size="25"><button class="joinButton">Join</button></li>');
                    } else {
                        $('#gamesList').append('<li matchId="' + match.id + '">' + match.name + '<button class="joinButton" >Join</button></li>');
                    }
                });
            }

            $(".joinButton").click(function () {
                var gameId = $(this).parent().attr('matchId');
                var password = $(this).siblings('.passwordField').val();
                if (password === undefined)password = '';
                joinMatch(gameId, password);
            });
        });
});


function createMatch() {

    if ($('#matchName').val() != '') {
        $.post("server/controller.php", { action: "createMatch", name: $('#matchName').val(), password: $('#matchPassword').val() })
            .done(function (json) {
                var data = $.parseJSON(json);
                $.session.set("gameId", data.gameId);
                $.session.set("player", data.player);
                window.location.replace("match.html");
            });
    } else {
        alert("bitte einen Partienamen eingeben");
    }
}


function joinMatch(gameId, password) {

    $.post("server/controller.php", { action: "joinMatch", gameId: gameId, password: password })
        .done(function (json) {
            var data = $.parseJSON(json);
            if (data.error) {
                alert("falsches Passwort");
                return;
            }
            $.session.set("gameId", data.gameId);
            $.session.set("player", data.player);
            window.location.replace("match.html");
        });
}

function getMetaStatistics() {
    $.post(
        "server/metastatistics.php",
        { getmetastat: "somestring" },
        function (json) {
            var arrStr = json.split("|");
            try {
                var dataships = $.parseJSON(arrStr[0]);
                var datahits = $.parseJSON(arrStr[1]);
                var datamissed = $.parseJSON(arrStr[2]);
                var datatimes = $.parseJSON(arrStr[3]);
            }
            catch (e) {
                alert('Der Datenbank fehlen Werte!');
                return;
            }
            //array in highcharts-kompatible form ändern
            var arrCompatibleShips = [];
            for (i = 0, x = 0; x < 10; x++) {
                for (var y = 0; y < 10; i++, y++) {
                    arrCompatibleShips[i] = [x, (y + 1), dataships[x][y] ]; //alle y um 1 erhoehen wegen halber Zeile siehe Konfiguration bei "yAxis:"
                }
            }
            var arrCompatibleHits = [];
            for (i = 0, x = 0; x < 10; x++) {
                for (var y = 0; y < 10; i++, y++) {
                    arrCompatibleHits[i] = [x, (y + 1), datahits[x][y] ];
                }
            }
            var arrCompatibleMissed = [];
            for (i = 0, x = 0; x < 10; x++) {
                for (var y = 0; y < 10; i++, y++) {
                    arrCompatibleMissed[i] = [x, (y + 1), datamissed[x][y] ];
                }
            }

            var arrCompatibleTimes = [];
            for (i = 0, j = 0; i < datatimes.length; i = i + 2, j++) {
                arrCompatibleTimes[j] = [];
                arrCompatibleTimes[j][0] = parseInt(datatimes[i]) * 1000; //js nutzt millisekunden für timestamps
                arrCompatibleTimes[j][1] = parseInt(datatimes[i + 1]);
            }
            $('#metastatistics').show();
            $('#metastatistics').highcharts({
                chart: {
                    type: 'bubble',
                    zoomType: 'xy'
                },
                title: {
                    text: 'Verteilung einzelner Werte auf dem Spielfeld'
                },
                xAxis: {
                    gridLineWidth: 1,
                    min: 0,
                    max: 9,
                    categories: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
                    opposite: true //x-achse oben
                },
                yAxis: {
                    min: 0,
                    max: 11,
                    categories: [' ', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ' '], //auf der y-achse werden die hoechste und die niedrigste zeile nur halb dargestellt->die punkte in diesen zeilen werden nur halb dargestellt->2 extra zeilen
                    reversed: true, //höchste werte weiter unten
                    //wir verstecken die standard-gitterlinien, die auch um eine halbe zeile verschoben sind und erstellen mit plotLines eigene
                    gridLineWidth: 0,
                    minorGridLineWidth: 0,
                    plotLines: [
                        {  value: 1.5, color: '#C0C0C0', width: 1},
                        {  value: 2.5, color: '#C0C0C0', width: 1},
                        {  value: 3.5, color: '#C0C0C0', width: 1},
                        {  value: 4.5, color: '#C0C0C0', width: 1},
                        {  value: 5.5, color: '#C0C0C0', width: 1},
                        {  value: 6.5, color: '#C0C0C0', width: 1},
                        {  value: 7.5, color: '#C0C0C0', width: 1},
                        {  value: 8.5, color: '#C0C0C0', width: 1},
                        {  value: 9.5, color: '#C0C0C0', width: 1}
                    ]
                },
                plotOptions: {
                    bubble: {
                        minSize: 0,
                        maxSize: 63
                    }
                },
                tooltip: { //y wurde um 1 erhöht, im tooltip, der erscheint wenn wir die maus ueber eine bubble schieben verringen wir y wieder
                    formatter: function () {
                        return this.x + "  " + (this.y - 1) + "   total amout: " + this.point.z;
                    }
                },
                series: [
                    {
                        name: 'Most ships placed on these fields',
                        data: arrCompatibleShips
                    },
                    {
                        name: 'Most hits on these fields',
                        color: '#FF0000',
                        data: arrCompatibleHits
                    },
                    {
                        name: 'Least succesful hits on these fields',
                        color: '#FFE600',
                        data: arrCompatibleMissed
                    }
                ]
            });

            Highcharts.setOptions({
                global: {
                    useUTC: false  //highcharts nutzt nun nicht mehr utc sondern die lokale zeitzone
                }
            });
            $('#metastatisticstime').show();
            $('#metastatisticstime').highcharts({
                title: {
                    text: 'Partien/Zeit'
                },
                xAxis: {
                    type: 'datetime'
                },
                yAxis: {
                },
                tooltip: {
                },
                series: [
                    {
                        name: 'Anzahl Partien',
                        data: arrCompatibleTimes
                    }
                ]
            });


        }
    );
}