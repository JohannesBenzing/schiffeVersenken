<?php

class Controller
{

    function listOpenMatches()
    {

        include 'config.php';


        $sql = "SELECT id, name, password FROM matches WHERE state=0";
        $result = mysqli_query($connection, $sql) or die("Anfrage nicht erfolgreich");

        if (empty($result)) {
            return json_encode(Array('warning' => 'keine Partien vorhanden'));
        }

        while ($row = mysqli_fetch_array($result)) {
            if (!empty($row['password'])) {
                $row['password'] = true;
            } else {
                $row['password'] = false;
            }
            $json[] = $row;
        }

        return json_encode($json);
    }

    function createMatch($name, $password)
    {

        include 'config.php';

        $ships[0] = 21; //auf addiert Alle Schiffelemente/quadrate
        $ships[1] = 2;
        $ships[2] = 2;
        $ships[3] = 2;
        $ships[4] = 3;
        $ships[5] = 3;
        $ships[6] = 4;
        $ships[7] = 5;

        if (!empty($password)) $password = md5($password); //Verschlüssel das Passwort, falls eins gesetzt wurde
        mysqli_query($connection, "INSERT INTO matches (ships1, ships2, name, password) VALUES ('" . json_encode($ships) . "', '" . json_encode($ships) . "', '" . $name . "', '" . $password . "')");
        $json['gameId'] = mysqli_insert_id($connection);
        $json['player'] = 1;

        return json_encode($json);
    }


    function joinMatch($gameId, $password)
    {

        include 'config.php';

        $sql = "SELECT password, state FROM matches WHERE id='" . $gameId . "'";
        $result = mysqli_query($connection, $sql) or die("Anfrage nicht erfolgreich");

        $row = mysqli_fetch_array($result);

        if ($row['state'] == 1) {
            $json['error'] = 'bereits Zwei Spieler';
            return json_encode($json);
        }

        if (!empty($row['password'])) {
            if ($row['password'] == md5($password)) {
                $json['gameId'] = $gameId;
                $json['player'] = 2;
                mysqli_query($connection, "UPDATE matches SET state=1 WHERE id='" . $gameId . "'");
            } else {
                $json['error'] = 'falsches Password';
            }
        } else {
            $json['gameId'] = $gameId;
            $json['player'] = 2;
            mysqli_query($connection, "UPDATE matches SET state=1 WHERE id='" . $gameId . "'");
        }

        return json_encode($json);
    }

    function sendMap($gameId, $player, $map)
    {

        include 'config.php';

        $sql = "SELECT map1, map2 FROM matches WHERE id='" . $gameId . "'";
        $result = mysqli_query($connection, $sql) or die("Anfrage nicht erfolgreich");
        $row = mysqli_fetch_array($result);

        $turn = null;

        if ($player == 1) { //Es existiert bereits eine Partie und bei der jüngsten Partie ist der zweite Spielerslot noch frei
            if (!empty($row['map2'])) $turn = rand(1, 2);
            mysqli_query($connection, "UPDATE matches SET map1='" . $map . "', turn='" . $turn . "' WHERE id='" . $gameId . "'");
        } else { //Es noch kein Spiel oder die jüngste Partie ist voll
            if (!empty($row['map1'])) $turn = rand(1, 2);
            mysqli_query($connection, "UPDATE matches SET map2='" . $map . "', turn='" . $turn . "'  WHERE id='" . $gameId . "'");
        }

        //erhöhe statistik für beliebteste schiffspositionen
        $objMap = json_decode($map); // The function json_decode() returns an object by default.
        //mit true als Parameter gibt sie ein Array

        //check ob json bereits besteht
        $result = mysqli_query($connection, "SELECT jsonPlaced FROM metastatistics");
        $row = mysqli_fetch_array($result);
        if (isset($row['jsonPlaced'])) {
            $statMap = json_decode($row['jsonPlaced'], true);
        } else {
            $statMap = Array();
            for ($x = 0; $x < 10; $x++) {
                for ($y = 0; $y < 10; $y++) {
                    $statMap[$x][$y] = 0;
                }
            }
        }
        //von client gesendete schiffe hinzufügen
        for ($x = 0; $x < 10; $x++) {
            for ($y = 0; $y < 10; $y++) {
                if ($objMap[$x][$y]->type == 1) { //type1 = SHIP_PART
                    $statMap[$x][$y] += 1;
                }
            }
        }
        if (mysqli_num_rows($result) < 1) {
            mysqli_query($connection, "INSERT INTO metastatistics (jsonPlaced) VALUES ('" . json_encode($statMap) . "')");
        } else {
            mysqli_query($connection, "UPDATE metastatistics SET jsonPlaced='" . json_encode($statMap) . "'");
        }
    }


    function checkHit($gameId, $player, $x, $y)
    {

        include 'config.php';

        //Hole die Partie
        $sql = "SELECT * FROM matches WHERE id='" . $gameId . "'";
        $result = mysqli_query($connection, $sql) or die("Anfrage nicht erfolgreich");
        $row = mysqli_fetch_array($result);

        if ($player == 1) {
            $map = $row['map2'];
            $ships = $row['ships2'];
            $turn = 2;
        } else {
            $map = $row['map1'];
            $ships = $row['ships1'];
            $turn = 1;
        }
        $map = json_decode($map);
        $ships = json_decode($ships);
        $json = Array();
        $lastShot = Array();

        if ($map[$x][$y]->type == 1) { //type1 = SHIP_PART
            $ship = intval($map[$x][$y]->id); //->  dieser pfeil erlaubt bei objekten zugriff auf den value eines bestimmten keys. hier:id
            $map[$x][$y]->type = 2; //type2 = HIT
            $ships[$ship] = intval($ships[$ship]) - 1;
            $ships[0] = $ships[0] - 1; // reduziere anzahl aller "lebendigen" shipparts


            //////////erhöhe statistik für erfolgreicheste trefferspositionen////////
            //check ob json bereits besteht
            $result = mysqli_query($connection, "SELECT jsonHits FROM metastatistics");
            $row = mysqli_fetch_array($result);
            if (isset($row['jsonHits'])) {
                $statMap = json_decode($row['jsonHits'], true);
            } else {
                // 123
                $statMap = Array();
                for ($sx = 0; $sx < 10; $sx++) {
                    for ($sy = 0; $sy < 10; $sy++) {
                        $statMap[$sx][$sy] = 0;
                    }
                }
            }
            //von client gesendeten Hit hinzufuegen
            $statMap[$x][$y] += 1;
            mysqli_query($connection, "UPDATE metastatistics SET jsonHits='" . json_encode($statMap) . "'");
            //////////////////////statistik ende/////////////////

            if (intval($ships[$ship]) == 0) {
                $json['completeHit'] = $ship;
                $lastShot['completeHit'] = $ship;
            }
            // if(intval($ships[0]) == 0){   //todo
            // $json['winner'] = $player;
            // $lastShot['winner'] = $player;
            // return json_encode($json);
            // }
        } else {
            $map[$x][$y]->type = 3; //type3 = MISSED

            //////////erhöhe statistik für trefferspositionen mit wenigsten schiffstreffern////////
            //check ob json bereits besteht
            $result = mysqli_query($connection, "SELECT jsonMissed FROM metastatistics");
            $row = mysqli_fetch_array($result);
            if (isset($row['jsonMissed'])) {
                $statMissedMap = json_decode($row['jsonMissed'], true);
            } else {
                // 123
                $statMissedMap = Array();
                for ($sx = 0; $sx < 10; $sx++) {
                    for ($sy = 0; $sy < 10; $sy++) {
                        $statMissedMap[$sx][$sy] = 0;
                    }
                }
            }
            //von client gesendeten Missed-Hit hinzufügen
            $statMissedMap[$x][$y] += 1;
            mysqli_query($connection, "UPDATE metastatistics SET jsonMissed='" . json_encode($statMissedMap) . "'");
            //////////////////////statistik ende/////////////////

        }
        $json['hitType'] = $map[$x][$y]->type;

        if (intval($ships[0]) == 0) {
            $json['winner'] = $player;
            $lastShot['winner'] = $player;
            mysqli_query($connection, "DELETE FROM matches WHERE id='" . $gameId . "'");
            return json_encode($json);
        }

        $lastShot['x'] = $x;
        $lastShot['y'] = $y;
        $lastShot['hitType'] = $json['hitType'];

        if ($player == 1) {
            mysqli_query($connection, "UPDATE matches SET map2='" . json_encode($map) . "', ships2='" . json_encode($ships) . "', turn='" . $turn . "', lastShot='" . json_encode($lastShot) . "' WHERE id='" . $gameId . "'");
        } else {
            mysqli_query($connection, "UPDATE matches SET map1='" . json_encode($map) . "', ships1='" . json_encode($ships) . "', turn='" . $turn . "', lastShot='" . json_encode($lastShot) . "' WHERE id='" . $gameId . "'");
        }

        return json_encode($json);
    }

    function checkMyTurn($gameId, $player)
    {

        include 'config.php';

        //Hole die Partie
        $sql = "SELECT turn, lastShot FROM matches WHERE id='" . $gameId . "'";
        $result = mysqli_query($connection, $sql) or die("Anfrage nicht erfolgreich");
        $row = mysqli_fetch_array($result);

        if ($player == intval($row['turn'])) {
            return json_encode(Array('myTurn' => true, 'lastShot' => json_decode($row['lastShot'])));
        } else {
            return json_encode(Array('myTurn' => false));
        }
    }

}

//ROUTER
if (isset($_POST['action']) && isset($_POST['map']) && $_POST['action'] == 'subscribeToMatch') {
    session_start();
    $controller = new Controller();
    $result = $controller->subscribeToMatch($_POST['map']);
    $_SESSION['controller'] = serialize($controller);
    echo $result;
}

if (isset($_POST['action']) &&
    isset($_POST['gameId']) &&
    isset($_POST['x']) &&
    isset($_POST['x']) &&
    isset($_POST['player']) &&
    $_POST['action'] == 'checkHit'
) {
    session_start();
    $controller = unserialize($_SESSION['controller']);
    echo $controller->checkHit($_POST['gameId'], $_POST['player'], $_POST['x'], $_POST['y']);
}

if (isset($_POST['action']) && isset($_POST['player']) && isset($_POST['gameId']) && $_POST['action'] == 'checkMyTurn') {
    session_start();
    $controller = unserialize($_SESSION['controller']);
    echo $controller->checkMyTurn($_POST['gameId'], $_POST['player']);
}

if (isset($_POST['action']) && $_POST['action'] == 'listOpenMatches') {
    session_start();
    $controller = new Controller();
    $result = $controller->listOpenMatches();
    $_SESSION['controller'] = serialize($controller);
    echo $result;
}

if (isset($_POST['name']) && isset($_POST['password']) && isset($_POST['action']) && $_POST['action'] == 'createMatch') {
    session_start();
    $controller = unserialize($_SESSION['controller']);
    echo $controller->createMatch($_POST['name'], $_POST['password']);

}

if (isset($_POST['gameId']) && isset($_POST['password']) && isset($_POST['action']) && $_POST['action'] == 'joinMatch') {
    session_start();
    $controller = unserialize($_SESSION['controller']);
    echo $controller->joinMatch($_POST['gameId'], $_POST['password']);
}

if (isset($_POST['gameId']) && isset($_POST['player']) && isset($_POST['map']) && isset($_POST['action']) && $_POST['action'] == 'sendMap') {
    session_start();
    $controller = unserialize($_SESSION['controller']);
    echo $controller->sendMap($_POST['gameId'], $_POST['player'], $_POST['map']);
}


?>



