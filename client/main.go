package main // import "github.com/fugiman/deckmaster"

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sync/atomic"
	"time"

	_ "./statik"

	"github.com/hpcloud/tail"
	"github.com/rakyll/statik/fs"
	"github.com/zserge/webview"
	"golang.org/x/sync/errgroup"
)

var (
	window          webview.WebView
	logger          *log.Logger
	globalGameState atomic.Value
)

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	logFile, err := os.Create("deckmaster.log")
	if err != nil {
		panic(err)
	}
	logger = log.New(logFile, "", log.LstdFlags|log.Lshortfile)

	statikFS, err := fs.New()
	if err != nil {
		logger.Println("error loading statik filesystem:", err)
		return
	}
	http.Handle("/", http.FileServer(statikFS))
	http.Handle("/ws", http.HandlerFunc(handleWS))

	outputLogLocation := filepath.Join(os.Getenv("APPDATA"), "..", "LocalLow", "Wizards Of The Coast", "MTGA", "output_log.txt")
	outputChannel := make(chan *GREMessage, 100)
	reader, writer, err := os.Pipe()
	if err != nil {
		logger.Println("error making pipe:", err)
		return
	}

	eg, ctx := errgroup.WithContext(ctx)

	eg.Go(func() error {
		server := http.Server{
			Addr:     "127.0.0.1:22223",
			ErrorLog: logger,
		}
		eg.Go(func() error {
			<-ctx.Done()
			return server.Close()
		})
		return server.ListenAndServe()
	})

	eg.Go(func() error {
		window = webview.New(webview.Settings{
			Title:                  "Deckmaster: MTG Arena Overlay",
			URL:                    "http://localhost:22223",
			Width:                  400,
			Height:                 200,
			Resizable:              false,
			ExternalInvokeCallback: invokeCallback,
		})
		if window == nil {
			return errors.New("Failed to create window")
		}
		window.Run()
		return errors.New("window closed")
	})

	eg.Go(func() error {
		t, err := tail.TailFile(outputLogLocation, tail.Config{
			ReOpen: true,
			Poll:   true,
			Follow: true,
			Logger: logger,
		})
		if err != nil {
			return err
		}

		for {
			select {
			case line := <-t.Lines:
				writer.WriteString(line.Text + "\n")
			case <-ctx.Done():
				t.Stop()
				break
			}
		}

		return t.Wait()
	})

	eg.Go(func() error {
		defer close(outputChannel)

		bufreader := bufio.NewReader(reader)
		processor := &Processor{
			ctx:       ctx,
			reader:    bufreader,
			rawReader: reader,
		}

		for {
			// Step 1: Find "Sent Text Message" in the log
			// if err = processor.SkipUntil("Sent Text Message"); err != nil {
			// 	return err
			// }

			// Step 2: Find the { that starts the JSON blob, and then mark it unread
			if err = processor.SkipUntil("{"); err != nil {
				return err
			}
			bufreader.UnreadByte()

			// Step 3: Read the json until \r\n\r\n
			jsonData, err := processor.ReadUntil("}\r\n\r\n")
			if err != nil {
				return err
			}

			// Step 4: Decode the json into a message and send it along
			var m *Message
			err = json.Unmarshal(jsonData, &m)
			if err == nil {
				for _, mes := range m.GREToClientEvent.GREToClientMessages {
					if mes.Type == "GREMessageType_GameStateMessage" {
						outputChannel <- mes
					}
				}
			} else {
				logger.Println("JSON decode error:", err)
				logger.Println("JSON data:", string(jsonData))
			}
		}
	})

	eg.Go(func() error {
		var gameState GameState
		idMapping := map[int]int{}
		for m := range outputChannel {
			if m.GameStateMessage.Type == "GameStateType_Full" {
				gameState = GameState{}
				idMapping = map[int]int{}
			}

			for _, object := range m.GameStateMessage.GameObjects {
				idMapping[object.InstanceID] = object.GrpID
			}
			for _, instanceID := range m.GameStateMessage.DiffDeletedInstanceIDs {
				delete(idMapping, instanceID)
			}

			for _, zone := range m.GameStateMessage.Zones {
				cards := []int{}
				for _, instanceID := range zone.ObjectInstanceIDs {
					cards = append(cards, idMapping[instanceID])
				}
				switch zone.ZoneID {
				case 31: // Player's hand
					gameState.PlayerHand = cards
				}
			}

			globalGameState.Store(gameState)
		}
		return nil
	})

	eg.Go(func() error {
		timer := time.NewTicker(time.Second)
		defer timer.Stop()
		for {
			select {
			case <-ctx.Done():
				break
			case <-timer.C:
				gs, _ := globalGameState.Load().(GameState)
				body, err := json.Marshal(gs)
				if err == nil {
					broadcaster.Send(body)
				}
			}
		}
		return nil
	})

	err = eg.Wait()
	if err != nil {
		logger.Println(err)
	}
}

func invokeCallback(w webview.WebView, data string) {

}

type Message struct {
	GREToClientEvent struct {
		GREToClientMessages []*GREMessage
	}
}

type GREMessage struct {
	Type             string
	GameStateMessage struct {
		Type  string
		Zones []struct {
			ZoneID            int
			ObjectInstanceIDs []int
		}
		GameObjects []struct {
			InstanceID int
			GrpID      int
		}
		DiffDeletedInstanceIDs []int
	}
}

type GameState struct {
	PlayerHand []int
}

type Processor struct {
	ctx       context.Context
	reader    *bufio.Reader
	rawReader *os.File
}

func (p *Processor) ReadUntil(delim string) ([]byte, error) {
	return p.processUntil(delim, false)
}

func (p *Processor) SkipUntil(delim string) error {
	_, err := p.processUntil(delim, true)
	return err
}

func (p *Processor) processUntil(delim string, skip bool) ([]byte, error) {
	firstByte, remainder := delim[0], ([]byte(delim))[1:]
	var result []byte

	for {
		if p.ctx.Err() != nil {
			return nil, p.ctx.Err()
		}
		p.rawReader.SetDeadline(time.Now().Add(1 * time.Second))
		data, err := p.reader.ReadBytes(firstByte)
		if err == io.EOF {
			time.Sleep(100 * time.Millisecond)
		}
		if err == nil {
			if !skip {
				result = append(result, data...)
			}
			success := true
			for _, char := range remainder {
				var b byte
				for {
					p.rawReader.SetDeadline(time.Now().Add(1 * time.Second))
					b, err = p.reader.ReadByte()
					if err != io.EOF {
						break
					}
					time.Sleep(100 * time.Millisecond)
				}

				if err != nil || b != char {
					if b == firstByte {
						p.reader.UnreadByte()
					} else if !skip {
						result = append(result, b)
					}
					success = false
					break
				} else if !skip {
					result = append(result, b)
				}
			}
			if success {
				break
			}
		}
	}

	return result, nil
}
