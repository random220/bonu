#!/usr/bin/env python3

import csv
import json
import sys

rows = []
csvfile = 'a.csv'
if len(sys.argv) == 2:
    csvfile = sys.argv[1]

with open(csvfile, newline='') as csvfile:
    spamreader = csv.reader(csvfile, delimiter=',', quotechar='"')
    for row in spamreader:
        rows.append(row)

header = rows[0]

data = []
n = len(header)
for row in rows[1:]:
    blob = {}
    for i in range(n):
        blob[header[i]] = row[i]
    data.append(blob)

print(json.dumps(data, indent=4))

