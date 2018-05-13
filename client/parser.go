package main

import (
	"bytes"
	"encoding/json"
	"time"
)

func (svc *service) parser() error {
	defer func() { close(svc.messageChannel) }()

	var buf bytes.Buffer
	for {
		if svc.ctx.Err() != nil {
			return svc.ctx.Err()
		}

		buf.ReadFrom(&svc.pipe)
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
			svc.logger.Println("JSON decode error:", err)
			return err
		}

		for _, mes := range m.GREToClientEvent.GREToClientMessages {
			if mes.Type == "GREMessageType_GameStateMessage" ||
				mes.Type == "GREMessageType_IntermissionReq" {
				svc.messageChannel <- mes
			}
		}

		var newBuf bytes.Buffer
		newBuf.ReadFrom(dec.Buffered())
		newBuf.ReadFrom(&buf)
		buf = newBuf
	}
}
