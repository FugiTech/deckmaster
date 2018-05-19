export DOCKER_HOST=192.168.99.100:2376
export GOPATH=${HOME}/go
xgo --targets=windows/amd64 -ldflags="-H windowsgui" -out deckmaster -dest ./dist/netlify ./client
