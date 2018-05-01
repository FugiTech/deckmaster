# Stolen from https://github.com/shawkinsl/mtga-tracker/blob/master/scripts/generate_base_mtga_id_lookup.py

import sys, os, time
sys.path.append("./mtga_tracker")
from util import all_mtga_cards
from urllib.request import urlretrieve

for card in all_mtga_cards.cards:
    if card.set_number < 0:
        continue
    folder = "overlay/public/cards/{:02d}".format(card.mtga_id%20)
    if not os.path.exists(folder):
        os.makedirs(folder)

    url = "https://img.scryfall.com/cards/png/en/{}/{:d}.png".format(card.set.lower(), card.set_number)
    path = "{}/{:d}.png".format(folder,card.mtga_id)
    if not os.path.exists(path):
        print("{} -> {}".format(url, path))
        try:
            urlretrieve(url, path)
        except:
            url = "https://img.scryfall.com/cards/png/en/{}/{:d}a.png".format(card.set.lower(), card.set_number)
            try:
                urlretrieve(url, path)
            except:
                pass

    url = "https://img.scryfall.com/cards/png/en/{}/{:d}b.png".format(card.set.lower(), card.set_number)
    path = "{}/{:d}_back.png".format(folder,card.mtga_id)
    if not os.path.exists(path):
        print("{} -> {}".format(url, path))
        try:
            urlretrieve(url, path)
        except:
            pass
