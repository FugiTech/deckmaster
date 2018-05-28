package main

import (
	"fmt"
	"sort"
	"time"

	. "github.com/fugiman/deckmaster/client/types"
)

func (svc *service) updater() error {
	var gameState BroadcastMessage
	gameObjects := map[int]GameObject{}
	seatID := 0

	for m := range svc.messageChannel {
		switch m := m.(type) {
		case *GREMessage:
			if m.GameStateMessage.Type == "GameStateType_Full" {
				gameState = BroadcastMessage{}
				gameObjects = map[int]GameObject{}
				seatID = m.SystemSeatIDs[0]
			}

			for _, object := range m.GameStateMessage.GameObjects {
				gameObjects[object.InstanceID] = object
			}
			for _, instanceID := range m.GameStateMessage.DiffDeletedInstanceIDs {
				delete(gameObjects, instanceID)
			}

			for _, zone := range m.GameStateMessage.Zones {
				lands := []int{}
				creatures := []int{}
				other := []int{}
				opp_lands := []int{}
				opp_creatures := []int{}
				opp_other := []int{}

				for _, instanceID := range zone.ObjectInstanceIDs {
					o, ok := gameObjects[instanceID]
					switch {
					case !ok:
						// Skip it
					case o.ControllerSeatID == seatID && contains(o.CardTypes, "CardType_Land"):
						lands = uniqueAppend(lands, o.GrpID)
					case o.ControllerSeatID == seatID && contains(o.CardTypes, "CardType_Creature"):
						creatures = uniqueAppend(creatures, o.GrpID)
					case o.ControllerSeatID == seatID:
						other = uniqueAppend(other, o.GrpID)
					case o.ControllerSeatID != seatID && contains(o.CardTypes, "CardType_Land"):
						opp_lands = uniqueAppend(opp_lands, o.GrpID)
					case o.ControllerSeatID != seatID && contains(o.CardTypes, "CardType_Creature"):
						opp_creatures = uniqueAppend(opp_creatures, o.GrpID)
					case o.ControllerSeatID != seatID:
						opp_other = uniqueAppend(opp_other, o.GrpID)
					}
				}

				PlayerCards := append(append(append([]int{}, lands...), creatures...), other...)
				OpponentCards := append(append(append([]int{}, opp_lands...), opp_creatures...), opp_other...)
				switch zone.ZoneID {
				case 28: // The ENTIRE battlefield
					gameState.PlayerLands = lands
					gameState.PlayerCreatures = creatures
					gameState.PlayerPermanents = other
					gameState.OpponentLands = opp_lands
					gameState.OpponentCreatures = opp_creatures
					gameState.OpponentPermanents = opp_other
				case 29:
					gameState.PlayerExile = PlayerCards
					gameState.OpponentExile = OpponentCards
				case 31:
					if seatID == 1 {
						gameState.PlayerHand = PlayerCards
					} else {
						gameState.OpponentHand = OpponentCards
					}
				case 33:
					if seatID == 1 {
						gameState.PlayerGraveyard = PlayerCards
					} else {
						gameState.OpponentGraveyard = OpponentCards
					}
				case 35:
					if seatID == 1 {
						gameState.OpponentHand = OpponentCards
					} else {
						gameState.PlayerHand = PlayerCards
					}
				case 37:
					if seatID == 1 {
						gameState.OpponentGraveyard = OpponentCards
					} else {
						gameState.PlayerGraveyard = PlayerCards
					}
				}
			}

			if m.Type == "GREMessageType_IntermissionReq" {
				gameState = BroadcastMessage{}
				gameObjects = map[int]GameObject{}
				gameState.Reset = true
			}

		case *DraftMessage:
			gameState.DraftPack = m.DraftPack
			gameState.PickedCards = m.PickedCards
			sort.SliceStable(gameState.DraftPack, func(i, j int) bool {
				a, b := AllCards[gameState.DraftPack[i]], AllCards[gameState.DraftPack[j]]
				return a.RarityRank() > b.RarityRank() ||
					(a.RarityRank() == b.RarityRank() && a.ColorRank() > b.ColorRank()) ||
					(a.RarityRank() == b.RarityRank() && a.ColorRank() == b.ColorRank() && a.CMC < b.CMC) ||
					(a.RarityRank() == b.RarityRank() && a.ColorRank() == b.ColorRank() && a.CMC == b.CMC && a.Name < b.Name)
			})
			if m.DraftPack == nil {
				gameState.PickedCards = nil
			}
		}

		gameState.Zones = []Zone{
			Zone{Cards: gameState.PlayerHand, X: "30%", Y: "86%", H: "14%", W: "40%"},
			Zone{Cards: gameState.PlayerLands, X: "10%", Y: "65%", H: "15%", W: "36%"},
			Zone{Cards: gameState.PlayerPermanents, X: "54%", Y: "65%", H: "15%", W: "36%"},
			Zone{Cards: gameState.PlayerCreatures, X: "10%", Y: "47%", H: "18%", W: "80%"},
			Zone{Cards: gameState.OpponentHand, X: "30%", Y: "0%", H: "10%", W: "40%"},
			Zone{Cards: gameState.OpponentLands, X: "10%", Y: "14%", H: "10%", W: "37%"},
			Zone{Cards: gameState.OpponentPermanents, X: "53%", Y: "14%", H: "10%", W: "37%"},
			Zone{Cards: gameState.OpponentCreatures, X: "10%", Y: "25%", H: "18%", W: "80%"},

			Zone{Trigger: "Player Deck", Vert: true, Cards: gameState.PlayerLibrary, X: "84.5%", Y: "170px", H: "calc(100% - 270px)", W: "15%"},
			Zone{Trigger: "Player Graveyard", Vert: true, Cards: gameState.PlayerGraveyard, X: "84.5%", Y: "170px", H: "calc(100% - 270px)", W: "15%"},
			Zone{Trigger: "Player Exile", Vert: true, Cards: gameState.PlayerExile, X: "84.5%", Y: "170px", H: "calc(100% - 270px)", W: "15%"},
			Zone{Trigger: "Opponent Deck", Vert: true, Cards: gameState.OpponentLibrary, X: "84.5%", Y: "170px", H: "calc(100% - 270px)", W: "15%"},
			Zone{Trigger: "Opponent Graveyard", Vert: true, Cards: gameState.OpponentGraveyard, X: "84.5%", Y: "170px", H: "calc(100% - 270px)", W: "15%"},
			Zone{Trigger: "Opponent Exile", Vert: true, Cards: gameState.OpponentExile, X: "84.5%", Y: "170px", H: "calc(100% - 270px)", W: "15%"},

			Zone{Vert: true, Cards: gameState.PickedCards, X: "78.5%", Y: "16%", H: "74%", W: "21%"},
		}
		for idx, card := range gameState.DraftPack {
			gameState.Zones = append(gameState.Zones, Zone{Cards: []int{card}, H: "25%", W: "10.5%",
				X: fmt.Sprintf("%0.1f%%", 15.0+(10.5*float64(idx%5))),
				Y: fmt.Sprintf("%0.1f%%", 18.5+(26.0*float64(idx/5))),
			})
		}
		gameState.Triggers = []Trigger{
			Trigger{ID: "Player Deck", Name: "Deck", CardCount: len(gameState.PlayerLibrary), X: "9%", Y: "83%", H: "16%", W: "7%"},
			Trigger{ID: "Player Graveyard", Name: "Graveyard", CardCount: len(gameState.PlayerGraveyard), X: "2%", Y: "83%", H: "16%", W: "7%"},
			Trigger{ID: "Player Exile", Name: "Exile", CardCount: len(gameState.PlayerExile), X: "16%", Y: "83%", H: "16%", W: "7%"},
			Trigger{ID: "Opponent Deck", Name: "Deck", CardCount: len(gameState.OpponentLibrary), X: "71.3%", Y: "5%", H: "12%", W: "5%"},
			Trigger{ID: "Opponent Graveyard", Name: "Graveyard", CardCount: len(gameState.OpponentGraveyard), X: "76.3%", Y: "5%", H: "12%", W: "5%"},
			Trigger{ID: "Opponent Exile", Name: "Exile", CardCount: len(gameState.OpponentExile), X: "66.3%", Y: "5%", H: "12%", W: "5%"},
		}
		gameState.DoubleSided = map[int]bool{}
		for _, zone := range gameState.Zones {
			for _, card := range zone.Cards {
				if AllCards[card].TwoSided {
					gameState.DoubleSided[card] = true
				}
			}
		}
		gameState.UpdatedAt = time.Now()
		svc.globalGameState.Store(gameState)
	}
	return nil
}

func uniqueAppend(s []int, v int) []int {
	for _, vv := range s {
		if v == vv {
			return s
		}
	}
	return append(s, v)
}
