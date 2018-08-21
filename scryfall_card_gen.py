import sys, os, io, json, csv, zlib
import requests
import unitypack
from urllib.request import urlretrieve

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

bundles = {
  "data_cards": None,
  "data_loc": None,
  "ANA_cardart": None,
}


for a in manifest_mtga_json["Assets"]:
  for k in bundles.keys():
    if a["Name"].startswith(k):
      d = requests.get("{}/{}".format(CDN_URL, a["Name"]))
      buf = io.BytesIO(zlib.decompress(d.content, 16+zlib.MAX_WBITS))
      buf.name = a["Name"]
      bundles[k] = unitypack.load(buf)

for (k, v) in bundles.items():
  if v is None:
    sys.exit("Could not find {} bundle".format(k))


cards_list = json.loads(list(bundles["data_cards"].assets[0].objects.values())[1].read().bytes)
loc_list = json.loads(list(bundles["data_loc"].assets[0].objects.values())[1].read().bytes)

abilities = {}
for v in abilities_list:
  abilities[v["id"]] = v

loc = {}
for l in loc_list:
  if l["langkey"] == "EN":
    for v in l["keys"]:
      loc[v["id"]] = v["text"]
  else:
    print(l["langkey"])

toPrint = []
for c in cards_list:
  if c["set"] == "ANA":
    toPrint.append(c)
toPrint.sort(key=lambda c: int(c["CollectorNumber"] or "0"))

for c in toPrint:
  typ = loc[c["cardTypeTextId"]]
  if c["subtypeTextId"] != 0:
    typ += " - " + loc[c["subtypeTextId"]]
  print(c["CollectorNumber"],":", loc[c["titleId"]], "---", typ)
  for a in c["abilities"]:
    print("\t", loc[a["textId"]])
