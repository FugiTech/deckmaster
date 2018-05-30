package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"time"

	. "github.com/fugiman/deckmaster/client/types"
)

func (svc *service) votingLoop() error {
	timer := time.NewTicker(1 * time.Second)
	defer timer.Stop()

	type elem struct {
		Name  string
		Card  int
		Votes int
	}

	for {
		select {
		case <-svc.ctx.Done():
			return svc.ctx.Err()

		case <-timer.C:

			token, ok := svc.token.Load().(Token)
			if !ok {
				continue
			}
			if token.Expires.Before(time.Now()) {
				continue
			}

			resp, err := http.Get("https://deckmaster-api.fugi.io/vote_results?token=" + token.JWT)
			if err != nil {
				svc.logger.Println("Error getting vote results:", err)
				continue
			}

			var d []*elem
			err = json.NewDecoder(resp.Body).Decode(&d)
			resp.Body.Close()
			if err != nil {
				svc.logger.Println("Error decoding vote results:", err)
				continue
			}

			for _, e := range d {
				if c, ok := AllCards[e.Card]; ok {
					e.Name = c.Name
				} else {
					e.Name = fmt.Sprintf("Card #%d", e.Card)
				}
			}

			sort.Slice(d, func(i, j int) bool {
				return d[i].Votes > d[j].Votes
			})

			svc.voting.Store(d)

		}
	}
}
