import sys, os, io, json, csv, zlib, copy
import requests
import unitypack
from urllib.request import urlretrieve

# Map from Arena set name -> Scryfall set name
set_overrides = {"DAR": "dom"}

# Map from Scryfall language code -> Twitch language code
languages = {
    "en": "en",  # English
    "es": "es",  # Spanish
    "fr": "fr",  # French
    "de": "de",  # German
    "it": "it",  # Italian
    "pt": "pt",  # Portuguese
    "ja": "ja",  # Japanese
    "ko": "ko",  # Korean
    "ru": "ru",  # Russian
    # Twitch just gives us "zh" for both, so just use Simplified
    "zhs": "zh",  # Simplified Chinese
    # #"zht": "zh", # Traditional Chinese
}

# Load data about cards we've seen before
cards_db = {}
scryfall_data = requests.get(
    "https://archive.scryfall.com/json/scryfall-all-cards.json"
).json()
for o in scryfall_data:
    if o["object"] != "card":
        continue
    cards_db[(o["set"], o["collector_number"], o["lang"])] = {
        "ScryfallID": o["id"],
        "Set": o["set"],
        "CollectorNumber": o["collector_number"],
        "Name": o["name"],
        "Rarity": o["rarity"],
        "CMC": str(int(o["cmc"])),
        "Colors": "".join(o["color_identity"]),
        "DualSided": str(o["layout"] in ("transform",)).lower(),
        "Images": [o["image_uris"]]
        if "image_uris" in o
        else [cf["image_uris"] for cf in o["card_faces"]],
    }

# Download the latest cards.json from wizards
CDN_URL = "http://mtga-assets.dl.wizards.com"

version = sys.argv[1].strip("v")
if version == "":
    sys.exit("usage: python cards.py <mtga version>")

external_mtga = requests.get("{}/External_{}.mtga".format(CDN_URL, version))
manifest_mtga = requests.get(
    "{}/Manifest_{}.mtga".format(CDN_URL, external_mtga.text.strip())
)
if manifest_mtga.content[0] != "{":
    # deal with case when content remains compressed
    manifest_mtga_json = json.loads(
        zlib.decompress(manifest_mtga.content, 16 + zlib.MAX_WBITS).decode("utf-8")
    )
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
buf = io.BytesIO(zlib.decompress(data_cards.content, 16 + zlib.MAX_WBITS))
buf.name = data_cards_name
bundle = unitypack.load(buf)
cards_file = list(bundle.assets[0].objects.values())[1]
cards_json = json.loads(cards_file.read().bytes)
with open("cards.json", "w") as f:
    f.write(cards_file.read().bytes)

# Download images
failed = []
all_cards = []


def dl(url, path):
    try:
        urlretrieve(url, path)
        print("{} => {}".format(url, path))
    except:
        print("{} ... FAILED!".format(url))


for card in cards_json:
    id = str(card["grpid"])
    if card["CollectorNumber"] != "":
        _set = ("t" if card["isToken"] else "") + set_overrides.get(
            card["set"], card["set"].lower()
        )
        _num = card["CollectorNumber"]
        if _set == "tana":
            _set = ana
            _num = "T" + _num

        for [slang, tlang] in languages.items():
            c = cards_db.get((_set, _num, slang))
            if c is None:
                failed.append((slang, _set, _num))
                continue
            if tlang == "en":
                cc = copy.copy(c)
                cc["ArenaID"] = id
                all_cards.append(cc)

            folder = "cards/{}/{:02d}".format(tlang, int(id) % 20)
            if not os.path.exists(folder):
                os.makedirs(folder)

            for (images, path) in zip(
                c["Images"],
                ["{}/{}.jpg".format(folder, id), "{}/{}_back.jpg".format(folder, id)],
            ):
                if not os.path.exists(path):
                    dl(images["large"], path)


# Update card db in client application
with open("client/src/main/cards.js", "w") as f:
    f.write("const AllCards = new Map([\n")
    for d in sorted(all_cards, key=lambda c: c["ArenaID"]):
        f.write(
            '\t[{ArenaID}, {{ID: "{ArenaID}", name: "{Name}", set: "{Set}", number: {CollectorNumber}, color: "{Colors}", rarity: "{Rarity}", cmc: {CMC}, dualSided: {DualSided}}}],\n'.format(
                **d
            )
        )
    f.write("])\n\nexport default AllCards\n")

from collections import defaultdict

failedcsv = defaultdict(list)
for (lang, set, cid) in failed:
    failedcsv[(set, cid)].append(lang)

with open("cards.missing.csv", "w") as f:
    w = csv.writer(f)
    w.writerow(["set", "cid", "languages"])
    for k, v in failedcsv.items():
        w.writerow([k[0], k[1], " ".join(v)])
