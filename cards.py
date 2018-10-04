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
manifest_mtga_json = json.loads(
    zlib.decompress(manifest_mtga.content, 16 + zlib.MAX_WBITS).decode("utf-8")
)

bundles = {"data_cards": None, "data_loc": None}

for a in manifest_mtga_json["Assets"]:
    for k in bundles.keys():
        if a["Name"].startswith(k):
            d = requests.get("{}/{}".format(CDN_URL, a["Name"]))
            buf = io.BytesIO(zlib.decompress(d.content, 16 + zlib.MAX_WBITS))
            buf.name = a["Name"]
            bundles[k] = unitypack.load(buf)

for (k, v) in bundles.items():
    if v is None:
        sys.exit("Could not find {} bundle".format(k))

cards_list = json.loads(
    list(bundles["data_cards"].assets[0].objects.values())[1].read().bytes
)
loc_list = json.loads(
    list(bundles["data_loc"].assets[0].objects.values())[0].read().bytes
)

with open("cards.json", "w") as f:
    f.write(json.dumps(cards_list))

loc = {}
for l in loc_list:
    if l["langkey"] == "EN":
        for v in l["keys"]:
            loc[v["id"]] = v["text"]

# Download images
failed = []
all_cards = []


def dl(url, path):
    try:
        urlretrieve(url, path)
        print("{} => {}".format(url, path))
    except:
        print("{} ... FAILED!".format(url))


for card in cards_list:
    id = str(card["grpid"])
    if card["CollectorNumber"] != "":
        _set = ("t" if card["isToken"] else "") + set_overrides.get(
            card["set"], card["set"].lower()
        )
        _num = card["CollectorNumber"]
        if _set == "tana":
            _set = ana
            _num = "T" + _num
        if _num.startswith("GR"):
            _set = "med"

        for [slang, tlang] in languages.items():
            c = cards_db.get((_set, _num, slang))
            if c is None:
                failed.append((slang, _set, _num, card["titleId"]))
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
                    dl(images["normal"], path)


# Update card db in client application
with open("client/src/main/cards.js", "w") as f:
    f.write("const AllCards = new Map([\n")
    for d in sorted(all_cards, key=lambda c: c["ArenaID"]):
        f.write(
            '\t[{ArenaID}, {{ID: "{ArenaID}", name: "{Name}", set: "{Set}", number: "{CollectorNumber}", color: "{Colors}", rarity: "{Rarity}", cmc: {CMC}, dualSided: {DualSided}}}],\n'.format(
                **d
            )
        )
    f.write("])\n\nexport default AllCards\n")

from collections import defaultdict

failedcsv = defaultdict(list)
for (lang, set, cid, tid) in failed:
    failedcsv[(set, cid, tid)].append(lang)

with open("cards.missing.csv", "w") as f:
    w = csv.writer(f)
    w.writerow(["set", "cid", "languages"])
    for k, v in failedcsv.items():
        w.writerow([k[0], k[1], " ".join(v)])
        if "en" in v:
            print("Missing card in english:", k[0], k[1], loc[k[2]])
