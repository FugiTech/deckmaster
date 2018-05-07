package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/zserge/webview"
)

func (svc *service) window() error {
	window := webview.New(webview.Settings{
		Title:                  "Deckmaster: MTG Arena Overlay",
		URL:                    "http://localhost:22223",
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

		window.Dispatch(func() {
			window.Eval(fmt.Sprintf(`store.commit('version', %q)`, VERSION))
		})

		timer := time.NewTicker(5 * time.Second)
		defer timer.Stop()

		for {
			select {
			case <-svc.ctx.Done():
				return
			case <-timer.C:
				data, err := json.Marshal(map[string]interface{}{
					"Twitch": svc.pubsubStatus.Load(),
				})
				if err == nil {
					window.Dispatch(func() {
						window.Eval(fmt.Sprintf(`store.commit('status', %s)`, data))
					})
				}
			}
		}
	}()

	window.Run()
	return errors.New("window closed")
}

func (svc *service) invokeCallback(w webview.WebView, data string) {

}
