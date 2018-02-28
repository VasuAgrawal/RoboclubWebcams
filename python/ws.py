#!/usr/bin/env python3

import asyncio
import websockets
import struct

clients = set()

# A simple echo server
async def echo(websocket, path):
    
    global clients
    # Completely ignore messages received from the socket. Just store the
    # connection and give up.
    # clients.add(websocket)
    # await websocket.send("welcome to this shitty app")

    magic = 'jsmp'.encode('ascii')
    magic += (480).to_bytes(2, byteorder='big')
    magic += (270).to_bytes(2, byteorder='big')
    await websocket.send(magic)

    clients.add(websocket)

    # Uhhhhhh there has to be a better way of doing this. If someone was to just
    # spam the system with messages, it would probably lock up entirely.
    async for message in websocket:
        pass


async def stream():
    # this.stream = child_process.spawn("ffmpeg", ["-rtsp_transport", "tcp", "-i", this.url, '-f', 'mpeg1video', '-b:v', '800k', '-r', '30', '-'], {

    input_command = ['-i', '/dev/video0',
            # '-pix_fmt', 'yuv420p'
            ]
    output1 = ['-f', 'mpeg1video',
                '-b:v', '100k', 
                '-vf', 'scale=480:-1', 
                '-r', '24',
                '-'
    ]

    # Segmented output for logging purposes. Log in 15 minute intervals.
    output2 = ['-f', 'segment',
                '-pix_fmt', 'yuv420p',
                '-segment_format', 'mkv',
                # '-segment_list', 'out_video.list', # Unnecessary?
                '-segment_time', str(60 * 15),
                '-segment_atclocktime', '1', # Split at even intervals
                # This option doesn't seem to be available?
                # '-segment_clocktime_offset', '5', # Based on camera count
                # '-strftime', '1', '%Y-%m-%d_%H-%M-%S.mkv']
                '-strftime', '1', 'out-%03d.mkv'
    ]

    ffmpeg_command = ['ffmpeg', 
                        '-hide_banner', 
                        '-loglevel', 'info',
    ]

    command = ffmpeg_command + input_command + output1 + output2
    # command = ['ffmpeg', '-re',
                # # '-i', '../nosound.mkv',
                # '-i', '/dev/video0',
                # '-f', 'mpeg1video',
                # '-b:v', '1000k',
                # '-vf', 'scale=480:-1',
                # '-r', '24',
                # '-']

    process = await asyncio.create_subprocess_exec(*command,
            stdout=asyncio.subprocess.PIPE)
    
    while True:
        line = await process.stdout.read(4096) # How much data (bytes) to read
        if line:
            # Send it to all of the clients
            for client in clients.copy():
                try:
                    await client.send(line)
                except Exception as e:
                    print("Disconnecting from client?")
                    print(e)
                    clients.remove(client)
        else:
            break


loop = asyncio.get_event_loop()
loop.create_task(stream())
loop.run_until_complete(
        websockets.serve(echo, 'localhost', 4242))
loop.run_forever()
