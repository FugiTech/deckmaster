package main

import (
	"errors"
	"strconv"
	"time"

	"github.com/zserge/webview"
)

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
		defer window.Exit()
		<-svc.ctx.Done()
	}()

	window.Run()
	return errors.New("window closed")
}

func (svc *service) invokeCallback(w webview.WebView, data string) {
	svc.logger.Println(data)
}
