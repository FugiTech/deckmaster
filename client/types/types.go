package types

import (
	"time"
)

type Token struct {
	JWT       string
	ChannelID string
	Expires   time.Time
}

type Message struct {
	// Used when in a game
	GREToClientEvent struct {
		GREToClientMessages []*GREMessage
	}
	// Used when drafting
	DraftPack   []string
	PickedCards []string
	// Used for detecting active deck
	CourseDeck *DeckMessage
	// Used to detect Arena launching
	Method string
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

type DraftMessage struct {
	DraftPack   []int
	PickedCards []int
}

type DeckMessage struct {
	Name       string
	DeckTileID int // Card ID for the cover of the deck
	MainDeck   []struct {
		ID       string
		Quantity int
	}
}

type GameLaunchMessage struct {
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
	PlayerLibrary      []int
	PlayerGraveyard    []int
	PlayerExile        []int
	OpponentHand       []int
	OpponentLands      []int
	OpponentCreatures  []int
	OpponentPermanents []int
	OpponentLibrary    []int
	OpponentGraveyard  []int
	OpponentExile      []int
	DraftPack          []int
	PickedCards        []int
	UpdatedAt          time.Time
}

type BroadcastMessage struct {
	GameState   // deprecated: remove after v0.0.2 is released
	Zones       []Zone
	Triggers    []Trigger
	Reset       bool // Used for whenever we clear all the data
	ActiveDeck  string
	DoubleSided map[int]bool
}

type Zone struct {
	Cards   []int
	Vert    bool // Whether to display the cards overlapping vertically
	Trigger string
	X       string
	Y       string
	H       string
	W       string
}

type Trigger struct {
	ID        string
	Name      string
	CardCount int
	X         string
	Y         string
	H         string
	W         string
}

type Card struct {
	ID        string
	Name      string
	Set       string
	SetNum    int
	Colors    string
	Rarity    string
	CMC       int
	DualSided bool
}

func (c Card) ColorRank() int {
	if c.CMC == 0 { // Hacky fix for lands
		return 0
	}
	switch c.Colors {
	case "W":
		return 7
	case "U":
		return 6
	case "B":
		return 5
	case "R":
		return 4
	case "G":
		return 3
	default:
		return 1
	case "":
		return 0
	}
}

func (c Card) RarityRank() int {
	switch c.Rarity {
	case "mythic":
		return 4
	case "rare":
		return 3
	case "uncommon":
		return 2
	case "common":
		return 1
	default:
		return 0
	}
}
