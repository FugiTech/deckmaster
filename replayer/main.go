package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"strconv"

	dmTypes "github.com/fugiman/deckmaster/client/types"
)

var inputFile = flag.String("f", "", "Input file to replay")

func main() {
	flag.Parse()
	if *inputFile == "" {
		flag.PrintDefaults()
		os.Exit(1)
	}

	f, err := os.Open(*inputFile)
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

	var messages []interface{}

	var buf bytes.Buffer
	for {
		input.WriteTo(&buf)
		_, err := buf.ReadBytes('{')
		if err == io.EOF {
			break
		}
		buf.UnreadByte()

		var m dmTypes.Message
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

		for _, mes := range m.GREToClientEvent.GREToClientMessages {
			if mes.Type == "GREMessageType_GameStateMessage" ||
				mes.Type == "GREMessageType_IntermissionReq" {
				messages = append(messages, mes)
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
			messages = append(messages, &dmTypes.DraftMessage{
				DraftPack:   draftPack,
				PickedCards: pickedCards,
			})
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
		msg := &dmTypes.Message{}
		switch m := m.(type) {
		case *dmTypes.GREMessage:
			msg.GREToClientEvent.GREToClientMessages = []*dmTypes.GREMessage{m}
		case *dmTypes.DraftMessage:
			for _, c := range m.DraftPack {
				msg.DraftPack = append(msg.DraftPack, fmt.Sprint(c))
			}
			for _, c := range m.PickedCards {
				msg.PickedCards = append(msg.PickedCards, fmt.Sprint(c))
			}
		}
		enc.Encode(msg)
	}
}
