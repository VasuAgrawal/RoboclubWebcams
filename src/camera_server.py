import asyncio
import logging

from outputs.streamable_output import StreamableOutput
from stream_server import StreamServer

class CameraServer(object):

    def __init__(self, camera_config):
        """Constructor for CameraServer.

        Initializes a CameraServer given the camera configuration. No processes
        are started in this method, since it is not asynchronous.

        Args:
            camera_config: Camera configuration object specifying inputs and
                (potentially multiple) outputs to stream.
        """
        self.camera_config = camera_config
        self.logger = logging.getLogger(self.camera_config.camera_name)

        self.logger.info("Loaded configuration: %s", self.camera_config)
        #  self.clients = set()
        #  
        #  self.last_data_received_time = 0
        #  self.no_data_sleep = 0.5 # seconds. Sleep for a bit before continuing.
        #  self.no_data_timeout = 5 # If no data received for this long, reinit.


    async def create_ffmpeg_process(self):
        """Create FFMPEG process based on the camera configuration.

        This just sets up the FFMPEG process as an asyncio subprocess.

        There's potentially a problem here. If the ffmpeg process is started
        before the servers, it could fill the buffer in the pipe before the
        servers have a chance to start consuming. The fix would be to start
        the consumers before the ffmpeg process, but that might be difficult.
        """

        # First, set up the preliminaries for each configuration.
        command = self.camera_config.get_command()
        self.logger.info("Executing command: %s", " ".join(command))
        
        # TODO: Read outputs and check for errors
        self.camera_process = await asyncio.create_subprocess_exec(
                *command,)
                #  stdout=asyncio.subprocess.PIPE,
                #  stderr=asyncio.subprocess.PIPE)


    async def init_stream_servers(self):
        """Initialize and queue up stream servers for every streamable output.

        All StreamableOutput type outputs can be streamed to the internet via a
        StreamServer. This function will get each of the StreamServers
        initialized and waiting.
        """
        for output in self.camera_config.output_objs:
            if isinstance(output, StreamableOutput):
                self.logger.debug("Starting stream server for %s.", output)
                stream_server = StreamServer(output)
                await stream_server.init()
