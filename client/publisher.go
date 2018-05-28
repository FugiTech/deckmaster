package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"time"

	. "github.com/fugiman/deckmaster/client/types"
)

func (svc *service) publisher() error {
	timer := time.NewTicker(time.Second)
	defer timer.Stop()
	for {
		select {
		case <-svc.ctx.Done():
			return nil
		case <-timer.C:
			status := svc.publish()
			svc.pubsubStatus.Store(status)
		}
	}
}

func (svc *service) publish() string {
	token, ok := svc.token.Load().(Token)
	if !ok {
		return "No token available"
	}
	if token.Expires.Before(time.Now()) {
		return "Token has expired"
	}

	gs, ok := svc.globalGameState.Load().(BroadcastMessage)
	if !ok {
		return ""
	}

	data, err := json.Marshal(gs)
	if err != nil {
		return "JSON error"
	}

	body, err := json.Marshal(map[string]interface{}{
		"content_type": "application/json",
		"message":      string(data),
		"targets":      []string{"broadcast"},
	})
	if err != nil {
		return "JSON error"
	}

	req, err := http.NewRequest("POST", "https://api.twitch.tv/extensions/message/"+token.ChannelID, bytes.NewReader(body))
	if err != nil {
		return "Unexpected error"
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Client-ID", "cplheah4pxjyuwe9mkno9kbmb11lyc")
	req.Header.Set("Authorization", "Bearer "+token.JWT)

	resp, err := http.DefaultClient.Do(req)
	if err != nil || resp.StatusCode != 204 {
		return "Publish request failed"
	}

	return ""
}
