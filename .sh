#!/usr/bin/env bash
set -euo pipefail
flag() {
	for f in "$@"
		do [[ -e ".flags/$f" ]] || return 1
	done
}
ts() {
if flag local
	then tsc "$@"
	else npx tsc "$@"
fi
}
rm -rf logs dist &> /dev/null || :
mkdir -p logs dist
if flag local
	then exec &> logs/main.log
	else npm ci
fi
ts
while read -r f
	do node dist/htmlp.js "$f" || :
done < <(find src -name \*.htmlp)
find . -empty ! -name \*.\*keep -delete