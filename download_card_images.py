with open('mtga_tracker/util.py', 'w') as f:
    f.write('''
import app.models.set as set
import app.set_data.xln as xln
import app.set_data.rix as rix
import app.set_data.hou as hou
import app.set_data.akh as akh
import app.set_data.dom as dom
import app.set_data.weird as weird

all_mtga_cards = set.Pool.from_sets("mtga_cards",
                                    sets=[rix.RivalsOfIxalan, xln.Ixalan, hou.HourOfDevastation, akh.Amonkhet,
                                          dom.Dominaria, weird.WeirdLands])
''')


import sys, os, time
sys.path.append("./mtga_tracker")
from util import all_mtga_cards
from app.models.card import Card
from urllib.request import urlretrieve

all_mtga_cards.cards.append(Card("warrior_token", "Warrior Token", [], [], "Token Creature", "", "TAKH", 17, 66580))

for card in all_mtga_cards.cards:
    if card.set_number < 0:
        continue
    folder = "cards/{:02d}".format(card.mtga_id%20)
    if not os.path.exists(folder):
        os.makedirs(folder)

    url = "https://img.scryfall.com/cards/normal/en/{}/{:d}.jpg".format(card.set.lower(), card.set_number)
    path = "{}/{:d}.jpg".format(folder,card.mtga_id)
    if not os.path.exists(path):
        print("{} -> {}".format(url, path))
        try:
            urlretrieve(url, path)
        except:
            url = "https://img.scryfall.com/cards/normal/en/{}/{:d}a.jpg".format(card.set.lower(), card.set_number)
            try:
                urlretrieve(url, path)
            except:
                pass

    url = "https://img.scryfall.com/cards/normal/en/{}/{:d}b.jpg".format(card.set.lower(), card.set_number)
    path = "{}/{:d}_back.jpg".format(folder,card.mtga_id)
    if not os.path.exists(path):
        print("{} -> {}".format(url, path))
        try:
            urlretrieve(url, path)
        except:
            pass
