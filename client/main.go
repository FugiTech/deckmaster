package main

import (
	"context"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"runtime/pprof"
	"time"

	"golang.org/x/sync/errgroup"
)

var tokenFilename = filepath.Join(os.Getenv("APPDATA"), "Deckmaster", "token.txt")

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	logFile, err := os.Create("deckmaster.log")
	if err != nil {
		panic(err)
	}
	logger := log.New(logFile, "", log.LstdFlags|log.Lshortfile)

	var token Token
	if data, derr := ioutil.ReadFile(tokenFilename); derr == nil {
		token = parseToken(string(data))
	} else {
		// Make folder
	}

	reader, writer, err := os.Pipe()
	if err != nil {
		logger.Println("error making pipe:", err)
		return
	}

	eg, ctx := errgroup.WithContext(ctx)
	go func() {
		<-ctx.Done()
		time.Sleep(5 * time.Second)
		pprof.Lookup("goroutine").WriteTo(os.Stdout, 1)
		os.Exit(1)
	}()

	svc := &service{
		ctx:            ctx,
		logger:         logger,
		writer:         writer,
		reader:         reader,
		messageChannel: make(chan *GREMessage, 100),
	}
	svc.token.Store(token)

	eg.Go(svc.server)
	eg.Go(svc.window)
	eg.Go(svc.tail)
	eg.Go(svc.parser)
	eg.Go(svc.updater)
	eg.Go(svc.publisher)

	err = eg.Wait()
	if err != nil {
		logger.Println(err)
	}
}

func contains(a []string, s string) bool {
	for _, v := range a {
		if s == v {
			return true
		}
	}
	return false
}
