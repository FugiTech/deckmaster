package main

func (svc *service) updater() error {
	var gameState GameState
	gameObjects := map[int]GameObject{}
	for m := range svc.messageChannel {
		if m.GameStateMessage.Type == "GameStateType_Full" {
			gameState = GameState{}
			gameObjects = map[int]GameObject{}
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
				case o.ControllerSeatID == 1 && contains(o.CardTypes, "CardType_Land"):
					lands = append(lands, o.GrpID)
				case o.ControllerSeatID == 1 && contains(o.CardTypes, "CardType_Creature"):
					creatures = append(creatures, o.GrpID)
				case o.ControllerSeatID == 1:
					other = append(other, o.GrpID)
				case o.ControllerSeatID == 2 && contains(o.CardTypes, "CardType_Land"):
					opp_lands = append(opp_lands, o.GrpID)
				case o.ControllerSeatID == 2 && contains(o.CardTypes, "CardType_Creature"):
					opp_creatures = append(opp_creatures, o.GrpID)
				case o.ControllerSeatID == 2:
					opp_other = append(opp_other, o.GrpID)
				}
			}
			switch zone.ZoneID {
			case 31:
				gameState.PlayerHand = nil
				gameState.PlayerHand = append(gameState.PlayerHand, lands...)
				gameState.PlayerHand = append(gameState.PlayerHand, creatures...)
				gameState.PlayerHand = append(gameState.PlayerHand, other...)
			case 35:
				gameState.OpponentHand = nil
				gameState.OpponentHand = append(gameState.OpponentHand, opp_lands...)
				gameState.OpponentHand = append(gameState.OpponentHand, opp_creatures...)
				gameState.OpponentHand = append(gameState.OpponentHand, opp_other...)
			case 28: // The ENTIRE battlefield
				gameState.PlayerLands = lands
				gameState.PlayerCreatures = creatures
				gameState.PlayerPermanents = other
				gameState.OpponentLands = opp_lands
				gameState.OpponentCreatures = opp_creatures
				gameState.OpponentPermanents = opp_other
			}
		}

		svc.globalGameState.Store(gameState)
	}
	return nil
}
