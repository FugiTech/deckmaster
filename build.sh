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

rm -rf dist
mkdir dist
mkdir dist/twitch
mkdir dist/netlify

# Build twitch bundle
cd config && yarn build && cd ..
cd overlay && yarn build && cd ..
mv config/dist dist/twitch/config
mv overlay/dist dist/twitch/overlay
cp -r dashboard dist/twitch/dashboard

cd dist/twitch && zip -r ../twitch.zip * && cd ../..

# Build netlify bundle
cp -r cards dist/netlify/cards
cp -r dist/netlify/cards/en/* dist/netlify/cards
cp logo.png dist/netlify

cd client_ui && yarn build && cd ..
go get github.com/rakyll/statik
statik -src=client_ui/dist -dest=client -m -f

VERSION=`git rev-parse --short HEAD`
echo "package main\n\nconst VERSION = \"$VERSION\"" > client/version.go
echo $VERSION > dist/netlify/version

go get github.com/karalabe/xgo
export DOCKER_HOST=192.168.99.101:2376
export GOPATH=/c/Users/fugi_000/go
xgo --targets=windows/amd64 -ldflags="-H windowsgui" -out deckmaster -dest /c/Users/fugi_000/go/src/github.com/fugiman/deckmaster/dist/netlify ./client
