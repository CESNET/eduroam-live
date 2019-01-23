#!/bin/bash

#data='{ "data" : "Jan 20 00:32:23 195.113.187.41 fticks[26977]: F-TICKS/eduroam/1.0#REALM=sstas-karvina.cz#VISCOUNTRY=CZ#VISINST=1vscht.cz#CSI=70-6F-6C-6A-41-64#PN=test_ucet@sstas-karvina.cz#RESULT=OK" }'
data="{ \"data\" : \"$(date) F-TICKS/eduroam/1.0#REALM=sstas-karvina.cz#VISCOUNTRY=CZ#VISINST=1vscht.cz#CSI=70-6F-6C-6A-41-64#PN=test_ucet@sstas-karvina.cz#RESULT=OK\" }"
echo "$data" | curl https://monitor.eduroam.cz:8088/terminal -H 'Content-Type: application/json;charset=UTF-8' -H 'Accept: application/json, text/plain, */*' --data-binary @-
