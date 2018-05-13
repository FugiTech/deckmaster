package main

import "time"

func (svc *service) updater() error {
	var gameState GameState
	gameObjects := map[int]GameObject{}
	seatID := 0

	for m := range svc.messageChannel {
		if m.GameStateMessage.Type == "GameStateType_Full" {
			gameState = GameState{}
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
					lands = append(lands, o.GrpID)
				case o.ControllerSeatID == seatID && contains(o.CardTypes, "CardType_Creature"):
					creatures = append(creatures, o.GrpID)
				case o.ControllerSeatID == seatID:
					other = append(other, o.GrpID)
				case o.ControllerSeatID != seatID && contains(o.CardTypes, "CardType_Land"):
					opp_lands = append(opp_lands, o.GrpID)
				case o.ControllerSeatID != seatID && contains(o.CardTypes, "CardType_Creature"):
					opp_creatures = append(opp_creatures, o.GrpID)
				case o.ControllerSeatID != seatID:
					opp_other = append(opp_other, o.GrpID)
				}
			}

			PlayerHand := append(append(append([]int{}, lands...), creatures...), other...)
			OpponentHand := append(append(append([]int{}, opp_lands...), opp_creatures...), opp_other...)
			switch zone.ZoneID {
			case 31:
				if seatID == 1 {
					gameState.PlayerHand = PlayerHand
				} else {
					gameState.OpponentHand = OpponentHand
				}
			case 35:
				if seatID == 1 {
					gameState.OpponentHand = OpponentHand
				} else {
					gameState.PlayerHand = PlayerHand
				}
			case 28: // The ENTIRE battlefield
				gameState.PlayerLands = lands
				gameState.PlayerCreatures = creatures
				gameState.PlayerPermanents = other
				gameState.OpponentLands = opp_lands
				gameState.OpponentCreatures = opp_creatures
				gameState.OpponentPermanents = opp_other
			}
		}

		if m.Type == "GREMessageType_IntermissionReq" {
			gameState = GameState{}
			gameObjects = map[int]GameObject{}
		}

		gameState.updatedAt = time.Now()
		svc.globalGameState.Store(gameState)
	}
	return nil
}
