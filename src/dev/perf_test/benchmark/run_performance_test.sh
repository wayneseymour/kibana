#!/bin/bash


regExpHeadCommit="HEAD is now at ([a-zA-Z0-9]+) (.*) (\(#([0-9]+)\))?"
gitHeadLine=""
gitHash=""
prNumber=""
gitDescription=""
throttle=""
FULL_EXTERNAL_PATH=""
gitDate=""

while getopts c:d:e:g:h:r:t:x:k: option; do
  case "${option}" in

  c) CHERRY_PICKS=${OPTARG} ;;
  d) PACKET_DELAY=${OPTARG} ;;
  e) EXTERNAL_PATH=${OPTARG} ;;
  g) GREP=${OPTARG} ;;
  h) GIT_HEAD=${OPTARG} ;;
  k) KILL=${OPTARG} ;;
  r) RUN_COUNT=${OPTARG} ;;
  t) THROTTLED=${OPTARG} ;;
  x) XPACK=${OPTARG} ;;

  esac
done

setDefaults() {
  if [ "$RUN_COUNT" = "" ]; then
    RUN_COUNT=1
  fi

  if [ "$PACKET_DELAY" = "" ]; then
    PACKET_DELAY=0
  #	sudo /sbin/tc qdisc del dev lo root
  # sudo /sbin/tc qdisc add dev lo root netem delay ${PACKET_DELAY}ms
  fi
  if [ "$THROTTLED" != "" ]; then
    throttle="true"
  fi
}

changeDirToRoot() {
  pushd ../../../../ >/dev/null
}
createExternalPath() {
  mkdir -p $EXTERNAL_PATH
}
changeDirToExternalPath() {
  pushd $EXTERNAL_PATH
}

fetchOrigin() {
  echo "### Fetching origin"
  git fetch origin
}

resetGit() {
  echo "### Syncing to GIT_HEAD: ${GIT_HEAD}"
  lines=$(git reset --hard ${GIT_HEAD})
  echo "### lines: ${lines}"
  gitDate=$(git show -s --format=%cI ${gitHash})
}

parseGit() {
  echo "### Parsing git output"
  # https://unix.stackexchange.com/a/340485
  # performs a regular expression match of the string to its left,
  # to the extended regular expression on its right.
  if [[ "$lines" =~ $regExpHeadCommit ]]; then
    gitHash="${BASH_REMATCH[1]}"
    gitDescription="${BASH_REMATCH[2]}"
    prNumber="${BASH_REMATCH[4]}"
    echo "### Parsed Git -> Hash: ${gitHash} description: ${gitDescription} prNumber: ${prNumber}"
  fi

  # Note:
  # *** BASH_REMATCH ***
  # An array variable whose members are assigned by the ‘=~’ binary operator to the
  # [[ conditional command (see Conditional Constructs).
  # The element with index 0 is the portion of the string matching the entire regular expression.
  # The element with index n is the portion of the string matching the nth parenthesized subexpression.
  # This variable is read-only.
}

maybeExit() {
  if [ "$gitDescription" = "" ]; then
    echo "### Something went wrong, no description found, gitDescription: [${gitDescription}]"
    exit 1
  fi
}

cherryPickCommits() {
  echo "### Cherry picking!"
  # Cherrypicks that stabilize flaky tests.
  #sudo git cherry-pick e85bbf4

  # Changes to track all test times and full test title
  #sudo git cherry-pick 1677685

  # Changes to extend leadfoot timeouts to enable testing slow internet connections
  #sudo git cherry-pick 9c4fbd5
  for cherry in $CHERRY_PICKS; do
    echo "sudo git cherry-pick ${cherry}"
    git cherry-pick ${cherry}
  done
}

loadNvm() {
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

  # TODO-TRE: NEXT LINE NEEDED????
  #  ~/.nvm/nvm.sh
}

cleanEs() {
  echo "### Deleting es directory"
  rm -rf .es
}

bootstrapKibana() {
  echo "### Running clean && bootstrap"
  yarn kbn clean && yarn kbn bootstrap
  node scripts/build_kibana_platform_plugins
}

printInitVars() {
  echo "### FULL_EXTERNAL_PATH: ${FULL_EXTERNAL_PATH}"
  echo "### GIT_DATE: ${GIT_DATE}"
  echo "### GIT_HEAD: ${GIT_HEAD}"
  echo "### RUN_COUNT: ${RUN_COUNT}"
  echo "### PACKET_DELAY: ${PACKET_DELAY}"
  echo "### EXTERNAL_PATH: ${EXTERNAL_PATH}"
  echo "### GREP: ${GREP}"
  echo "### XPACK: ${XPACK}"
  echo "### CHERRY_PICKS: ${CHERRY_PICKS}"
  echo "### THROTTLED: ${THROTTLED}"
}

printVars() {
  printInitVars
}

setDefaults
createExternalPath
changeDirToExternalPath
fetchOrigin
resetGit
parseGit
printVars
[[ ! -z "$KILL" ]] && maybeExit
[[ ! -z "$CHERRY_PICKS" ]] && cherryPickCommits
export NODE_OPTIONS="--max_old_space_size=4096"
loadNvm
nvm use
cleanEs
bootstrapKibana

##echo "### gitDate: ${gitDate}"
##logstashTracking="PACKET_DELAY:${PACKET_DELAY} GIT_HASH:${gitHash} DESCRIPTION:\"${gitDescription}\" GIT_DATE:${gitDate}"
##logstashTracking="PACKET_DELAY:${PACKET_DELAY} GIT_HEAD:${GIT_HEAD} GIT_HASH:${gitHash} DESCRIPTION:\"${gitDescription}\" GIT_DATE:${gitDate}"
logstashTracking="PACKET_DELAY:${PACKET_DELAY} GIT_HASH:${gitHash} DESCRIPTION:\"${gitDescription}\" GIT_DATE:${gitDate}"
if [ "$prNumber" != "" ]; then
  logstashTracking="${logstashTracking} PR:${prNumber}"
fi
##cd ../benchmark
##echo "### Running benchmark, throttle is ${throttle}, runcount is ${RUN_COUNT}"
##./benchmark.sh -t "${throttle}" -g "${GREP}" -r ${RUN_COUNT} -a "${logstashTracking}" -x ${XPACK}
##./benchmark.sh -t "${throttle}" -g "${GREP}" -r ${RUN_COUNT} -a "${logstashTracking}" -x ${XPACK} -k ~/development/projects/kibana
echo "/home/tre/kibana/src/dev/perf_test/benchmark/benchmark.sh -r 1 -x true -k ${FULL_EXTERNAL_PATH} -a ${logstashTracking}"
