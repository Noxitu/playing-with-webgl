import re
import os
import struct

BASE = os.path.dirname(__file__)

with open(os.path.join(BASE, 'Fontana.full.ply'), 'rb') as fd:
    buffer = fd.read()

header, buffer = buffer.split(b'end_header', 1)
if buffer.startswith(b'\r\n'):
    buffer = buffer[2:]
else:
    buffer = buffer[1:]

header = header.decode('utf-8')
print(header)

vertex_count = int(re.search(R'element vertex (\d+)', header).group(1))
face_count = int(re.search(R'element face (\d+)', header).group(1))

offset = 0
vertices = []
faces_unpacked = []

for _ in range(vertex_count):
    x, y, z = struct.unpack_from('<fff', buffer, offset)
    x, y, z = x, -z, y
    vertices.append((x, y, z))
    offset += struct.calcsize('<fff')

for _ in range(face_count):
    data = struct.unpack_from('<xiiixffffff', buffer, offset)
    offset += struct.calcsize('<xiiixffffff')

    for index, u, v in zip(data[0:3], data[3::2], data[4::2]):
        faces_unpacked.append(list(vertices[index]) + [u, 1.0-v])

with open(os.path.join(BASE, 'Fontana.buffer'), 'wb') as fd:
    for row in faces_unpacked   :
        fd.write(struct.pack('fffff', *row))