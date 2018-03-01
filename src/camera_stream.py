import pprint
import asyncio
import websockets

from json_config_parser import load_config

class CameraStream(object):

    def __init__(self, config_path):
        self.config = load_config(config_path)
        self.clients = set()
        pprint.pprint(self.config)


    async def init_camera(self):
        command = self.config['ffmpeg_command']
        command += self.config['input_command']
        for output_command in self.config['output_commands']:
            command += output_command

        self.camera_process = await asyncio.create_subprocess_exec(
                *command,
                stdout=asyncio.subprocess.PIPE)
                # TODO: Read from stderr and check for encoding warnings


    async def client_handler(self, websocket, path):
        magic = 'jsmp'.encode('ascii')
        magic += (480).to_bytes(2, byteorder='big')
        magic += (270).to_bytes(2, byteorder='big')
        await websocket.send(magic)

        # Only add the client to the set to serve after it's been initialized
        # with the magic bytes.
        self.clients.add(websocket)

        # ... TODO: There has to be a better way of keeping the connection alive
        async for message in websocket:
            pass


    async def stream(self):
        # TODO: Better error handling here.
        while True:
            chunk = await self.camera_process.stdout.read(
                    self.config['chunk_size'])

            if chunk: # Sent chunk to all existing clients
                for client in self.clients.copy():
                    try:
                        await client.send(chunk)
                    except Exception as e:
                        print("Disconnecting from client!")
                        print(e)
                        self.clients.remove(client)
            else: # Nothing received from camera, or stream is shut down.
                break


    # This will initializ the camera and server.
    async def init_stream(self, loop):
        await self.init_camera() # Initialize the camera once to begin with.
        await websockets.serve(
                self.client_handler,
                self.config['hostname'],
                self.config['ws_port']
        )

        # Once everything is initialized, start streaming camera data.
        loop.create_task(self.stream())


def _test_camera_stream():
    CameraStream("cameras/laptop_webcam.json")


if __name__ == "__main__":
    _test_camera_stream()
