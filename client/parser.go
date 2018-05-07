package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"io"
	"time"
)

func (svc *service) parser() error {
	defer func() { close(svc.messageChannel) }()

	bufreader := bufio.NewReader(svc.reader)

	var buf bytes.Buffer
	for {
		if svc.ctx.Err() != nil {
			return svc.ctx.Err()
		}

		svc.reader.SetReadDeadline(time.Now().Add(1 * time.Second))
		bufreader.WriteTo(&buf)
		_, err := buf.ReadBytes('{')
		if err == io.EOF {
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
			if mes.Type == "GREMessageType_GameStateMessage" {
				svc.messageChannel <- mes
			}
		}

		var newBuf bytes.Buffer
		newBuf.ReadFrom(dec.Buffered())
		newBuf.ReadFrom(&buf)
		buf = newBuf
	}
}
