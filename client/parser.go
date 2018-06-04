package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"strconv"
	"time"

	. "github.com/fugiman/deckmaster/client/types"
)

func (svc *service) parser() error {
	defer func() { close(svc.messageChannel) }()

	time.Sleep(time.Second)

	lastRead := time.Now()
	var buf bytes.Buffer
	for {
		if svc.ctx.Err() != nil {
			return svc.ctx.Err()
		}

		delay := time.Since(lastRead).Truncate(time.Second)
		if delay >= 30*time.Second {
			svc.arenaStatus.Store(fmt.Sprintf("Log file hasn't updated in %s", delay))
		} else {
			svc.arenaStatus.Store("")
		}

		svc.pipeLock.Lock()
		io.Copy(&buf, &svc.pipe)
		svc.pipeLock.Unlock()
		_, err := buf.ReadBytes('{')
		if err != nil {
			time.Sleep(1 * time.Second)
			continue
		}
		buf.UnreadByte()

		var m Message
		dec := json.NewDecoder(&buf)
		err = dec.Decode(&m)
		if err != nil {
			time.Sleep(1 * time.Second)
		}

		lastRead = time.Now()
		for _, mes := range m.GREToClientEvent.GREToClientMessages {
			if mes.Type == "GREMessageType_GameStateMessage" ||
				mes.Type == "GREMessageType_IntermissionReq" {
				svc.messageChannel <- mes
			}
		}
		if m.DraftPack != nil || m.PickedCards != nil {
			var (
				draftPack   []int
				pickedCards []int
			)
			for _, c := range m.DraftPack {
				cc, _ := strconv.Atoi(c)
				draftPack = append(draftPack, cc)
			}
			for _, c := range m.PickedCards {
				cc, _ := strconv.Atoi(c)
				pickedCards = append(pickedCards, cc)
			}
			svc.messageChannel <- &DraftMessage{
				DraftPack:   draftPack,
				PickedCards: pickedCards,
			}
		}
		if m.CourseDeck != nil {
			svc.messageChannel <- m.CourseDeck
		}

		var newBuf bytes.Buffer
		newBuf.ReadFrom(dec.Buffered())
		newBuf.ReadFrom(&buf)
		buf = newBuf
	}
}
