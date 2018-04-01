import asyncio
import logging
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

        # Initialize thing to read from the pipe.
        self.logger.info("Opening output pipe %s",
                self.output_config.get_output_path())
        output_fd = open(self.output_config.get_output_path(), 'rb')
        self.logger.debug("Output FD: %d", output_fd)

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
        loop = asyncio.get_event_loop()
        #  loop.create_task(self.broadcast())


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
        self.logger.debug("Received new connection request from %s, %s",
                client, path)

        # Send the magic bytes to configure JSMPEG
        await self.send_magic_bytes(client)

        while True:
            await asyncio.sleep(0.5)
            if not client.open:
                try:
                    self.clients.remove(client)
                    self.logger.debug("Removed client %s, %s from clients",
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


    #  async def broadcast(self):
    #      message = "HLLO WORLD?!@?#!?@#"
    #      while True:
    #          for client in self.clients.copy():
    #              try:
    #                  await client.send(message)
    #              except Exception as e:
    #                  self.logger.exception(e)
    #                  self.clients.remove(client)
    #  
    #          self.logger.debug("Broadcaster going to sleep for 1 second!")
    #          await asyncio.sleep(1)

    
    # async def reinit_stream(self):
        # """Reinitialize input camera stream."""
        # try:
            # self.camera_process.terminate()
        # except Exception as e:
            # # Assume it's terminated and just ignore for now.
            # self.logger.warning("Unable to terminate camera process. Ignoring. "
                    # "Error: %s.", e)

        # # Go through all of the clients and reinitialize the magic bytes. Maybe
        # # this works?
        # for client in self.clients.copy():
            # await self.send_magic_bytes(client)


        # await self.init_camera()

    
    # async def send_chunk_to_clients(self, chunk):
        # self.last_data_received_time = time.time()
        # for client in self.clients.copy(): # Async-safety or something.
            # try:
                # await client.send(chunk)
            # except (ConnectionError, 
                    # websockets.exceptions.ConnectionClosed) as e:
                # self.logger.info("Attempting to send chunk to client, "
                        # "but an exception occured. Client: %s, "
                        # "Error: %s", client, e)
                # self.clients.remove(client)


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

                # # If we haven't received data in a while, just try to restart.
                # time_since_data = time.time() - self.last_data_received_time
                # if time_since_data >= self.no_data_timeout:
                    # self.logger.warning("No data received for %f seconds. "
                            # "Restarting the camera process.", time_since_data)
                    # await self.reinit_stream()

