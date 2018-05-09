package main

import (
	"bufio"
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
	defer logFile.Close()
	logStream := bufio.NewWriter(logFile)
	defer logStream.Flush()
	logger := log.New(logStream, "", log.LstdFlags|log.Lshortfile)

	var token Token
	if data, derr := ioutil.ReadFile(tokenFilename); derr == nil {
		token = parseToken(string(data))
	} else {
		os.MkdirAll(filepath.Dir(tokenFilename), 0755)
	}

	reader, writer, err := os.Pipe()
	if err != nil {
		logger.Println("error making pipe:", err)
		return
	}

	eg, ctx := errgroup.WithContext(ctx)
	go func() {
		<-ctx.Done()
		time.Sleep(30 * time.Second)
		pprof.Lookup("goroutine").WriteTo(logStream, 1)
		logStream.Flush()
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
