<?php

include 'config.php';

if (isset($_REQUEST["getmetastat"])) {
    $result = mysqli_query($connection, "SELECT * FROM metastatistics");
    $row = mysqli_fetch_array($result);


    $tresult = mysqli_query($connection, "SELECT * FROM timestamps"); //ORDER BY times DESC
    $i = 0;
    $timestamps = array();
    while ($trow = mysqli_fetch_array($tresult)) {
        $timestamps[$i] = $trow['times'];
        $i++;
        $timestamps[$i] = $trow['ships'];
        $i++;
    }
    if ((isset($row['jsonPlaced'])) && (isset($row['jsonHits'])) && (isset($row['jsonMissed'])) && (isset($timestamps[0]))) {
        echo $row['jsonPlaced'] . "|" . $row['jsonHits'] . "|" . $row['jsonMissed'] . "|" . json_encode($timestamps);
    } else {
        echo false;
    }
} else if (isset($_REQUEST["updateNumberOfGames"])) {
    $result = mysqli_query($connection, "SELECT * FROM matches");
    $timestamp = time();
    mysqli_query($connection, "INSERT INTO timestamps (times, ships) VALUES ('" . $timestamp . "', '" . mysqli_num_rows($result) . "')");
}
?>
