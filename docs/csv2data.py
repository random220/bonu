#!/usr/bin/env python3

import csv
import json

rows = []
with open('SUPPLY.csv', newline='') as csvfile:
    spamreader = csv.reader(csvfile, delimiter=',', quotechar='"')
    for row in spamreader:
        rows.append(row)

# ['id', '#', 'Category', 'Item', 'Qty', 'Unit', 'Mfg Date', 'Exp Date']
header = ['id', 'number', 'category', 'item', 'qty', 'unit', 'mfgDate', 'expDate']

data = []
n = len(header)
for row in rows[1:]:
    blob = {}
    for i in range(n):
        blob[header[i]] = row[i]
    data.append(blob)

print(json.dumps(data, indent=4))

