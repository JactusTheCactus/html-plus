#!/usr/bin/env bash
set -euo pipefail
flag() {
	for f in "$@"
		do [[ -e ".flags/$f" ]] || return 1
	done
}
rm -rf logs dist &> /dev/null || :
then mkdir -p logs dist
if flag local
	then exec &> logs/main.log
fi
npx tsc
if ! flag local
	then npm ci
fi
while read -r f
	do node dist/htmlp.js "$f" || :
done < <(find src -name \*.htmlp)
find . -empty ! -name \*.\*keep -delete