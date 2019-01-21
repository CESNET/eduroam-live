#!/bin/bash

lines=$(wc -l < $1)
curr=1

# more debug
# error can happen on 3rd data set - cubexcentrum.cz
i=0

while [[ $curr -lt $lines ]]
do
  data=$(sed -n $curr,$((curr + 71))p $1 | sed '1 s/\]\[/\[/' | jq -c '.')
  echo "$data" | curl http://195.113.233.246:8088/data -H 'Content-Type: application/json;charset=UTF-8' -H 'Accept: application/json, text/plain, */*' --data-binary @- # $'$data'
  curr=$((curr + 71))
  ((i++))

  #sleep 0.2        # this triggers the error
  sleep 0.1
  #sleep 5

  # more debug
  if [[ $i -eq 3 ]]
  then 
    exit 0
  fi

done


