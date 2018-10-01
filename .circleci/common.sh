#!/bin/sh
msg() {
  echo -e >&2 "\033[1;34m$0\033[0;34m: $*\033[0m"
}

if [ $# -lt 1 ]
then msg "Usage: $0 <docker image name>" && exit 1
fi
# shellcheck disable=SC2034
image=$1
