import asyncio
import websockets

from camera_stream import CameraStream

def main():
    loop = asyncio.get_event_loop()

    # Initialize all of the streams and their cameras
    # streams = map(CameraStream, ["cameras/laptop_webcam.json"])
    streams = map(CameraStream, ["cameras/video_stream.json"])
    for stream in streams:
        loop.run_until_complete(stream.init_stream(loop))

    # And start serving finally.
    loop.run_forever()


if __name__ == "__main__":
    main()
