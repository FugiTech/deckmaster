#!/bin/bash
# This script assumes you've run `python download_card_images.py` already
# So do that first if you haven't

# Oh also you'll need docker running, so make sure to launch "Docker Quickstart Terminal"
# Then you'll need to turn off TLS on the tcp endpoint with
# >docker-machine ssh
# >cd /var/lib/boot2docker
# >sudo vi profile
# Turn DOCKER_TLS to "no"
# esc, :wq, enter, "exit"
# >docker-machine restart

export CWD=$(pwd)
rm -rf dist
mkdir dist
mkdir dist/twitch
mkdir dist/netlify

# Build twitch bundle
cd config && yarn install && yarn build && cd ..
cd overlay && yarn install && yarn build && cd ..
mv config/dist dist/twitch/config
mv overlay/dist dist/twitch/overlay
cp -r dashboard dist/twitch/dashboard

cd dist/twitch && zip -r ../twitch.zip * && cd ../..

# Build netlify bundle
cp -r cards dist/netlify/cards
cp logo.png dist/netlify

cd client_ui && yarn install && yarn build && cd ..
go get github.com/rakyll/statik
statik -src=client_ui/dist -dest=client -m -f

VERSION=`git rev-parse --short HEAD`
echo "package main\n\nconst VERSION = \"$VERSION\"" > client/version.go
echo $VERSION > dist/netlify/version

export DOCKER_HOST=192.168.99.100:2376
export GOPATH=${HOME}/go
go get github.com/karalabe/xgo

$GOPATH/bin/xgo --targets=windows/amd64 -ldflags="-H windowsgui" -out deckmaster -dest $CWD/dist/netlify ./client
