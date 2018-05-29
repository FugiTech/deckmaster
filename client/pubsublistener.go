package main

import (
	"encoding/json"
	"fmt"
	"sort"
	"time"

	"github.com/gorilla/websocket"

	. "github.com/fugiman/deckmaster/client/types"
)

const voteTTL = 60 * time.Second

type msg struct {
	UserID string
	Data   struct {
		Card int
	}
}

func (svc *service) pubsublistener() error {
	d := &websocket.Dialer{}
	var c *websocket.Conn
	var err error
	ch := make(chan *msg, 100)
	timer := time.NewTicker(1 * time.Second)
	defer timer.Stop()

	votes := map[int]map[string]time.Time{}
	saveVotes := func() {
		type elem struct {
			Name  string
			Votes int
		}
		d := []elem{}
		for card, data := range votes {
			d = append(d, elem{
				Name:  AllCards[card].Name,
				Votes: len(data),
			})
		}
		sort.Slice(d, func(i, j int) bool {
			return d[i].Votes > d[j].Votes
		})
		svc.voting.Store(d)
	}

	for {
		select {
		case <-svc.ctx.Done():
			if c != nil {
				c.Close()
			}
			return svc.ctx.Err()

		case m := <-ch:
			if m.Data.Card != 0 {
				for card, data := range votes {
					if _, ok := data[m.UserID]; ok {
						delete(votes[card], m.UserID)
					}
				}
				if votes[m.Data.Card] == nil {
					votes[m.Data.Card] = map[string]time.Time{}
				}
				votes[m.Data.Card][m.UserID] = time.Now()
				saveVotes()
			}

		case <-timer.C:
			for card, data := range votes {
				for uid, t := range data {
					if time.Since(t) > voteTTL {
						delete(votes[card], uid)
					}
				}
			}
			saveVotes()

		case t := <-svc.tokenCh:
			if t.JWT == "" || t.ChannelID == "" {
				continue
			}
			if c != nil {
				c.Close()
			}
			c, _, err = d.Dial("wss://pubsub-edge.twitch.tv", nil)
			if err != nil {
				return err
			}
			svc.logger.Println("Connected to PubSub")
			go func() {
				err := c.WriteJSON(map[string]interface{}{
					"type": "LISTEN",
					"data": map[string]interface{}{
						"auth_token": t.JWT,
						"topics":     []string{fmt.Sprintf("channel-ext-v1.%s-%s-whisper-U%s", t.ChannelID, ClientID, t.ChannelID)},
					},
				})
				if err != nil {
					return
				}
				for {
					err = c.WriteJSON(map[string]string{"type": "PING"})
					if err != nil {
						return
					}
					time.Sleep(4 * time.Minute)
				}
			}()
			go func() {
				for {
					var d map[string]interface{}
					var m *msg
					err := c.ReadJSON(&d)
					if err != nil {
						return
					}
					if data, ok := d["data"].(map[string]interface{}); d["type"] == "MESSAGE" && ok {
						if message, ok := data["message"].(string); ok {
							if err := json.Unmarshal([]byte(message), &d); err == nil {
								if content, ok := d["content"].([]interface{}); ok && len(content) > 0 {
									for _, c := range content {
										if cc, ok := c.(string); ok {
											if err := json.Unmarshal([]byte(cc), &m); err == nil {
												ch <- m
											}
										}
									}
								}
							}
						}
					}
				}
			}()
		}
	}
}
