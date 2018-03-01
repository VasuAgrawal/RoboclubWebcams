import asyncio
import websockets
import logging
import sys

from camera_stream import CameraStream

def main():
    logging.basicConfig(level=logging.INFO)
    loop = asyncio.get_event_loop()

    # Initialize all of the streams and their cameras
    with open(sys.argv[1], 'r') as manifest:
        cameras_configs = [line.strip() for line in manifest.readlines()]
        streams = map(CameraStream, cameras_configs)

    for stream in streams:
        loop.run_until_complete(stream.init_stream(loop))

    # And start serving finally.
    loop.run_forever()


if __name__ == "__main__":
    main()
