export DOCKER_HOST=192.168.99.101:2376
export GOPATH=/c/Users/fugi_000/go
xgo --targets=windows/amd64 -ldflags="-H windowsgui" -out deckmaster -dest /c/Users/fugi_000/go/src/github.com/fugiman/deckmaster/dist/netlify ./client
