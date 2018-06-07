package main

import (
	"errors"
	"log"
	"strconv"
	"sync/atomic"
	"time"

	"github.com/fugiman/deckmaster/client/webview"
)

var ErrWindowClosed = errors.New("window closed")

func (svc *service) window() error {
	window := webview.New(webview.Settings{
		Title:  "Deckmaster: MTG Arena Overlay",
		URL:    "http://localhost:22223?" + strconv.Itoa(int(time.Now().Unix())),
		Width:  400,
		Height: 400,
	})
	if window == nil {
		log.Println("Window failed to create :(")
		return errors.New("Failed to create window")
	}

	var running atomic.Value
	running.Store(true)

	go func() {
		<-svc.ctx.Done()
		if running.Load().(bool) {
			window.Dialog(webview.DialogTypeAlert, webview.DialogFlagError, "Fatal Error", "Deckmaster has encountered an error and must stop.\n\nTry reopening Deckmaster and contact @Fugiman or fugi@fugiman.com if this persists.")
			window.Dispatch(window.Terminate)
		}
	}()

	log.Println("Running window")
	window.Run()
	log.Println("window stopped running")
	running.Store(false)
	return ErrWindowClosed
}
