#!/bin/bash 


function title {
    echo "# HELP $1 $2"
    echo "# TYPE $1 $3"
}


function printMetric {
    title "$1" "$2" "$3"
    echo "$1$5 $4"
}

function printMetricA {
    echo "$1$5 $4"
}


trap 'echo shutdown.; exit' INT

function run() {
while read -r line
do
line=$(echo "$line" | tr -d '\r\n')
if [ -z "$line" ]
	then
	break
	fi
done

echo -en "HTTP/1.0 200 OK\r\n"
echo -en "Content-type: text/plain\r\n"
echo -en "\r\n"

succ=$(boinccmd --get_state |grep  succe | cut -d":" -f 2)
fail=$(boinccmd --get_state |grep failed | cut -d":" -f 2)
frac=$(boinccmd --get_state |grep fraction |cut -d':' -f 2)

printMetric "jobs" "Jobs Done on this Node" "gauge" $succ '{name="'$HOSTNAME'",type="succ"}'
printMetricA "jobs" "Jobs done" "gauge" $fail '{name="'$HOSTNAME'",type="fail"}'

title "fraction" "Actual jobs status" "gauge" 
t=0
for a in $frac
do
t=$(($t+1))
printMetricA "fraction" "Actual jobs status" "gauge" $a '{name="'$HOSTNAME'",task="'$t'"}'
done

}


if [ ! "z$1" == "zdata" ]
then
	while :; do
		nc -l -p 1234 -c "$0 data"
	done
else
run
fi
#
