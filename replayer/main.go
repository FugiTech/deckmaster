package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"io"
	"log"
	"os"
	"os/exec"
)

func main() {
	f, err := os.Open("test_log.txt")
	if err != nil {
		log.Println("input err", err)
		return
	}
	defer f.Close()
	input := bufio.NewReader(f)

	// logFile := path.Join(os.Getenv("APPDATA"), "..", "LocalLow", "Wizards Of The Coast", "MTGA", "output_log.txt")
	logFile := "/mnt/c/Users/fugi_000/AppData/LocalLow/Wizards Of The Coast/MTGA/output_log.txt"
	output, err := os.Create(logFile)
	if err != nil {
		log.Println("output err", err)
		return
	}
	defer output.Close()

	userInput := make([]byte, 1)
	// disable input buffering
	exec.Command("stty", "-F", "/dev/tty", "cbreak", "min", "1").Run()
	// do not display entered characters on the screen
	exec.Command("stty", "-F", "/dev/tty", "-echo").Run()
	// restore the echoing state when exiting
	defer exec.Command("stty", "-F", "/dev/tty", "echo").Run()

	var messages []*GREMessage

	var buf bytes.Buffer
	for {
		input.WriteTo(&buf)
		_, err := buf.ReadBytes('{')
		if err == io.EOF {
			break
		}
		buf.UnreadByte()

		var m Message
		dec := json.NewDecoder(&buf)
		err = dec.Decode(&m)
		if err != nil {
			log.Println("JSON decode error:", err)
			return
		}

		for _, mes := range m.GREToClientEvent.GREToClientMessages {
			if mes.Type == "GREMessageType_GameStateMessage" {
				messages = append(messages, mes)
			}
		}

		var newBuf bytes.Buffer
		newBuf.ReadFrom(dec.Buffered())
		newBuf.ReadFrom(&buf)
		buf = newBuf
	}

	log.Println("Ready for input...")
	enc := json.NewEncoder(output)
	for _, m := range messages {
		os.Stdin.Read(userInput)
		msg := &Message{}
		msg.GREToClientEvent.GREToClientMessages = []*GREMessage{m}
		enc.Encode(msg)
	}
}

type Message struct {
	GREToClientEvent struct {
		GREToClientMessages []*GREMessage
	}
}

type GREMessage struct {
	Type             string
	SystemSeatIDs    []int
	GameStateMessage struct {
		Type  string
		Zones []struct {
			ZoneID            int
			ObjectInstanceIDs []int
		}
		GameObjects            []GameObject
		DiffDeletedInstanceIDs []int
		GameInfo               struct {
			Stage string
		}
	}
}

type GameObject struct {
	InstanceID       int
	GrpID            int
	ControllerSeatID int
	CardTypes        []string
}
