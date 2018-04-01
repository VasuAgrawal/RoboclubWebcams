#!/usr/bin/env python3.6

import asyncio
import websockets

clients = set()

async def echo(websocket, path):
    clients.add(websocket) 
    
    while True:
        await asyncio.sleep(1)
        # Consider trying to read from the socket here.


async def broadcast():
    message = "Hello world!"
    while True:
        for client in clients.copy():
            try:
                await client.send(message)
            except Exception as e:
                print(e)
        print("Going to sleep!")
        await asyncio.sleep(0.5)

asyncio.get_event_loop().set_debug(True)
asyncio.get_event_loop().create_task(broadcast())
asyncio.get_event_loop().run_until_complete(
    websockets.serve(echo, 'localhost', 8765))
asyncio.get_event_loop().run_forever()
