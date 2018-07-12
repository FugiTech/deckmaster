import sys, os, io, json, csv, zlib
import requests
import unitypack
from urllib.request import urlretrieve

# Map from Arena set name -> Scryfall set name
set_overrides = {
    "DAR": "dom"
}

# Map from Scryfall language code -> Twitch language code
languages = {
    "en": "en", # English
    # "es": "es", # Spanish
    # "fr": "fr", # French
    # "de": "de", # German
    # "it": "it", # Italian
    # "pt": "pt", # Portuguese
    # "ja": "ja", # Japanese
    # "ko": "ko", # Korean
    # "ru": "ru", # Russian
    # # Twitch just gives us "zh" for both, so just use Simplified
    # "zhs": "zh", # Simplified Chinese
    # #"zht": "zh", # Traditional Chinese
}

# Load data about cards we've seen before
cards_db = {}
if os.path.exists("cards.csv"):
    with open("cards.csv", "r") as f:
        reader = csv.DictReader(f)
        for card in reader:
            cards_db[card["ArenaID"]] = card

# Download the latest cards.json from wizards
CDN_URL = "http://mtga-assets.dl.wizards.com"

version = sys.argv[1].strip("v")
if version == "":
    sys.exit("usage: python cards.py <mtga version>")

external_mtga = requests.get("{}/External_{}.mtga".format(CDN_URL, version))
manifest_mtga = requests.get("{}/Manifest_{}.mtga".format(CDN_URL, external_mtga.text.strip()))
if manifest_mtga.content[0] != '{':
    # deal with case when content remains compressed
    manifest_mtga_json = json.loads(zlib.decompress(manifest_mtga.content, 16+zlib.MAX_WBITS).decode('utf-8'))
else:
    manifest_mtga_json = manifest_mtga.json()

data_cards_name = None
for a in manifest_mtga_json["Assets"]:
    if a["Name"].startswith("data_cards_"):
        data_cards_name = a["Name"]
        break
if data_cards_name is None:
    sys.exit("Could not find card data")
data_cards = requests.get("{}/{}".format(CDN_URL, data_cards_name))
buf = io.BytesIO(zlib.decompress(data_cards.content, 16+zlib.MAX_WBITS))
buf.name = data_cards_name
bundle = unitypack.load(buf)
cards_file = list(bundle.assets[0].objects.values())[1]
cards_json = json.loads(cards_file.read().bytes)
with open("cards.json", "w") as f:
    f.write(cards_file.read().bytes)

# Add cards to cards_db, using scryfall to get additional info
for card in cards_json:
    id = str(card["grpid"])
    if id not in cards_db and card["set"] != "ANA":
        set = ("t" if card["isToken"] else "") + set_overrides.get(card["set"], card["set"].lower())
        sfd = requests.get("https://api.scryfall.com/cards/{}/{}".format(set, card["CollectorNumber"])).json()
        cards_db[id] = {
            "ArenaID": id,
            "ScryfallID": sfd["id"],
            "Set": sfd["set"],
            "CollectorNumber": sfd["collector_number"],
            "Name": sfd["name"],
            "Rarity": sfd["rarity"],
            "CMC": str(int(sfd["cmc"])),
            "Colors": "".join(sfd["color_identity"]),
            "DualSided": str(sfd["layout"] in ("transform",)).lower(),
        }

# Export cards db
with open("cards.csv", "w") as f:
    writer = csv.DictWriter(f, fieldnames=["ArenaID", "ScryfallID", "Set", "CollectorNumber", "Name", "Rarity", "CMC", "Colors", "DualSided"])
    writer.writeheader()
    for key in sorted(cards_db.keys()):
        writer.writerow(cards_db[key])

# Download images
def dl(url, path):
    try:
        urlretrieve(url, path)
        print("{} => {}".format(url, path))
    except:
        print("{} ... FAILED!".format(url))

for card in cards_db.values():
    for [slang, tlang] in languages.items():
        folder = "cards/{}/{:02d}".format(tlang, int(card["ArenaID"])%20)
        if not os.path.exists(folder):
            os.makedirs(folder)

        url = "https://img.scryfall.com/cards/normal/{}/{}/{}".format(slang, card["Set"], card["CollectorNumber"])
        if " // " in card["Name"]:
            path = "{}/{}.jpg".format(folder, card["ArenaID"])
            if not os.path.exists(path):
                dl(url+"a.jpg", path)
        elif card["DualSided"] == "true":
            path = "{}/{}.jpg".format(folder, card["ArenaID"])
            if not os.path.exists(path):
                dl(url+"a.jpg", path)
            path = "{}/{}_back.jpg".format(folder, card["ArenaID"])
            if not os.path.exists(path):
                dl(url+"b.jpg", path)
        else:
            path = "{}/{}.jpg".format(folder, card["ArenaID"])
            if not os.path.exists(path):
                dl(url+".jpg", path)

# Update card db in client application
with open("client/types/cards.go", "w") as f:
    f.write("package types\n\nvar AllCards = map[int]Card{\n")
    for key in sorted(cards_db.keys()):
        d = cards_db[key]
        f.write('\t{ArenaID}: Card{{"{ArenaID}", "{Name}", "{Set}", {CollectorNumber}, "{Colors}", "{Rarity}", {CMC}, {DualSided}}},\n'.format(**d))
    f.write("}\n")
