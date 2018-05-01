package main

import (
	"context"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var broadcaster = &Broadcaster{
	ch: make(chan []byte, 256),
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

func handleWS(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	for msg := range broadcaster.Subscribe(r.Context()) {
		if err := conn.WriteMessage(websocket.TextMessage, msg); err != nil {
			return
		}
	}
}

type Broadcaster struct {
	ch              chan []byte
	subscribers     []chan []byte
	subscribersLock sync.Mutex
}

func (b *Broadcaster) Send(msg []byte) {
	b.ch <- msg
}

func (b *Broadcaster) Subscribe(ctx context.Context) <-chan []byte {
	ch := make(chan []byte, 10)
	b.subscribersLock.Lock()
	b.subscribers = append(b.subscribers, ch)
	b.subscribersLock.Unlock()

	go func() {
		<-ctx.Done()
		b.subscribersLock.Lock()
		for i, c := range b.subscribers {
			if c == ch {
				b.subscribers[i] = b.subscribers[len(b.subscribers)-1]
				b.subscribers[len(b.subscribers)-1] = nil
				b.subscribers = b.subscribers[:len(b.subscribers)-1]
				break
			}
		}
		b.subscribersLock.Unlock()
	}()

	return ch
}

func (b *Broadcaster) Run(ctx context.Context) error {
	for {
		select {
		case <-ctx.Done():
			return nil
		case msg := <-b.ch:
			b.subscribersLock.Lock()
			for _, ch := range b.subscribers {
				ch <- msg
			}
			b.subscribersLock.Unlock()
		}
	}
}
