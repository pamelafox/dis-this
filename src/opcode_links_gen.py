# Run this in cpython repo when tag is checked out for version
# This will generate a json file with opcode links for that version

opcode_links = {}

file = open("Include/patchlevel.h", "r")
for line in file.readlines():
    if line.startswith("#define PY_VERSION"):
        full_version = line.split()[2].strip('"')
        major_version = full_version.rsplit(".", 1)[0]
        break
file.close()

file = open("Include/opcode.h", "r")
lines = file.readlines()
file.close()

opcodes = []
for line in lines:
    if line.startswith("#define"):
        opcodes.append(line.split()[1]) # get opcode name

file = open("Doc/library/dis.rst", "r")
lines = file.readlines()
file.close()

for line in lines:
    if line.strip().startswith(".. opcode:: "):
        opcode = line.split(".. opcode:: ")[1].split()[0].strip()
        if opcode in opcodes:
            opcodes.remove(opcode)
            opcode_links[opcode] = f"https://docs.python.org/{major_version}/library/dis.html#opcode-%s" % opcode

file = open("Python/ceval.c", "r")
lines = file.readlines()
for line_no, line in enumerate(lines):
    if line.strip().startswith("TARGET("):
        opcode = line.split("TARGET(")[1].split(")")[0].strip()
    elif line.strip().startswith("[NB"):
        opcode = line.split("[")[1].split("]")[0].strip()
    if opcode in opcodes:
        opcode_links[opcode] = f"https://github.com/python/cpython/blob/v{full_version}/Python/ceval.c#L{line_no + 1}"
        opcodes.remove(opcode)

print("Remaining opcodes:")
print(opcodes)

# save opcode links to file, as json
import json
with open(f"opcodes_{major_version}.json", "w") as file:
    json.dump(opcode_links, file, indent=4)