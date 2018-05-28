import csv
import requests

print("""package types

var AllCards = map[int]Card{""")
with open('cards.txt', newline='') as f:
    r = csv.reader(f)
    for [id, set, setnum] in r:
        r = requests.get("https://api.scryfall.com/cards/{}/{}".format(set.lower(), setnum))
        d = r.json()
        print('{}: Card{{ "{}", "{}", []string{{ {} }}, "{}", {}, {:0.0f} }},'.format(id, id, d["name"], ",".join(['"{}"'.format(v) for v in d["color_identity"]]), d["rarity"], "false" if d["layout"] == "normal" else "true", d["cmc"] ))
print("}")
