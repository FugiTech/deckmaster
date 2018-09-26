import _ from 'lodash'
import nanoid from 'nanoid'
import { captureException } from './vars'
import AllCards from './cards'

export default class Parser {
  constructor(store) {
    this.store = store
    this.buffer = ''
    this.timeout = null
    this.seatID = 0
    this.gameObjects = new Map()
    this.activeDeck = null
    this.defaultGameState = {
      player: {
        hand: [],
        lands: [],
        creatures: [],
        permanents: [],
        library: [],
        graveyard: [],
        exile: [],
      },
      opponent: {
        hand: [],
        lands: [],
        creatures: [],
        permanents: [],
        library: [],
        graveyard: [],
        exile: [],
      },
      attachments: {
        player: {},
        opponent: {},
      },
      draftPack: [],
      pickedCards: [],
    }
    this.gameState = _.cloneDeep(this.defaultGameState)
    this.enableExtension = _.throttle(
      () => {
        this.store.dispatch('enableExtension')
      },
      20000,
      { leading: true, trailing: false },
    )
  }

  parse(data) {
    if (data) {
      this.store.commit('statusUpdate', { logupdate: true })
      this.enableExtension()
      if (this.timeout) clearTimeout(this.timeout)
      this.timeout = setTimeout(() => {
        this.store.commit('statusUpdate', { logupdate: false })
        this.store.dispatch('disableExtension')
      }, 601000)
    }

    // Add the fresh data
    this.buffer += data

    // Trim off anything before the first {
    let start = this.buffer.indexOf('{')
    if (start === -1) {
      return
    }
    this.buffer = this.buffer.substring(start)

    // Try to extract a json object
    let end = this.buffer.length
    while (true) {
      try {
        let o = JSON.parse(this.buffer.substring(0, end))
        // If it worked, remove the data from the buffer, update game state, and then recurse
        this.buffer = this.buffer.substring(end)
        this.handle(o)
        this.parse('')
        return
      } catch (e) {
        let m // regex match
        if ((m = /Unexpected end of JSON input/.exec(e.message)) !== null) {
          return // We don't have enough data to do anything yet
        } else if ((m = /Unexpected .*? in JSON at position (\d+)/.exec(e.message)) !== null) {
          // We have too much data, update end
          end = +m[1]
        } else {
          console.log('Unexpected error parsing JSON!', e)
          captureException(e, {
            extra: { buffer: this.buffer.substring(0, 100) },
          })
          this.buffer = this.buffer.substring(1)
          this.parse('')
          return
        }
      }
    }
  }

  handle(o) {
    if ('greToClientEvent' in o) {
      o.greToClientEvent.greToClientMessages.forEach(m => {
        if (m.type === 'GREMessageType_GameStateMessage') {
          this.handleGameState(m)
        }
        if (m.type === 'GREMessageType_IntermissionReq') {
          this.handleIntermission()
        }
      })
    }
    if ('draftPack' in o || 'pickedCards' in o) {
      this.handleDraft(o)
    }
    if ('CourseDeck' in o) {
      this.handleDeck(o.CourseDeck)
    }
    if ('cardsOpened' in o) {
      this.handleBooster(o.cardsOpened)
    }
    if ('params' in o && o.params.messageName === 'Client.SceneChange') {
      this.handleIntermission()
    }
  }

  handleGameState(m) {
    if (m.gameStateMessage.type === 'GameStateType_Full') {
      this.handleIntermission()
      this.store.commit('statusUpdate', { gameongoing: true })
      this.seatID = m.systemSeatIds[0]
    }

    ;(m.gameStateMessage.gameObjects || []).forEach(o => {
      this.gameObjects.set(o.instanceId, o)
    })
    ;(m.gameStateMessage.diffDeletedInstanceIds || []).forEach(id => {
      this.gameObjects.delete(id)
    })

    let attachments = new Map()
    let attached = new Map()
    ;(m.gameStateMessage.annotations || []).forEach(o => {
      if (_.includes(o.type, 'AnnotationType_Attachment')) {
        o.affectedIds.forEach(victim => {
          let card = this.gameObjects.get(o.affectorId)
          let l = attachments.get(victim) || []
          l.push(card.grpId)
          attachments.set(victim, l)
          attached.set(o.affectorId, true)
        })
      }
    })
    ;(m.gameStateMessage.zones || []).forEach(zone => {
      let l = [],
        c = [],
        o = [],
        ol = [],
        oc = [],
        oo = [],
        a = {},
        oa = {}
      ;(zone.objectInstanceIds || []).forEach(id => {
        if (!this.gameObjects.has(id)) return
        if (attached.has(id)) return
        let card = this.gameObjects.get(id)
        if (card.controllerSeatId === this.seatID) {
          if (attachments.has(id)) {
            let counts = _.countBy([].concat(l, c, o))
            let key = `${card.grpId}:${counts[card.grpId] || 0}`
            a[key] = this.sort(attachments.get(id))
          }
          if (_.includes(card.cardTypes, 'CardType_Land')) {
            l.push(card.grpId)
          } else if (_.includes(card.cardTypes, 'CardType_Creature')) {
            c.push(card.grpId)
          } else {
            o.push(card.grpId)
          }
        } else {
          if (attachments.has(id)) {
            let counts = _.countBy([].concat(ol, oc, oo))
            let key = `${card.grpId}:${counts[card.grpId] || 0}`
            oa[key] = this.sort(attachments.get(id))
          }
          if (_.includes(card.cardTypes, 'CardType_Land')) {
            ol.push(card.grpId)
          } else if (_.includes(card.cardTypes, 'CardType_Creature')) {
            oc.push(card.grpId)
          } else {
            oo.push(card.grpId)
          }
        }
      })

      let playerCards = [].concat(l, c, o),
        opponentCards = [].concat(ol, oc, oo),
        playerHandZone = this.seatID === 1 ? 31 : 35,
        playerGraveyardZone = this.seatID === 1 ? 33 : 37,
        opponentHandZone = this.seatID === 1 ? 14 : 13,
        opponentGraveyardZone = this.seatID === 1 ? 37 : 33

      if (zone.zoneId === 28) {
        // Battlefield
        this.gameState.player.lands = this.sort(l)
        this.gameState.player.creatures = this.sort(c)
        this.gameState.player.permanents = this.sort(o)
        this.gameState.opponent.lands = this.sort(ol)
        this.gameState.opponent.creatures = this.sort(oc)
        this.gameState.opponent.permanents = this.sort(oo)
        this.gameState.attachments.player = a
        this.gameState.attachments.opponent = oa
      } else if (zone.zoneId === 29) {
        // Exile
        this.gameState.player.exile = this.sort(playerCards)
        this.gameState.opponent.exile = this.sort(opponentCards)
      } else if (zone.zoneId === playerHandZone) {
        this.gameState.player.hand = this.sort(playerCards)
      } else if (zone.zoneId === playerGraveyardZone) {
        this.gameState.player.graveyard = this.sort(playerCards)
      } else if (zone.zoneId === opponentHandZone) {
        this.gameState.opponent.hand = this.sort(opponentCards)
      } else if (zone.zoneId === opponentGraveyardZone) {
        this.gameState.opponent.graveyard = this.sort(opponentCards)
      }
    })

    // Reset the library and recalculate
    if (this.activeDeck) {
      this.gameState.player.library = []
      let library = new Map()
      this.activeDeck.mainDeck.forEach(c => {
        library.set(+c.id, c.quantity)
      })
      for (let z of Object.values(this.gameState.player)) {
        z.forEach(card => {
          library.set(card, library.get(card) - 1)
        })
      }
      for (let [card, quantity] of library) {
        for (let i = 0; i < quantity; i++) this.gameState.player.library.push(card)
      }
      this.gameState.player.library = this.sort(this.gameState.player.library)
    }

    this.updateStore()
  }

  handleIntermission() {
    this.gameObjects.clear()
    this.gameState = _.cloneDeep(this.defaultGameState)
    this.updateStore()
    this.store.commit('statusUpdate', { gameongoing: false })
  }

  handleDraft(m) {
    if (!m.draftPack) {
      this.handleIntermission()
      return
    }

    this.store.commit('statusUpdate', { gameongoing: true })
    this.gameState.draftPack = this.sort(m.draftPack || [])
    this.gameState.pickedCards = this.sort(m.pickedCards || [])
    this.updateStore(nanoid())
  }

  handleDeck(m) {
    this.activeDeck = m
  }

  handleBooster(m) {
    /* m = [
  {
    "grpId": 67786,
    "addedToInventory": true,
    "vaultProgress": 0.0
  },
  {
    "grpId": 67752,
    "addedToInventory": true,
    "vaultProgress": 0.0
  },
  {
    "grpId": 68070,
    "addedToInventory": false,
    "vaultProgress": 0.1
  },
  {
    "grpId": 9,
    "addedToInventory": true,
    "vaultProgress": 0.0
  },
  {
    "grpId": 67840,
    "addedToInventory": true,
    "vaultProgress": 0.0
  },
  {
    "grpId": 67912,
    "addedToInventory": true,
    "vaultProgress": 0.0
  },
  {
    "grpId": 68014,
    "addedToInventory": true,
    "vaultProgress": 0.0
  },
  {
    "grpId": 67940,
    "addedToInventory": true,
    "vaultProgress": 0.0
  }
] */
  }

  sort(cards) {
    const lands = ['Plains', 'Island', 'Swamp', 'Mountain', 'Forest']
    const duallands = [
      // M19
      'Cinder Barrens',
      'Forsaken Sanctuary',
      'Foul Orchard',
      'Highland Lake',
      'Meandering River',
      'Stone Quarry',
      'Submerged Boneyard',
      'Timber Gorge',
      'Tranquil Expanse',
      'Woodland Stream',
      // GRN
      'Boros Guildgate',
      'Dimir Guildgate',
      'Golgari Guildgate',
      'Izzet Guildgate',
      'Selesnya Guildgate',
    ]
    const rarityOrder = ['mythic', 'rare', 'uncommon', 'common', 'dualland', 'land']
    const colorOrder = [1, 2, 4, 8, 16, 3, 5, 6, 10, 12, 20, 24, 9, 17, 18, 7, 14, 28, 25, 19, 13, 26, 21, 11, 22, 15, 30, 29, 27, 23, 31, 0]
    // order of sorts goes from least important -> most important
    return _.chain(cards)
      .map(c => +c)
      .sortBy(c => AllCards.get(c).name)
      .sortBy(c => AllCards.get(c).cmc)
      .sortBy(c => {
        let d = AllCards.get(c)
        let v = 0
        if (_.includes(d.color, 'W')) v |= 1
        if (_.includes(d.color, 'U')) v |= 2
        if (_.includes(d.color, 'B')) v |= 4
        if (_.includes(d.color, 'R')) v |= 8
        if (_.includes(d.color, 'G')) v |= 16
        return _.indexOf(colorOrder, v)
      })
      .sortBy(c => {
        let d = AllCards.get(c)
        let rarity = d.rarity
        if (_.includes(duallands, d.name)) rarity = 'dualland'
        if (_.includes(lands, d.name)) rarity = 'land'
        return _.indexOf(rarityOrder, rarity)
      })
      .value()
  }

  attach(cards, attachments) {
    let last = -1,
      cnt = 0,
      a = {}
    cards.forEach((c, i) => {
      if (last === c) {
        cnt++
      } else {
        last = c
        cnt = 0
      }
      let key = `${c}:${cnt}`
      if (key in attachments) {
        a[i] = attachments[key]
      }
    })
    return { Cards: cards, Attachments: a }
  }

  updateStore(draftID) {
    let zones = [
      { Name: 'Player Hand', Cards: this.gameState.player.hand, X: '30%', Y: '86%', H: '14%', W: '40%' },
      Object.assign({ Name: 'Player Creatures', X: '10%', Y: '47%', H: '18%', W: '80%' }, this.attach(this.gameState.player.creatures, this.gameState.attachments.player)),
      Object.assign({ Name: 'Player Permanents', X: '54%', Y: '65%', H: '15%', W: '36%' }, this.attach(this.gameState.player.permanents, this.gameState.attachments.player)),
      { Trigger: 'Player Exile', Vert: true, Cards: this.gameState.player.exile, X: '84.5%', Y: '170px', H: 'calc(100% - 270px)', W: '15%' },
      { Trigger: 'Player Graveyard', Vert: true, Cards: this.gameState.player.graveyard, X: '84.5%', Y: '170px', H: 'calc(100% - 270px)', W: '15%' },
      { Trigger: 'Player Deck', Vert: true, Cards: this.gameState.player.library, X: '84.5%', Y: '170px', H: 'calc(100% - 270px)', W: '15%' },
      Object.assign({ Name: 'Player Lands', X: '10%', Y: '65%', H: '15%', W: '36%' }, this.attach(this.gameState.player.lands, this.gameState.attachments.player)),

      { Name: 'Opponent Hand', Cards: this.gameState.opponent.hand, X: '30%', Y: '0%', H: '10%', W: '40%' },
      Object.assign({ Name: 'Opponent Creatures', X: '10%', Y: '25%', H: '18%', W: '80%' }, this.attach(this.gameState.opponent.creatures, this.gameState.attachments.opponent)),
      Object.assign({ Name: 'Opponent Permanents', X: '53%', Y: '14%', H: '10%', W: '37%' }, this.attach(this.gameState.opponent.permanents, this.gameState.attachments.opponent)),
      { Trigger: 'Opponent Exile', Vert: true, Cards: this.gameState.opponent.exile, X: '84.5%', Y: '170px', H: 'calc(100% - 270px)', W: '15%' },
      { Trigger: 'Opponent Graveyard', Vert: true, Cards: this.gameState.opponent.graveyard, X: '84.5%', Y: '170px', H: 'calc(100% - 270px)', W: '15%' },
      { Trigger: 'Opponent Deck', Vert: true, Cards: this.gameState.opponent.library, X: '84.5%', Y: '170px', H: 'calc(100% - 270px)', W: '15%' },
      Object.assign({ Name: 'Opponent Lands', X: '10%', Y: '14%', H: '10%', W: '37%' }, this.attach(this.gameState.opponent.lands, this.gameState.attachments.opponent)),

      { Name: 'Draft Deck', Vert: true, Cards: this.gameState.pickedCards, X: '78.5%', Y: '16%', H: '74%', W: '21%' },
    ]
    this.gameState.draftPack.forEach((card, i) => {
      zones.push({ Name: 'Draft Pack', Voteable: true, Cards: [card], H: '26%', W: '11%', X: 14.8 + 10.5 * (i % 5) + '%', Y: 18.2 + 26.0 * Math.floor(i / 5) + '%' })
    })
    let triggers = [
      { ID: 'Player Deck', Name: 'Deck', CardCount: this.gameState.player.library.length, X: '9%', Y: '83%', H: '16%', W: '7%' },
      { ID: 'Player Graveyard', Name: 'Graveyard', CardCount: this.gameState.player.graveyard.length, X: '2%', Y: '83%', H: '16%', W: '7%' },
      { ID: 'Player Exile', Name: 'Exile', CardCount: this.gameState.player.exile.length, X: '16%', Y: '83%', H: '16%', W: '7%' },
      { ID: 'Opponent Deck', Name: 'Deck', CardCount: this.gameState.opponent.library.length, X: '71.3%', Y: '5%', H: '12%', W: '5%' },
      { ID: 'Opponent Graveyard', Name: 'Graveyard', CardCount: this.gameState.opponent.graveyard.length, X: '76.3%', Y: '5%', H: '12%', W: '5%' },
      { ID: 'Opponent Exile', Name: 'Exile', CardCount: this.gameState.opponent.exile.length, X: '66.3%', Y: '5%', H: '12%', W: '5%' },
    ]
    let doubleSided = {}
    zones.forEach(z => {
      z.Cards.forEach(c => {
        if (AllCards.has(c) && AllCards.get(c).dualSided) doubleSided[c] = true
      })
    })

    this.store.commit('gameState', { zones, triggers, doubleSided, draftID })
  }
}
