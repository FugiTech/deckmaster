package main

import (
	"errors"
	"strconv"
	"time"

	"github.com/zserge/webview"
)

var ErrWindowClosed = errors.New("window closed")

func (svc *service) window() error {
	window := webview.New(webview.Settings{
		Title:                  "Deckmaster: MTG Arena Overlay",
		URL:                    "http://localhost:22223?" + strconv.Itoa(int(time.Now().Unix())),
		Width:                  400,
		Height:                 200,
		Resizable:              false,
		ExternalInvokeCallback: svc.invokeCallback,
	})
	if window == nil {
		return errors.New("Failed to create window")
	}

	go func() {
		<-svc.ctx.Done()
		if svc.ctx.Err() != ErrWindowClosed {
			window.Dispatch(func() {
				window.Dialog(webview.DialogTypeAlert, webview.DialogFlagError, "Fatal Error", "Deckmaster has encountered an error and must stop.\n\nTry reopening Deckmaster and contact @Fugiman or fugi@fugiman.com if this persists.")
				window.Terminate()
			})
		}
	}()

	window.Run()
	return ErrWindowClosed
}

func (svc *service) invokeCallback(w webview.WebView, data string) {
	svc.logger.Println(data)
}
