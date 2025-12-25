#!/usr/bin/env bash
set -euo pipefail
flag() {
	for f in "$@"
		do [[ -e ".flags/$f" ]] || return 1
	done
}
rm -rf logs dist &> /dev/null || :
mkdir -p logs
mkdir -p dist
exec &> logs/main.log
tsc
while read -r f
	do node dist/htmlp.js "$f" || :
done < <(find src -name \*.htmlp)
node test.js &> logs/test.log || :
find . -empty ! -name \*.\*keep -delete