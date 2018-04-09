import asyncio
import logging
import os
import websockets

class StreamServer(object):
    def __init__(self, output_config):
        self.output_config = output_config 
        self.logger = logging.getLogger(".".join([
            self.output_config.camera_name,
            self.output_config.output_name
        ]))

        self.clients = set()


    async def init(self):
        """Perform all initialization necessary for the streaming server.
        
        This will initialize the websocket server to start serving the stream on
        the specified port. This will also queue up the task to read from the
        pipe, which requires a call to loop.run_forever()."""
       
        # First line in any asyncio function ...
        loop = asyncio.get_event_loop()

        # Initialize thing to read from the pipe.
        self.logger.info("Opening output pipe %s",
                self.output_config.get_output_path())
        output_fd = os.open(self.output_config.get_output_path(), 
                os.O_RDONLY, os.O_NONBLOCK)
        self.logger.debug("Output FD: %d", output_fd)

        reader = asyncio.StreamReader()
        read_protocol = asyncio.StreamReaderProtocol(reader)
        read_transport, _ = await loop.connect_read_pipe(
                lambda: read_protocol, os.fdopen(output_fd))
        self.reader = reader
        self.logger.info("Initialized StreamReader.")

        # Initialize the websocket server.
        self.logger.info("Starting websocket server on %s:%d.",
                self.output_config.config['hostname'],
                self.output_config.config['ws_port'])
                
        await websockets.serve(
                self.client_handler, 
                self.output_config.config['hostname'],
                self.output_config.config['ws_port']
        )

        self.logger.debug("Scheduling broadcaster!")
        loop.create_task(self.broadcast())


    async def client_handler(self, client, path):
        """Handler for incoming websocket connections.

        This method performs verification against the websocket connection
        before adding it to the client set. The connection is closed
        automatically when this connection is closed.

        Args:
            client: WebSocketServerProtocol object from websocket library.
            path: Request URI.
        """
        self.clients.add(client)
        self.logger.info("Received new connection request from %s (%s, %s), %s",
                client, client.local_address, client.remote_address, path)

        # Send the magic bytes to configure JSMPEG
        self.logger.info("Sending magic bytes to client.")
        await self.send_magic_bytes(client)

        while True:
            await asyncio.sleep(0.5)
            if not client.open:
                try:
                    self.clients.remove(client)
                    self.logger.info("Removed client %s, %s from clients",
                            client, path)
                except KeyError as e:
                    # It's been removed elsewhere, that's fine.
                    pass
                except Exception as e:
                    self.logger.exception(e)
                return
    
    
    async def send_magic_bytes(self, client):
        """Send the magic bytes needed to initialize JSMPEG stream.

        This should let the JSMPEG stream figure out the parameters of the
        output video so it can properly decode it. Also, this is used to size
        the canvas.

        Args:
            client: WebSocketProtocolObject to send data to.
        """

        # Send magic bytes to the client in order to initialize JSMPEG.
        magic = 'jsmp'.encode('ascii')
        magic += (self.output_config.config['image_width']).to_bytes(
                    2, byteorder='big')
        magic += (self.output_config.config['image_height']).to_bytes(
                    2, byteorder='big')
       
        # Try to send, and give up at the first sign of any errors.
        try:
            await client.send(magic)
        except Exception as e:
            self.logger.warning("Unable to initialize JSMPEG. Removing client.")
            self.logger.exception(e)
            self.clients.remove(client)


    async def broadcast(self):
        """Broadcast webcam data to all connected clients.

        This function will spin endlessly trying to grab data from the camera.
        Camera read exceptions are ignored. Sends that fail to a client will
        cause the client to be removed from the list of clients.
        """

        while True:
            # Attempt to read from the chunk
            try:
                chunk = await self.reader.read(4096)
            except Exception as e:
                self.logger.exception(e)
                continue # Basically just ignore errors.

            if chunk: # Chunk is defined, but may still be None (read nothing)
                clients = self.clients.copy()
                self.logger.debug("Sending chunk to %d clients.", len(clients))

                for client in clients:
                    try:
                        await client.send(chunk)
                    except websockets.exceptions.ConnectionClosed as e:
                        self.clients.remove(client) # Remove offender
                        self.logger.info("Closed connection to client (%s, %s)",
                                client.local_address, client.remote_address)
                    except Exception as e:
                        self.clients.remove(client) # Remove offender
                        self.logger.exception(e)
