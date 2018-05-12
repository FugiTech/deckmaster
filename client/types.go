package main

import (
	"bytes"
	"context"
	"log"
	"sync/atomic"
	"time"
)

type service struct {
	ctx             context.Context
	logger          *log.Logger
	globalGameState atomic.Value
	token           atomic.Value
	pipe            bytes.Buffer
	messageChannel  chan *GREMessage
	pubsubStatus    atomic.Value
	arenaStatus     atomic.Value
}

type Token struct {
	JWT       string
	ChannelID string
	Expires   time.Time
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
		GameObjects            []GameObject
		DiffDeletedInstanceIDs []int
	}
}

type GameObject struct {
	InstanceID       int
	GrpID            int
	ControllerSeatID int
	CardTypes        []string
}

type GameState struct {
	PlayerHand         []int
	PlayerLands        []int
	PlayerCreatures    []int
	PlayerPermanents   []int
	OpponentHand       []int
	OpponentLands      []int
	OpponentCreatures  []int
	OpponentPermanents []int
	updatedAt          time.Time
}
