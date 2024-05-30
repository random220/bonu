#!/usr/bin/env python3

import csv
import json
import sys

sheet_columns = ["id", "#", "Category", "Item", "Qty", "Unit", "Mfg Date", "Exp Date"]
data_columns  = ["id","number","category","item","qtyInitial","unit","mfgDate","expDate"]

rows = []
csvfile = 'SUPPLY.csv'
if len(sys.argv) == 2:
    csvfile = sys.argv[1]

with open(csvfile, newline='') as csvfile:
    spamreader = csv.reader(csvfile, delimiter=',', quotechar='"')
    for row in spamreader:
        rows.append(row)

csv_columns = rows[0]
for i in range(len(csv_columns)):
    if csv_columns[i] != sheet_columns[i]:
        print('CSV has differing column names from expected !!')
        sys.exit(1)
    
header = data_columns

data = []
n = len(header)
for row in rows[1:]:
    blob = {}
    for i in range(n):
        blob[header[i]] = row[i]
    data.append(blob)

print(json.dumps(data, indent=4))

