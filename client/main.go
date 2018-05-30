package main

import (
	"bufio"
	"bytes"
	"context"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"runtime/pprof"
	"sync"
	"sync/atomic"
	"time"

	. "github.com/fugiman/deckmaster/client/types"
	"golang.org/x/sync/errgroup"
)

const ClientID = "cplheah4pxjyuwe9mkno9kbmb11lyc"

var tokenFilename = filepath.Join(os.Getenv("APPDATA"), "Deckmaster", "token.txt")

type service struct {
	ctx             context.Context
	logger          *log.Logger
	globalGameState atomic.Value
	token           atomic.Value
	pipe            bytes.Buffer
	pipeLock        sync.Mutex
	messageChannel  chan interface{}
	pubsubStatus    atomic.Value
	arenaStatus     atomic.Value
	voting          atomic.Value
	tokenCh         chan Token
}

func main() {
	autoUpdate()

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

	eg, ctx := errgroup.WithContext(ctx)
	if os.Getenv("DEBUG") != "" {
		go func() {
			<-ctx.Done()
			time.Sleep(30 * time.Second)
			logger.Println("Force closing, goroutine stuck")
			pprof.Lookup("goroutine").WriteTo(logStream, 1)
			logStream.Flush()
			os.Exit(1)
		}()
	}

	svc := &service{
		ctx:            ctx,
		logger:         logger,
		messageChannel: make(chan interface{}, 100),
		tokenCh:        make(chan Token, 10),
	}
	svc.token.Store(token)
	svc.tokenCh <- token

	eg.Go(svc.server)
	eg.Go(svc.tail)
	eg.Go(svc.parser)
	eg.Go(svc.updater)
	eg.Go(svc.publisher)
	eg.Go(svc.votingLoop)

	if werr := svc.window(); werr != nil {
		cancel()
	}

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
