import asyncio
import copy
import logging
import pprint
import subprocess
import sys
import time
import websockets

from json_config_parser import load_config

class CameraStream(object):

    def __init__(self, config_path):
        self.config = load_config(config_path)
        self.logger = logging.getLogger(self.config['name'])

        self.logger.info("Loaded configuration: %s", self.config)
        self.clients = set()

        self.last_data_received_time = 0
        self.no_data_sleep = 0.5 # seconds. Sleep for a bit before continuing.
        self.no_data_timeout = 5 # If no data received for this long, reinit.


    async def init_camera(self):
        """Initialize the camera by opening the subprocess.

        This function will make the proper directory for logging, and start the
        ffmpeg recording subprocess.
        """

        # Make sure the logging directory exists
        # TODO: Find a way to do a permissions check? mkdir -p might just fail
        # silently and there might not be anything that can be done.
        subprocess.run(['mkdir', '-p', self.config['log_dir']])
       
        # Construct the output command. Copy the command to not nuke it.
        command = copy.deepcopy(self.config['ffmpeg_command'])
        command += self.config['input_command']
        for output_command in self.config['output_commands']:
            command += output_command

        self.logger.info("Executing command: %s", " ".join(command))

        # TODO: See if it's possible for this to throw an error?
        self.camera_process = await asyncio.create_subprocess_exec(
                *command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE)
                # TODO: Read from stderr and check for encoding warnings


    async def send_magic_bytes(self, client):
        # Send magic bytes to the client in order to initialize JSMPEG.
        magic = 'jsmp'.encode('ascii')
        magic += (self.config['image_width']).to_bytes(2, byteorder='big')
        magic += (self.config['image_height']).to_bytes(2, byteorder='big')
        
        try:
            await client.send(magic)
        except (ConnectionError, websockets.exceptions.ConnectionClosed) as e:
            self.logger.warning("Unable to initialize JSMPEG due to closed "
                    "connection to client %s. Error: %s", client, e)
            return None


    async def client_handler(self, websocket, path):
        """Handle websocket clients requesting camera data.

        First, magic bytes are sent to over the websocket in order to initalize
        JSMPEG. If configured correctly, add the websocket to the set of
        clients. Then, we perpetually listen to messages as a way to keep the
        socket connection alive.
        """
        # Send the magic bytes to the new websocket.
        await self.send_magic_bytes(websocket)

        # Only add the client to the set to serve after it's been initialized
        # with the magic bytes.
        self.clients.add(websocket)

        # The rest of this is a hack to keep the connection alive. It seems to
        # get dropped immediately if we're not listening to the socket?
        # TODO: Figure out a more sane way of doing this.
        while True:
            try:
                async for message in websocket:
                    self.logger.debug("Ignoring message coming from %s.", path)
            except (ConnectionError, 
                    websockets.exceptions.ConnectionClosed) as e:
                self.logger.info("Connection closed when listening for "
                        "messages from %s. Removing client from client set. "
                        "Error: %s", path, e)
                self.clients.remove(websocket)
                return None

    
    async def reinit_stream(self):
        """Reinitialize input camera stream."""
        try:
            self.camera_process.terminate()
        except Exception as e:
            # Assume it's terminated and just ignore for now.
            self.logger.warning("Unable to terminate camera process. Ignoring. "
                    "Error: %s.", e)

        # Go through all of the clients and reinitialize the magic bytes. Maybe
        # this works?
        for client in self.clients.copy():
            await self.send_magic_bytes(client)


        await self.init_camera()

    
    async def send_chunk_to_clients(self, chunk):
        self.last_data_received_time = time.time()
        for client in self.clients.copy(): # Async-safety or something.
            try:
                await client.send(chunk)
            except (ConnectionError, 
                    websockets.exceptions.ConnectionClosed) as e:
                self.logger.info("Attempting to send chunk to client, "
                        "but an exception occured. Client: %s, "
                        "Error: %s", client, e)
                self.clients.remove(client)


    async def stream(self):
        while True:
            # First, read from the camera.
            try:
                chunk = await self.camera_process.stdout.read(
                            self.config['chunk_size'])
            except Exception as e:
                # TODO: Determine exactly what kind of errors are happening.
                self.logger.warning("Exception occured while reading from "
                        "camera. Will continue to attempt to read, for now. "
                        "Error: %s", e)
                continue

            # If a chunk was successfully received, attempt to broadcast it to
            # all of the clients. Clean up clients which have disconnected.
            if chunk:
                await self.send_chunk_to_clients(chunk)
            else:
                self.logger.warning("Nothing received from camera. Ignoring "
                        "this error for now. Hopefully it doesn't persist.")
                await asyncio.sleep(self.no_data_timeout) 

                # If we haven't received data in a while, just try to restart.
                time_since_data = time.time() - self.last_data_received_time
                if time_since_data >= self.no_data_timeout:
                    self.logger.warning("No data received for %f seconds. "
                            "Restarting the camera process.", time_since_data)
                    await self.reinit_stream()


    # This will initialize the camera and server.
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
